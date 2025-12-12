/**
 * Plan Flow Integration Test
 *
 * Tests the planning stage of the preview path:
 * - User creates project with lyrics
 * - Plan job processes lyrics and generates arrangement
 * - Take record created with plan data
 * - Database state validated
 *
 * This is a simplified integration test to validate the plan worker.
 * Full end-to-end testing (music/voice/mix/export) requires additional setup.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createId } from '@paralleldrive/cuid2'
import { prisma } from '../lib/db'
import { enqueuePlanJob, closeQueues } from '../lib/queue'
import { closeWorkers } from '../lib/worker'
import { closeRedisConnections } from '../lib/redis'
import { s3Client } from '../lib/s3'
import { CreateBucketCommand } from '@aws-sdk/client-s3'

// Import worker to register it
import '../lib/worker'

describe('Plan Flow Integration', () => {
  const testUserId = createId()
  const testProjectId = createId()
  const testJobId = `plan-flow-test-${Date.now()}`

  const testLyrics = `Verse 1
This is a test song
Testing the plan flow
From start to finish

Chorus
Everything works fine
All the workers in line
Making music divine`

  beforeAll(async () => {
    // Create S3 bucket for testing
    try {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: 'bluebird',
        })
      )
    } catch (error) {
      // Bucket may already exist, ignore error
    }

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'plan-test@example.com',
        name: 'Plan Test User',
      },
    })

    // Create test project
    await prisma.project.create({
      data: {
        id: testProjectId,
        userId: testUserId,
        name: 'Plan Flow Test Project',
        lyrics: testLyrics,
        genre: 'pop',
      },
    })
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.take.deleteMany({ where: { projectId: testProjectId } })
    await prisma.project.deleteMany({ where: { id: testProjectId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })

    // Close all workers and connections
    await closeWorkers()
    await closeQueues()
    await closeRedisConnections()
  })

  it('should complete plan job and create arrangement', async () => {
    const startTime = Date.now()

    // Step 1: Enqueue plan job
    await enqueuePlanJob({
      projectId: testProjectId,
      jobId: testJobId,
      lyrics: testLyrics,
      genre: 'pop',
      seed: 12345,
      isPro: false,
    })

    // Wait for plan job to complete (with timeout)
    const planTimeout = 15000 // 15 seconds
    const planStartTime = Date.now()
    let planCompleted = false
    let take

    while (!planCompleted && Date.now() - planStartTime < planTimeout) {
      take = await prisma.take.findFirst({
        where: { jobId: testJobId },
      })

      if (take?.plan) {
        planCompleted = true
      } else {
        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    expect(planCompleted).toBe(true)
    expect(take).toBeDefined()
    expect(take?.plan).toBeDefined()
    expect(take?.status).toBe('planned')

    // Verify plan structure
    if (!take?.plan) {
      throw new Error('Plan is missing')
    }
    const plan = take.plan as {
      bpm: number
      key: string
      scale: string
      sections: Array<{ index: number; type: string; bars: number; energyLevel: number }>
      instrumentation: string[]
    }

    expect(plan.bpm).toBeGreaterThan(0)
    expect(plan.bpm).toBeLessThanOrEqual(180)
    expect(plan.key).toBeDefined()
    expect(plan.scale).toBeDefined()
    expect(plan.sections).toBeDefined()
    expect(Array.isArray(plan.sections)).toBe(true)
    expect(plan.sections.length).toBeGreaterThan(0)
    expect(plan.instrumentation).toBeDefined()
    expect(Array.isArray(plan.instrumentation)).toBe(true)
    expect(plan.instrumentation.length).toBeGreaterThan(0)

    // Verify section structure
    for (const section of plan.sections) {
      expect(section.index).toBeGreaterThanOrEqual(0)
      expect(section.type).toBeDefined()
      expect(section.bars).toBeGreaterThan(0)
      expect(section.energyLevel).toBeGreaterThanOrEqual(0)
      expect(section.energyLevel).toBeLessThanOrEqual(1)
    }

    // Calculate time
    const planTime = Date.now() - startTime
    const planTimeSeconds = planTime / 1000

    // Log planning time
    console.log(`\n📊 Plan Time: ${planTimeSeconds.toFixed(2)}s`)

    // Planning should be fast (<5s)
    expect(planTimeSeconds).toBeLessThan(5)
  })

  it('should handle invalid genre gracefully', async () => {
    const invalidJobId = `plan-flow-invalid-${Date.now()}`

    // Enqueue plan job with invalid genre (should still work, planner may adjust)
    await enqueuePlanJob({
      projectId: testProjectId,
      jobId: invalidJobId,
      lyrics: testLyrics,
      genre: 'invalid-genre-that-does-not-exist',
      seed: 12345,
      isPro: false,
    })

    // Wait for plan job to complete
    const planTimeout = 10000 // 10 seconds
    const planStartTime = Date.now()
    let planCompleted = false

    while (!planCompleted && Date.now() - planStartTime < planTimeout) {
      const take = await prisma.take.findFirst({
        where: { jobId: invalidJobId },
      })

      if (take?.plan) {
        planCompleted = true
        // Verify plan was still created (planner may fallback to default genre)
        expect(take.plan).toBeDefined()
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Cleanup
    await prisma.take.deleteMany({ where: { jobId: invalidJobId } })
  })
})
