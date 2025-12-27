import { fetch } from 'undici'
import { z } from 'zod'
import { SimilarityScoreSchema, SimilarityVerdictSchema } from '@bluebird/types'

const SimilarityResponseSchema = z.object({
  melody_score: z.number().min(0).max(1),
  rhythm_score: z.number().min(0).max(1),
  combined_score: z.number().min(0).max(1),
  verdict: z.enum(['pass', 'borderline', 'block']),
  confidence: z.number().min(0).max(1),
  recommendations: z.array(z.string()).default([]),
})

export type SimilarityInput = {
  referenceMelody: number[]
  generatedMelody: number[]
  referenceOnsets?: number[]
  generatedOnsets?: number[]
}

export type SimilarityResult = {
  scores: z.infer<typeof SimilarityScoreSchema>
  verdict: z.infer<typeof SimilarityVerdictSchema>
  recommendations: string[]
}

const SIM_URL = process.env.SIMILARITY_URL ?? 'http://localhost:8005'

export async function checkSimilarityViaPod(input: SimilarityInput): Promise<SimilarityResult> {
  const res = await fetch(`${SIM_URL}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference_melody: input.referenceMelody,
      generated_melody: input.generatedMelody,
      reference_onsets: input.referenceOnsets,
      generated_onsets: input.generatedOnsets,
    }),
  })

  if (!res.ok) {
    throw new Error(`Similarity pod error: ${res.status}`)
  }
  const json = await res.json()
  const parsed = SimilarityResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error(`Invalid similarity response: ${parsed.error.message}`)
  }
  const { melody_score, rhythm_score, combined_score, verdict, recommendations } = parsed.data
  return {
    scores: { melody: melody_score, rhythm: rhythm_score, combined: combined_score },
    verdict,
    recommendations,
  }
}
