import { z } from 'zod'
import { prisma } from './db.js'
import { downloadJsonFromS3, getS3Paths } from './s3.js'
import { RemixFeaturesSchema } from '@bluebird/types'

export type TakeMelodies = {
  referenceMelody: number[]
  generatedMelody: number[]
  referenceOnsets?: number[]
  generatedOnsets?: number[]
}

const GeneratedMelodySchema = z.object({
  melody: z.array(z.number()),
  onsets: z.array(z.number()).optional(),
})

export async function getMelodiesForTake(
  planId: string,
  takeId: string
): Promise<TakeMelodies | null> {
  // Lookup project for this take
  const take = await prisma.take.findUnique({
    where: { id: takeId },
    select: { projectId: true },
  })
  if (!take) return null

  const paths = getS3Paths(take.projectId, takeId)

  // Load reference features (remix.json) for contour/rhythm
  let referenceMelody: number[] | undefined
  let referenceOnsets: number[] | undefined
  try {
    const rawFeatures = await downloadJsonFromS3<unknown>(paths.reference.features)
    const parsed = RemixFeaturesSchema.safeParse(rawFeatures)
    if (parsed.success) {
      referenceMelody = parsed.data.contourVector
      referenceOnsets = parsed.data.rhythmPattern
    }
  } catch {
    // Missing reference features is acceptable; return null later if incomplete
  }

  // Load generated melody (features/melody.json)
  let generatedMelody: number[] | undefined
  let generatedOnsets: number[] | undefined
  try {
    const rawGenerated = await downloadJsonFromS3<unknown>(paths.features.melody)
    const genParsed = GeneratedMelodySchema.safeParse(rawGenerated)
    if (genParsed.success) {
      generatedMelody = genParsed.data.melody
      generatedOnsets = genParsed.data.onsets
    }
  } catch {
    // File not present yet
  }

  if (
    referenceMelody &&
    generatedMelody &&
    referenceMelody.length > 0 &&
    generatedMelody.length > 0
  ) {
    return {
      referenceMelody,
      generatedMelody,
      referenceOnsets,
      generatedOnsets,
    }
  }

  return null
}
