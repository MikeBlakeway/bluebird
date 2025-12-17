import { FastifyInstance, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AnalyzeRequestSchema, AnalysisResultSchema, type AnalysisResult } from '@bluebird/types'
import {
  analyzeLyrics,
  detectRhymeScheme,
  estimateTempo,
  extractSeedPhrase,
} from '../lib/analyzer.js'
import { requireAuth, requireIdempotencyKey, type AuthenticatedRequest } from '../lib/middleware.js'
import { createRouteLogger } from '../lib/logger.js'

const log = createRouteLogger('/analyze', 'POST')

/**
 * POST /analyze
 * Analyze lyrics for syllables, rhyme scheme, and musical hints.
 */
export async function analyzeHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const parsed = AnalyzeRequestSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Invalid request', details: parsed.error.format() })
  }

  const body = parsed.data

  try {
    const analyzedLines = analyzeLyrics(body.lyrics)
    const { rhymeScheme, rhymingWords } = detectRhymeScheme(analyzedLines)
    const estimatedTempo = estimateTempo(analyzedLines)
    const seedPhrase = extractSeedPhrase(body.lyrics)

    const result: AnalysisResult = {
      projectId: body.projectId,
      lyrics: body.lyrics,
      lines: analyzedLines,
      totalSyllables: analyzedLines.reduce((sum, line) => sum + line.syllables.length, 0),
      rhymeScheme,
      rhymingWords,
      estimatedTempo,
      seedPhrase,
      analyzedAt: new Date().toISOString(),
    }

    return reply.code(200).send(result)
  } catch (error) {
    log.error({ error, projectId: body.projectId }, 'Failed to analyze lyrics')
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to analyze lyrics',
    })
  }
}

export function registerAnalyzerRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/analyze',
    {
      schema: {
        body: AnalyzeRequestSchema,
        response: {
          200: AnalysisResultSchema,
          400: z.object({ message: z.string() }),
        },
        tags: ['Analyzer'],
        description: 'Analyze lyrics',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    analyzeHandler
  )
}
