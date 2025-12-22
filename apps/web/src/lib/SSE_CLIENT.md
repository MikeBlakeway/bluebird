# SSE Client for Real-Time Job Events

TypeScript SSE (Server-Sent Events) client with automatic reconnection, heartbeat detection, and React hooks for real-time job status updates.

## Features

- ✅ **Automatic Reconnection** - Exponential backoff (500ms → 8s max)
- ✅ **Heartbeat Detection** - Timeout if no events received (15s default)
- ✅ **TypeScript** - Fully typed with job event validation
- ✅ **React Hook** - `useJobEvents` for easy React integration
- ✅ **Auto-Disconnect** - Closes on job completion/failure
- ✅ **Error Handling** - Typed errors with callbacks

## Quick Start

### Using the React Hook (Recommended)

```tsx
import { useJobEvents } from '@/hooks/use-job-events'

function JobStatus({ jobId }: { jobId: string }) {
  const { event, state, error, isConnected } = useJobEvents(jobId)

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (state === 'connecting') {
    return <div>Connecting to job stream...</div>
  }

  if (!event) {
    return <div>Waiting for events...</div>
  }

  return (
    <div>
      <h2>Job Status</h2>
      <p>Status: {event.status}</p>
      <p>Stage: {event.stage}</p>
      <p>Progress: {event.progress}%</p>
      {event.error && <p>Error: {event.error}</p>}
      <p>Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
    </div>
  )
}
```

### Using the Client Directly

```typescript
import { SSEClient } from '@/lib/sse-client'

const client = new SSEClient({
  url: `http://localhost:4000/jobs/${jobId}/events`,
  onEvent: (event) => {
    console.log('Job event:', event)
    console.log('Status:', event.status)
    console.log('Progress:', event.progress)
  },
  onStateChange: (state) => {
    console.log('Connection state:', state)
  },
  onError: (error) => {
    console.error('SSE error:', error)
  },
})

// Connect to SSE endpoint
client.connect()

// Later: disconnect
client.disconnect()
```

## Configuration

### SSEClient Options

```typescript
interface SSEClientConfig {
  /** URL of the SSE endpoint */
  url: string

  /** Callback for job events */
  onEvent: (event: JobEvent) => void

  /** Callback for connection state changes */
  onStateChange?: (state: ConnectionState) => void

  /** Callback for errors */
  onError?: (error: Error) => void

  /** Heartbeat timeout in milliseconds (default: 15000) */
  heartbeatTimeout?: number

  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number

  /** Initial reconnection delay in milliseconds (default: 500) */
  initialReconnectDelay?: number

  /** Maximum reconnection delay in milliseconds (default: 8000) */
  maxReconnectDelay?: number
}
```

### useJobEvents Hook Options

```typescript
interface UseJobEventsOptions {
  /** Base URL of the API (default: from env or localhost:4000) */
  baseURL?: string

  /** Enable auto-connect on mount (default: true) */
  autoConnect?: boolean

  /** Callback for job events */
  onEvent?: (event: JobEvent) => void

  /** Callback for connection state changes */
  onStateChange?: (state: ConnectionState) => void

  /** Callback for errors */
  onError?: (error: Error) => void
}
```

## Connection States

```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'
```

- **connecting**: Establishing connection to SSE endpoint
- **connected**: Successfully connected and receiving events
- **disconnected**: Not connected (initial state or after disconnect)
- **error**: Connection error occurred

## Job Event Types

Events are typed using `JobEvent` from `@bluebird/types`:

```typescript
interface JobEvent {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  stage?: string // e.g., 'planning', 'music-render', 'vocal-render', 'mixing'
  progress?: number // 0-100
  error?: string
  timestamp: string
}
```

## Examples

### With Progress Bar

```tsx
import { useJobEvents } from '@/hooks/use-job-events'
import { Progress } from '@/components/ui/progress'

function JobProgress({ jobId }: { jobId: string }) {
  const { event, state } = useJobEvents(jobId)

  return (
    <div>
      {state === 'connecting' && <p>Connecting...</p>}
      {event && (
        <>
          <p>{event.stage}</p>
          <Progress value={event.progress || 0} />
          <p>{event.status}</p>
        </>
      )}
    </div>
  )
}
```

### With State Management (Zustand)

```tsx
import { useEffect } from 'react'
import { useJobEvents } from '@/hooks/use-job-events'
import { useJobStore } from '@/stores/job-store'

