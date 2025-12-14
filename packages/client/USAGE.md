# @bluebird/client

Typed API client for Bluebird backend communication with automatic retries, error handling, and authentication.

## Installation

```bash
# Already installed as workspace dependency
pnpm add @bluebird/client
```

## Quick Start

```typescript
import { BluebirdClient } from '@bluebird/client'

// Initialize client
const client = new BluebirdClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  authToken: getAuthToken(), // Optional: set later with setAuthToken()
  timeout: 30000, // Optional: default 30s
  retries: 3, // Optional: default 3 retries
  onTokenRefresh: (token) => {
    // Optional: callback when token is updated
    localStorage.setItem('authToken', token)
  },
})
```

## Authentication

### Magic Link Flow

```typescript
// Step 1: Request magic link
const response = await client.requestMagicLink({
  email: 'user@example.com',
})
// User receives email with magic link

// Step 2: Verify magic link (from email link)
const authResponse = await client.verifyMagicLink({
  token: 'magic-link-token-from-email',
})
// Token is automatically stored in client

console.log(authResponse.user)
console.log(authResponse.token) // JWT token
```

### Manual Token Management

```typescript
// Set token manually
client.setAuthToken('your-jwt-token')

// Clear token (logout)
client.clearAuthToken()
```

## Project Management

```typescript
// Create a new project
const project = await client.createProject({
  name: 'My Song',
  description: 'Optional description',
})

// Get a project
const project = await client.getProject(projectId)

// Update a project
const updated = await client.updateProject(projectId, {
  name: 'Updated Name',
})

// List all projects
const projects = await client.listProjects()

// Delete a project
await client.deleteProject(projectId)
```

## Lyrics Analysis

```typescript
const analysis = await client.analyzeLyrics({
  lyrics: 'Your song lyrics here...',
})

console.log(analysis.structure) // Verse, chorus, bridge, etc.
console.log(analysis.syllableCount)
console.log(analysis.lineCount)
```

## Song Planning

```typescript
// Create arrangement and vocal plan
const { jobId } = await client.planSong({
  projectId: 'project-123',
  lyrics: 'Your lyrics here...',
  genre: 'pop',
  vocalistId: 'artist-001',
  bpm: 120, // Optional
  key: 'C', // Optional
  seed: 42, // Optional: for deterministic generation
})

// Monitor job progress (see SSE section below)
const eventsURL = client.getJobEventsURL(jobId)
```

## Rendering

### Preview Render (Full Song)

```typescript
const { jobId } = await client.renderPreview({
  takeId: 'take-123',
  seed: 42, // Optional: deterministic generation
})

// Listen for job events
const eventsURL = client.getJobEventsURL(jobId)
```

### Section Render (Single Section)

```typescript
const { jobId } = await client.renderSection({
  takeId: 'take-123',
  sectionIndex: 0, // Render first section
  seed: 42, // Optional
})
```

## Mixing

```typescript
const { jobId } = await client.mixFinal({
  takeId: 'take-123',
})
```

## Export

```typescript
const exportBundle = await client.exportPreview({
  takeId: 'take-123',
  format: 'wav', // or 'mp3'
  sampleRate: 48000, // Optional: 44100 or 48000
  bitDepth: 24, // Optional: 16 or 24
  includeStems: true, // Optional: include separated stems
})

console.log(exportBundle.masterURL) // Download URL for master
console.log(exportBundle.stems) // Array of stem URLs
console.log(exportBundle.cueSheet) // BWF markers
```

## Job Status Monitoring

### Get Job Status (Polling)

```typescript
const job = await client.getJob(jobId)
console.log(job.status) // 'pending', 'running', 'completed', 'failed'
console.log(job.progress) // 0-100
```

### Server-Sent Events (Recommended)

```typescript
// Get the SSE URL
const eventsURL = client.getJobEventsURL(jobId)

// Create EventSource
const eventSource = new EventSource(eventsURL)

eventSource.onmessage = (event) => {
  const jobEvent = JSON.parse(event.data)
  console.log(jobEvent.stage) // 'planning', 'music-render', 'vocal-render', etc.
  console.log(jobEvent.progress) // 0-100
  console.log(jobEvent.status) // 'running', 'completed', 'failed'

  if (jobEvent.status === 'completed') {
    eventSource.close()
    // Handle completion
  }
}

eventSource.onerror = () => {
  eventSource.close()
  // Handle error or reconnect
}
```

