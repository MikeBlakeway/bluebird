import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  type Project,
} from '@bluebird/types'
import { prisma } from '../lib/db.js'

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string
    email: string
  }
}

/**
 * POST /projects
 * Create a new project
 */
export async function createProjectHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const body = CreateProjectRequestSchema.parse(request.body)

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
    // eslint-disable-next-line no-console
    console.error('[CREATE PROJECT ERROR]', error)
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

  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    })

    const projectsResponse: Project[] = projects.map((p: (typeof projects)[number]) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      lyrics: p.lyrics,
      genre: p.genre,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))

    return reply.code(200).send(projectsResponse)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[LIST PROJECTS ERROR]', error)
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

  const { projectId } = request.params as { projectId: string }

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
    // eslint-disable-next-line no-console
    console.error('[GET PROJECT ERROR]', error)
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

  const { projectId } = request.params as { projectId: string }
  const body = UpdateProjectRequestSchema.parse(request.body)

  try {
    // Check ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return reply.code(404).send({ message: 'Project not found' })
    }

    if (project.userId !== user.userId) {
      return reply.code(403).send({ message: 'Forbidden' })
    }

    // Update
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: body,
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
    // eslint-disable-next-line no-console
    console.error('[UPDATE PROJECT ERROR]', error)
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

  const { projectId } = request.params as { projectId: string }

  try {
    // Check ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return reply.code(404).send({ message: 'Project not found' })
    }

    if (project.userId !== user.userId) {
      return reply.code(403).send({ message: 'Forbidden' })
    }

    // Delete
    await prisma.project.delete({
      where: { id: projectId },
    })

    return reply.code(204).send()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[DELETE PROJECT ERROR]', error)
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to delete project',
    })
  }
}

export function registerProjectRoutes(fastify: FastifyInstance) {
  fastify.post('/projects', createProjectHandler)
  fastify.get('/projects', listProjectsHandler)
  fastify.get('/projects/:projectId', getProjectHandler)
  fastify.put('/projects/:projectId', updateProjectHandler)
  fastify.delete('/projects/:projectId', deleteProjectHandler)
}
