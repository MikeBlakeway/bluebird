#!/usr/bin/env node
/**
 * Bluebird Demo Script
 * Demonstrates end-to-end flow: enqueue → SSE streaming → result
 */

import { enqueuePlanJob } from '../apps/api/src/lib/queue.js'
import { createJobEventSubscriber } from '../apps/api/src/lib/events.js'

const SAMPLE_LYRICS = `Lost in the city lights tonight
Searching for a sign that feels right
Every corner holds a memory
Of what we used to be

Dancing shadows on the wall
Echoes of your name still call
Time keeps moving but I stay
Frozen in yesterday

Can we rewind, can we go back
To the moment before the cracks
When we were young and so alive
Before goodbye`

async function demo() {
  console.log('🎵 Bluebird Demo - Sprint 0')
  console.log('='.repeat(60))
  console.log('')

  // Step 1: Create project and job
  const projectId = `demo-project-${Date.now()}`
  const jobId = `${projectId}:demo:42`
  const seed = 42

  console.log('📝 Sample Lyrics:')
  console.log('─'.repeat(60))
  console.log(SAMPLE_LYRICS)
  console.log('─'.repeat(60))
  console.log('')

  // Step 2: Enqueue job
  console.log('⚡ Enqueueing job...')
  console.log(`   Project: ${projectId}`)
  console.log(`   JobId:   ${jobId}`)
  console.log(`   Seed:    ${seed}`)
  console.log('')

  await enqueuePlanJob({
    projectId,
    jobId,
    lyrics: SAMPLE_LYRICS,
    genre: 'pop_2010s',
    seed,
    isPro: false,
  })

  console.log('✅ Job enqueued')
  console.log(`📡 SSE endpoint: http://localhost:4000/jobs/${jobId}/events`)
  console.log('')

  // Step 3: Subscribe to SSE events
  console.log('👀 Watching job progress via SSE...')
  console.log('')

  const subscriber = createJobEventSubscriber(jobId)

  await new Promise<void>((resolve, reject) => {
    subscriber
      .subscribe((event) => {
        const progress = Math.round(event.progress * 100)
        const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))

        console.log(
          `[${event.timestamp.substring(11, 19)}] ${event.stage.padEnd(15)} ${bar} ${progress}%`
        )

        if (event.message) {
          console.log(`   → ${event.message}`)
        }

        if (event.stage === 'completed') {
          console.log('')
          console.log('✨ Demo complete!')
          console.log('')
          console.log('📋 Summary:')
          console.log(`   • Analyzed lyrics: ${SAMPLE_LYRICS.split('\n').length} lines`)
          console.log(`   • Generated arrangement plan`)
          console.log(`   • Persisted to database`)
          console.log(`   • Total time: ${event.duration ? `${event.duration}ms` : 'N/A'}`)
          console.log('')
          console.log('🎉 Sprint 0 foundation complete!')
          console.log('   ✅ D1-D9: Monorepo, Auth, Planner, Queue, SSE')
          console.log('   ✅ D10: CLI, Demo, Documentation')
          console.log('')
          resolve()
        }

        if (event.stage === 'failed') {
          console.error('')
          console.error(`❌ Job failed: ${event.error || 'Unknown error'}`)
          console.error('')
          reject(new Error(event.error))
        }
      })
      .then((unsubscribe) => {
        // Clean up on SIGINT
        process.on('SIGINT', async () => {
          console.log('\n\n⏸️  Demo interrupted')
          await unsubscribe()
          process.exit(0)
        })
      })
  })
}

// Run demo
demo()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  })