## Error Handling

```typescript
import { BluebirdAPIError } from '@bluebird/client'

try {
  const project = await client.getProject('invalid-id')
} catch (error) {
  if (error instanceof BluebirdAPIError) {
    console.error('Status:', error.statusCode) // HTTP status code
    console.error('Message:', error.message) // Error message
    console.error('Details:', error.details) // Additional error info

    // Handle specific errors
    if (error.statusCode === 401) {
      // Unauthorized - redirect to login
      client.clearAuthToken()
      redirectToLogin()
    } else if (error.statusCode === 404) {
      // Not found
      showNotFoundMessage()
    } else if (error.statusCode === 429) {
      // Rate limited - will auto-retry
      console.log('Rate limited, retrying...')
    }
  }
}
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:

- **Retryable errors**: Network failures, 500-599 errors, 429 rate limits
- **Non-retryable errors**: 400-499 client errors (except 429)
- **Max retries**: 3 (configurable)
- **Backoff**: 500ms → 1s → 2s

```typescript
// Customize retry behavior
const client = new BluebirdClient({
  retries: 5, // Retry up to 5 times
})
```

## React Hook Example

```typescript
// hooks/useBluebird.ts
import { useMemo } from 'react'
import { BluebirdClient } from '@bluebird/client'
import { useAuth } from './useAuth'

export function useBluebird() {
  const { token } = useAuth()

  const client = useMemo(
    () =>
      new BluebirdClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        authToken: token,
        onTokenRefresh: (newToken) => {
          // Update token in auth context
          localStorage.setItem('authToken', newToken)
        },
      }),
    [token]
  )

  return client
}
```

```typescript
// components/MyComponent.tsx
import { useBluebird } from '@/hooks/useBluebird'

export function MyComponent() {
  const client = useBluebird()

  const handleCreateProject = async () => {
    try {
      const project = await client.createProject({
        name: 'My New Song',
      })
      console.log('Created:', project)
    } catch (error) {
      console.error('Failed:', error)
    }
  }

  return <button onClick={handleCreateProject}>Create Project</button>
}
```

## Server-Side Usage (Next.js App Router)

```typescript
// app/api/projects/route.ts
import { BluebirdClient } from '@bluebird/client'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('authToken')?.value

  const client = new BluebirdClient({
    baseURL: process.env.API_URL, // Internal API URL
    authToken: token,
  })

  const projects = await client.listProjects()
  return Response.json(projects)
}
```

## TypeScript Support

All methods are fully typed using DTOs from `@bluebird/types`:

```typescript
import type { Project, PlanSongRequest, JobEvent } from '@bluebird/types'

// Request types are enforced
const request: PlanSongRequest = {
  projectId: 'project-123',
  lyrics: 'Lyrics...',
  genre: 'pop',
  vocalistId: 'artist-001',
}

// Response types are inferred
const project: Project = await client.createProject({
  name: 'Test',
})
```

## Configuration Options

```typescript
interface ClientConfig {
  baseURL?: string // API base URL (default: localhost:4000)
  authToken?: string // JWT token
  timeout?: number // Request timeout in ms (default: 30000)
  retries?: number // Max retry attempts (default: 3)
  onTokenRefresh?: (token: string) => void // Token refresh callback
}
```

## Available Methods

### Authentication

- `requestMagicLink(request)` - Send magic link email
- `verifyMagicLink(request)` - Verify magic link token
- `setAuthToken(token)` - Set JWT token
- `clearAuthToken()` - Clear JWT token

### Projects

- `createProject(request)` - Create new project
- `getProject(projectId)` - Get project by ID
- `updateProject(projectId, request)` - Update project
- `deleteProject(projectId)` - Delete project
- `listProjects()` - List all projects

### Analysis & Planning

- `analyzeLyrics(request)` - Analyze lyrics structure
- `planSong(request)` - Create arrangement and vocal plan

### Rendering

- `renderPreview(request)` - Render full preview
- `renderSection(request)` - Render single section

### Mixing & Export

- `mixFinal(request)` - Create final mix
- `exportPreview(request)` - Export master + stems

### Jobs

- `getJob(jobId)` - Get job status (polling)
- `getJobEventsURL(jobId)` - Get SSE URL for real-time updates

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build package
pnpm build

# Type check
pnpm typecheck
```

## License

MIT
