import { describe, it, expect, afterAll } from 'vitest'
import { publishJobEvent, createJobEventSubscriber, closeEventBus } from './events.js'
import { JobEvent } from '@bluebird/types'

describe('Event Bus', () => {
  afterAll(async () => {
    await closeEventBus()
  })

  it('should publish and receive job events', async () => {
    const jobId = `event-test-${Date.now()}`

    const testEvent: JobEvent = {
      jobId,
      stage: 'analyzing',
      progress: 0.5,
      timestamp: new Date().toISOString(),
      message: 'Test event',
    }

    // Create subscriber
    const subscriber = createJobEventSubscriber(jobId)
    const receivedEvents: JobEvent[] = []

    const unsubscribe = await subscriber.subscribe((event) => {
      receivedEvents.push(event)
    })

    // Give subscriber time to connect
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Publish event
    await publishJobEvent(testEvent)

    // Wait for event to propagate
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Cleanup
    await unsubscribe()

    // Verify
    expect(receivedEvents.length).toBeGreaterThan(0)
    expect(receivedEvents[0]?.jobId).toBe(jobId)
    expect(receivedEvents[0]?.stage).toBe('analyzing')
    expect(receivedEvents[0]?.progress).toBe(0.5)
  })

  it('should handle multiple subscribers for same job', async () => {
    const jobId = `multi-sub-${Date.now()}`

    const testEvent: JobEvent = {
      jobId,
      stage: 'planning',
      progress: 0.7,
      timestamp: new Date().toISOString(),
    }

    // Create multiple subscribers
    const sub1 = createJobEventSubscriber(jobId)
    const sub2 = createJobEventSubscriber(jobId)

    const events1: JobEvent[] = []
    const events2: JobEvent[] = []

    const unsub1 = await sub1.subscribe((e) => events1.push(e))
    const unsub2 = await sub2.subscribe((e) => events2.push(e))

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Publish event
    await publishJobEvent(testEvent)

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Cleanup
    await unsub1()
    await unsub2()

    // Both should receive the event
    expect(events1.length).toBeGreaterThan(0)
    expect(events2.length).toBeGreaterThan(0)
    expect(events1[0]?.stage).toBe('planning')
    expect(events2[0]?.stage).toBe('planning')
  })

  it('should not receive events for different jobs', async () => {
    const jobId1 = `job-${Date.now()}-1`
    const jobId2 = `job-${Date.now()}-2`

    const subscriber = createJobEventSubscriber(jobId1)
    const receivedEvents: JobEvent[] = []

    const unsubscribe = await subscriber.subscribe((event) => {
      receivedEvents.push(event)
    })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Publish event for different job
    await publishJobEvent({
      jobId: jobId2,
      stage: 'completed',
      progress: 1,
      timestamp: new Date().toISOString(),
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Cleanup
    await unsubscribe()

    // Should not receive events for jobId2
    expect(receivedEvents.length).toBe(0)
  })
})