function JobMonitor({ jobId }: { jobId: string }) {
  const updateJob = useJobStore((state) => state.updateJob)

  const { event } = useJobEvents(jobId, {
    onEvent: (evt) => {
      updateJob(jobId, evt)
    },
  })

  return <div>Monitoring job {jobId}...</div>
}
```

### Manual Control

```tsx
import { useJobEvents } from '@/hooks/use-job-events'
import { Button } from '@/components/ui/button'

function ManualJobMonitor({ jobId }: { jobId: string }) {
  const { event, state, connect, disconnect, isConnected } = useJobEvents(jobId, {
    autoConnect: false, // Don't auto-connect
  })

  return (
    <div>
      <Button onClick={connect} disabled={isConnected}>
        Connect
      </Button>
      <Button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </Button>
      <p>Status: {state}</p>
      {event && <pre>{JSON.stringify(event, null, 2)}</pre>}
    </div>
  )
}
```

### With Multiple Jobs

```tsx
import { useJobEvents } from '@/hooks/use-job-events'

function MultiJobMonitor({ jobIds }: { jobIds: string[] }) {
  return (
    <div>
      {jobIds.map((jobId) => (
        <JobCard key={jobId} jobId={jobId} />
      ))}
    </div>
  )
}

function JobCard({ jobId }: { jobId: string }) {
  const { event, state } = useJobEvents(jobId)

  return (
    <div>
      <h3>{jobId}</h3>
      <p>State: {state}</p>
      <p>Progress: {event?.progress || 0}%</p>
    </div>
  )
}
```

### Error Handling

```tsx
import { useJobEvents } from '@/hooks/use-job-events'
import { Alert } from '@/components/ui/alert'

function JobWithErrorHandling({ jobId }: { jobId: string }) {
  const { event, error, state } = useJobEvents(jobId, {
    onError: (err) => {
      console.error('Job stream error:', err)
      // Could also send to error tracking service
    },
  })

  if (error) {
    return (
      <Alert variant="destructive">
        <h4>Connection Error</h4>
        <p>{error.message}</p>
      </Alert>
    )
  }

  if (event?.status === 'failed') {
    return (
      <Alert variant="destructive">
        <h4>Job Failed</h4>
        <p>{event.error}</p>
      </Alert>
    )
  }

  return (
    <div>
      <p>Status: {event?.status}</p>
      <p>Progress: {event?.progress}%</p>
    </div>
  )
}
```

## Behavior

### Auto-Disconnect

The SSE client automatically disconnects when receiving terminal job states:

- `status: 'completed'` - Job finished successfully
- `status: 'failed'` - Job failed with error

This prevents unnecessary connections and resource usage.

### Reconnection

Reconnection uses exponential backoff:

- **1st attempt**: 500ms delay
- **2nd attempt**: 1s delay
- **3rd attempt**: 2s delay
- **4th attempt**: 4s delay
- **5th+ attempts**: 8s delay (max)

Stops after 10 failed attempts by default (configurable).

### Heartbeat

The client expects to receive events regularly. If no events are received within the heartbeat timeout (default 15s), the connection is considered stale and will reconnect.

Each received event resets the heartbeat timer.

## Integration with API Client

```tsx
import { BluebirdClient } from '@bluebird/client'
import { useJobEvents } from '@/hooks/use-job-events'
import { useState } from 'react'

function CreateAndMonitorJob() {
  const client = new BluebirdClient()
  const [jobId, setJobId] = useState<string | null>(null)

  const { event, state } = useJobEvents(jobId)

  const handleCreate = async () => {
    // Create job via API client
    const { jobId: newJobId } = await client.planSong({
      projectId: 'project-123',
      lyrics: 'Your lyrics here...',
      genre: 'pop',
      vocalistId: 'artist-001',
    })

    // Set job ID to start monitoring
    setJobId(newJobId)
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Song</button>
      {jobId && (
        <div>
          <p>Job ID: {jobId}</p>
          <p>State: {state}</p>
          <p>Progress: {event?.progress || 0}%</p>
        </div>
      )}
    </div>
  )
}
```

## Testing

```bash
# Run tests
pnpm -F @bluebird/web test:unit

# Watch mode
pnpm -F @bluebird/web test:watch
```

## Troubleshooting

### Connection keeps disconnecting

- Check heartbeat timeout (may need to increase if events are infrequent)
- Verify backend SSE endpoint is sending events regularly
- Check network stability

### Events not received

- Verify job ID is correct
- Check backend logs for SSE errors
- Ensure SSE endpoint URL is correct
- Check CORS settings if using different domain

### Too many reconnection attempts

- Increase `maxReconnectAttempts` if needed
- Check if backend SSE endpoint is available
- Verify network connectivity

## License

MIT
