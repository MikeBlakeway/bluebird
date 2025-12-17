import { FastifyInstance, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AnalyzeRequestSchema, ArrangementSpecSchema } from '@bluebird/types'
import { planArrangement } from '../lib/planner.js'
import {
  analyzeLyrics,
  detectRhymeScheme,
  estimateTempo,
  extractSeedPhrase,
} from '../lib/analyzer.js'
import { requireAuth, requireIdempotencyKey, type AuthenticatedRequest } from '../lib/middleware.js'
import { createRouteLogger } from '../lib/logger.js'

const log = createRouteLogger('/plan/arrangement', 'POST')

/**
 * POST /plan/arrangement
 * Generate song arrangement from lyrics using analyzer + planner.
 */
export async function planArrangementHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  const parsed = AnalyzeRequestSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid request', details: parsed.error.format() })
  }

  const { projectId, lyrics } = parsed.data
  const jobId = request.idempotencyKey ?? `plan:${projectId}:${Date.now()}`

  try {
    // Analyze lyrics
    const lines = analyzeLyrics(lyrics)
    const rhymeScheme = detectRhymeScheme(lines)
    const estimatedTempo = estimateTempo(lines)
    const seedPhrase = extractSeedPhrase(lyrics)

    // Build analysis result (compatible with AnalysisResult type)
    const analysisResult = {
      projectId,
      lyrics,
      lines,
      totalSyllables: lines.reduce((sum, line) => sum + line.syllables.length, 0),
      rhymeScheme: rhymeScheme.rhymeScheme,
      rhymingWords: rhymeScheme.rhymingWords,
      estimatedTempo,
      seedPhrase,
      analyzedAt: new Date().toISOString(),
    }

    const arrangement = planArrangement(analysisResult, jobId)

    return reply.code(200).send(arrangement)
  } catch (error) {
    log.error({ error, projectId }, 'Failed to plan arrangement')
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to plan arrangement',
    })
  }
}

export function registerPlannerRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/plan/arrangement',
    {
      schema: {
        body: AnalyzeRequestSchema,
        response: {
          200: ArrangementSpecSchema,
          400: z.object({ message: z.string() }),
        },
        tags: ['Planner'],
        description: 'Generate song arrangement from lyrics',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    planArrangementHandler
  )
  app.post(
    '/plan/vocals',
    {
      schema: {
        body: AnalyzeRequestSchema,
        response: {
          200: ArrangementSpecSchema,
          400: z.object({ message: z.string() }),
        },
        tags: ['Planner'],
        description: 'Generate song arrangement from lyrics (alias)',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    planArrangementHandler
  ) // Alias
}
