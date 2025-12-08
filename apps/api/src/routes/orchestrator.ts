import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PlanSongRequestSchema, type PlanSongResponse } from '@bluebird/types';
import { planArrangement } from '../lib/planner.js';
import { analyzeLyrics, detectRhymeScheme, estimateTempo, extractSeedPhrase } from '../lib/analyzer.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * POST /plan/song
 * Main orchestrator endpoint for song planning.
 * Takes lyrics + metadata, runs analyzer → planner pipeline, returns arrangement plan.
 * Supports idempotency via Idempotency-Key header (future: will persist to DB).
 */
export async function planSongHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // Require auth
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  // Parse request
  const parsed = PlanSongRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid request', details: parsed.error });
  }

  const { projectId, lyrics, seed } = parsed.data;
  // TODO: Use idempotency key for caching (D8/D9 persistence)
  // const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

  try {
    // Generate jobId (format: project:timestamp:seed)
    const jobId = `${projectId}:${Date.now()}:${seed || 0}`;

    // Analyze lyrics
    const lines = analyzeLyrics(lyrics);
    const rhymeScheme = detectRhymeScheme(lines);
    const estimatedTempo = estimateTempo(lines);
    const seedPhrase = extractSeedPhrase(lyrics);

    // Build analysis result
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
    };

    // Generate arrangement
    const arrangement = planArrangement(analysisResult, jobId, seed);

    // Build response
    const response: PlanSongResponse = {
      jobId,
      projectId,
      status: 'planned',
      plan: arrangement,
    };

    // TODO: Cache response with idempotency key (D8/D9)
    // TODO: Queue job for synthesis (D8)

    return reply.code(200).send(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[PLAN SONG ERROR]', error);
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to plan song',
    });
  }
}

export function registerOrchestratorRoutes(fastify: FastifyInstance) {
  fastify.post('/plan/song', planSongHandler);
}
