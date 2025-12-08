import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyzeRequestSchema, type AnalysisResult } from '@bluebird/types';
import { analyzeLyrics, detectRhymeScheme, estimateTempo, extractSeedPhrase } from '../lib/analyzer.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * POST /analyze
 * Analyze lyrics for syllables, rhyme scheme, and musical hints.
 */
export async function analyzeHandler(request: AuthenticatedRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }

  const body = AnalyzeRequestSchema.parse(request.body);

  try {
    const analyzedLines = analyzeLyrics(body.lyrics);
    const { rhymeScheme, rhymingWords } = detectRhymeScheme(analyzedLines);
    const estimatedTempo = estimateTempo(analyzedLines);
    const seedPhrase = extractSeedPhrase(body.lyrics);

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
    };

    return reply.code(200).send(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ANALYZE ERROR]', error);
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to analyze lyrics',
    });
  }
}

export function registerAnalyzerRoutes(fastify: FastifyInstance) {
  fastify.post('/analyze', analyzeHandler);
}
