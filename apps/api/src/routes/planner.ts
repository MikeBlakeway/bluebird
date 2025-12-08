import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyzeRequestSchema } from '@bluebird/types';
import { planArrangement } from '../lib/planner.js';
import { analyzeLyrics, detectRhymeScheme, estimateTempo, extractSeedPhrase } from '../lib/analyzer.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * POST /plan/arrangement
 * Generate song arrangement from lyrics using analyzer + planner.
 */
export async function planArrangementHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // Require auth
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const parsed = AnalyzeRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid request', details: parsed.error });
  }

  const { projectId, lyrics } = parsed.data;

  try {
    // Analyze lyrics
    const lines = analyzeLyrics(lyrics);
    const rhymeScheme = detectRhymeScheme(lines);
    const estimatedTempo = estimateTempo(lines);
    const seedPhrase = extractSeedPhrase(lyrics);

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
    };

    // Generate arrangement (stub jobId for now - will be replaced in orchestrator)
    const stubJobId = `job-${Date.now()}`;
    const arrangement = planArrangement(analysisResult, stubJobId);

    return reply.code(200).send(arrangement);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[PLANNER ERROR]', error);
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to plan arrangement',
    });
  }
}

export function registerPlannerRoutes(fastify: FastifyInstance) {
  fastify.post('/plan/arrangement', planArrangementHandler);
  fastify.post('/plan/vocals', planArrangementHandler); // Alias
}
