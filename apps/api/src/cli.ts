#!/usr/bin/env node
/**
 * Bluebird CLI
 * Command-line interface for testing and development.
 */

import 'dotenv/config'

import { createId } from '@paralleldrive/cuid2'
import { Command } from 'commander'
import { PlanSongRequestSchema } from '@bluebird/types'
import { enqueuePlanJob } from './lib/queue.js'
import { createJobEventSubscriber } from './lib/events.js'
import { uploadToS3, getPresignedUrl } from './lib/s3.js'

const program = new Command()

program.name('bluebird').description('Bluebird AI music composition platform CLI').version('0.1.0')

program
  .command('plan')
  .description('Create a song plan from lyrics')
  .requiredOption('-l, --lyrics <text>', 'Song lyrics (10-5000 characters)')
  .option('-g, --genre <genre>', 'Genre preset', 'pop_2010s')
  .option('-p, --project <id>', 'Project ID (CUID)')
  .option('-s, --seed <number>', 'Random seed for reproducibility', (val: string) =>
    parseInt(val, 10)
  )
  .option('--pro', 'Use PRO priority queue', false)
  .option('--watch', 'Watch job progress via SSE', false)
  .action(
    async (options: {
      lyrics: string
      genre?: string
      project?: string
      seed?: number
      pro?: boolean
      watch?: boolean
    }) => {
      try {
        // Generate project ID if not provided
        const projectId = options.project || createId()

        // Validate lyrics
        const parsed = PlanSongRequestSchema.safeParse({
          projectId,
          lyrics: options.lyrics,
          genre: options.genre,
          seed: options.seed,
        })

        if (!parsed.success) {
          console.error('❌ Invalid input:', parsed.error.errors[0]?.message ?? 'Validation failed')
          console.error('Full error:', JSON.stringify(parsed.error.errors, null, 2))
          process.exit(1)
        }

        const { lyrics, genre, seed } = parsed.data

        // Generate jobId
        const jobId = `${projectId}:${Date.now()}:${seed || 0}`

        console.log('🎵 Bluebird Plan')
        console.log('━'.repeat(50))
        console.log(`Project:  ${projectId}`)
        console.log(`Genre:    ${genre}`)
        console.log(`Seed:     ${seed || 'random'}`)
        console.log(`Priority: ${options.pro ? 'PRO' : 'STANDARD'}`)
        console.log(`JobId:    ${jobId}`)
        console.log('━'.repeat(50))

        // Enqueue job
        await enqueuePlanJob({
          projectId,
          jobId,
          lyrics,
          genre,
          seed,
          isPro: options.pro,
        })

        console.log('✅ Job enqueued')
        console.log(`📡 SSE: http://localhost:4000/jobs/${jobId}/events`)
        console.log('')

        // Watch progress if requested
        if (options.watch) {
          console.log('👀 Watching progress...\n')

          const subscriber = createJobEventSubscriber(jobId)
          const unsubscribe = await subscriber.subscribe((event) => {
            const progress = Math.round(event.progress * 100)
            const bar =
              '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))

            console.log(`[${event.stage.padEnd(15)}] ${bar} ${progress}%`)

            if (event.message) {
              console.log(`  → ${event.message}`)
            }

            if (event.stage === 'completed') {
              console.log('\n✨ Plan complete!')
              unsubscribe().then(() => process.exit(0))
            }

            if (event.stage === 'failed') {
              console.error(`\n❌ Job failed: ${event.error || 'Unknown error'}`)
              unsubscribe().then(() => process.exit(1))
            }
          })

          // Handle Ctrl+C
          process.on('SIGINT', async () => {
            console.log('\n\n⏸️  Disconnecting...')
            await unsubscribe()
            process.exit(0)
          })
        } else {
          process.exit(0)
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
        process.exit(1)
      }
    }
  )

// ---------------------------------------------------------------------------
// Extra utilities
// ---------------------------------------------------------------------------

program
  .command('s3:smoke')
  .description('Upload a small test object to S3 and print a presigned URL')
  .option('-k, --key <key>', 'S3 key to use', 'diagnostics/s3-smoke.txt')
  .action(async (opts: { key: string }) => {
    try {
      const key = opts.key
      const content = `bluebird s3 smoke test at ${new Date().toISOString()}\n`
      await uploadToS3(key, Buffer.from(content, 'utf-8'), 'text/plain')
      const url = await getPresignedUrl(key, 300)
      console.log('✅ Uploaded to S3')
      console.log(`Key: ${key}`)
      console.log(`Presigned URL (5m): ${url}`)
      process.exit(0)
    } catch (err) {
      console.error('❌ S3 smoke test failed:', err)
      process.exit(1)
    }
  })

program.parse()
