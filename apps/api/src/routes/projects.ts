import { FastifyInstance, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  CreateProjectRequestSchema,
  ProjectIdSchema,
  UpdateProjectRequestSchema,
  ProjectSchema,
  type Project,
} from '@bluebird/types'
import { prisma } from '../lib/db.js'
import { requireAuth, requireIdempotencyKey, type AuthenticatedRequest } from '../lib/middleware.js'
import { createRouteLogger } from '../lib/logger.js'

const log = createRouteLogger('/projects', 'routes')
const ProjectParamsSchema = z.object({
  projectId: ProjectIdSchema,
})
const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

/**
 * POST /projects
 * Create a new project
 */
export async function createProjectHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const body = request.body as z.infer<typeof CreateProjectRequestSchema>

  try {
    const project = await prisma.project.create({
      data: {
        userId: user.userId,
        ...body,
      },
    })

    return reply.code(201).send({
      id: project.id,
      userId: project.userId,
      name: project.name,
      lyrics: project.lyrics,
      genre: project.genre,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    } as Project)
  } catch (error) {
    log.error({ error, userId: user.userId }, 'Failed to create project')
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to create project',
    })
  }
}

/**
 * GET /projects
 * List all projects for the authenticated user
 */
export async function listProjectsHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const parsedQuery = ListProjectsQuerySchema.safeParse(request.query)
  if (!parsedQuery.success) {
    return reply
      .code(400)
      .send({ message: 'Invalid query parameters', details: parsedQuery.error.format() })
  }

  const { page, pageSize } = parsedQuery.data

  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize + 1, // fetch one extra to know if there is a next page
    })

    const hasNextPage = projects.length > pageSize
    const pageItems = hasNextPage ? projects.slice(0, pageSize) : projects

    const projectsResponse: Project[] = pageItems.map((p: (typeof projects)[number]) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      lyrics: p.lyrics,
      genre: p.genre,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))

    reply.header('x-has-next-page', hasNextPage ? 'true' : 'false')

    return reply.code(200).send(projectsResponse)
  } catch (error) {
    log.error({ error, userId: user.userId }, 'Failed to list projects')
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to list projects',
    })
  }
}

/**
 * GET /projects/:projectId
 * Get a single project
 */
export async function getProjectHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const parsedParams = ProjectParamsSchema.safeParse(request.params)
  if (!parsedParams.success) {
    return reply
      .code(400)
      .send({ message: 'Invalid request parameters', details: parsedParams.error.format() })
  }

  const { projectId } = parsedParams.data

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return reply.code(404).send({ message: 'Project not found' })
    }

    if (project.userId !== user.userId) {
      return reply.code(403).send({ message: 'Forbidden' })
    }

    return reply.code(200).send({
      id: project.id,
      userId: project.userId,
      name: project.name,
      lyrics: project.lyrics,
      genre: project.genre,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    } as Project)
  } catch (error) {
    log.error({ error, projectId, userId: user.userId }, 'Failed to fetch project')
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to get project',
    })
  }
}

/**
 * PUT /projects/:projectId
 * Update a project
 */
export async function updateProjectHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const parsedParams = ProjectParamsSchema.safeParse(request.params)
  if (!parsedParams.success) {
    return reply
      .code(400)
      .send({ message: 'Invalid request parameters', details: parsedParams.error.format() })
  }

  const body = UpdateProjectRequestSchema.safeParse(request.body)
  if (!body.success) {
    return reply.code(400).send({ message: 'Invalid request', details: body.error.format() })
  }

  try {
    // Check ownership
    const project = await prisma.project.findUnique({
      where: { id: parsedParams.data.projectId },
    })

    if (!project) {
      return reply.code(404).send({ message: 'Project not found' })
    }

    if (project.userId !== user.userId) {
      return reply.code(403).send({ message: 'Forbidden' })
    }

    // Update
    const updated = await prisma.project.update({
      where: { id: parsedParams.data.projectId },
      data: body.data,
    })

    return reply.code(200).send({
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      lyrics: updated.lyrics,
      genre: updated.genre,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    } as Project)
  } catch (error) {
    log.error(
      { error, projectId: parsedParams.success ? parsedParams.data.projectId : undefined },
      'Failed to update project'
    )
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to update project',
    })
  }
}

/**
 * DELETE /projects/:projectId
 * Delete a project
 */
export async function deleteProjectHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const parsedParams = ProjectParamsSchema.safeParse(request.params)
  if (!parsedParams.success) {
    return reply
      .code(400)
      .send({ message: 'Invalid request parameters', details: parsedParams.error.format() })
  }

  try {
    // Check ownership
    const project = await prisma.project.findUnique({
      where: { id: parsedParams.data.projectId },
    })

    if (!project) {
      return reply.code(404).send({ message: 'Project not found' })
    }

    if (project.userId !== user.userId) {
      return reply.code(403).send({ message: 'Forbidden' })
    }

    // Delete
    await prisma.project.delete({
      where: { id: parsedParams.data.projectId },
    })

    return reply.code(204).send()
  } catch (error) {
    log.error(
      { error, projectId: parsedParams.success ? parsedParams.data.projectId : undefined },
      'Failed to delete project'
    )
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to delete project',
    })
  }
}

export function registerProjectRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/projects',
    {
      schema: {
        body: CreateProjectRequestSchema,
        response: {
          201: ProjectSchema,
        },
        tags: ['Projects'],
        description: 'Create a new project',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    createProjectHandler
  )
  app.get(
    '/projects',
    {
      schema: {
        querystring: ListProjectsQuerySchema,
        response: {
          200: z.array(ProjectSchema),
        },
        tags: ['Projects'],
        description: 'List all projects',
      },
      preHandler: [requireAuth],
    },
    listProjectsHandler
  )
  app.get(
    '/projects/:projectId',
    {
      schema: {
        params: ProjectParamsSchema,
        response: {
          200: ProjectSchema,
          404: z.object({ message: z.string() }),
        },
        tags: ['Projects'],
        description: 'Get a project by ID',
      },
      preHandler: [requireAuth],
    },
    getProjectHandler
  )
  app.put(
    '/projects/:projectId',
    {
      schema: {
        params: ProjectParamsSchema,
        body: UpdateProjectRequestSchema,
        response: {
          200: ProjectSchema,
          404: z.object({ message: z.string() }),
        },
        tags: ['Projects'],
        description: 'Update a project',
      },
      preHandler: [requireAuth],
    },
    updateProjectHandler
  )
  app.delete(
    '/projects/:projectId',
    {
      schema: {
        params: ProjectParamsSchema,
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
        tags: ['Projects'],
        description: 'Delete a project',
      },
      preHandler: [requireAuth],
    },
    deleteProjectHandler
  )
}
