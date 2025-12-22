---
sidebar_position: 7
---

# Next.js Best Practices

Production-ready Next.js 15+ patterns and configurations for Bluebird's web application. All changes follow Vercel's official documentation and optimization checklist.

## Overview

The Bluebird frontend (`apps/web`) is built with **Next.js 15** using the **App Router** for modern, performant React applications. This guide documents best practices implemented and patterns to follow.

**Key Stack**:

- Next.js 15.0+
- React 18.3
- TypeScript 5.3
- Tailwind CSS 3.4
- App Router (not Pages Router)

---

## TypeScript Configuration

### TypeScript-First Config

**Convert to TypeScript**:

```typescript
// next.config.ts (not .js)
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
```

**Benefits**:

- ✅ Type-safe configuration
- ✅ IDE autocomplete for all options
- ✅ Catches config errors at build time
- ✅ Better alignment with modern conventions

---

## Typed Routes

### Enable Static Type Checking for Routes

```typescript
// next.config.ts
{
  experimental: {
    typedRoutes: true,
  }
}
```

### Usage

```typescript
import Link from 'next/link'

// ✅ Type-safe - IDE autocompletes routes
<Link href="/studio/new">Create Project</Link>
<Link href={`/studio/${projectId}`}>Open Project</Link>

// ❌ TypeScript error - route doesn't exist
<Link href="/invalid-path">Broken</Link>

// ✅ Dynamic routes type-checked
const route = `/studio/${id}` // type: string
```

**Benefits**:

- No broken links (caught at compile time)
- Autocomplete for all routes
- Refactoring safe (rename routes, IDE updates all refs)
- Prevents typos in href values

---

## Metadata & SEO

### Root Layout Metadata

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Bluebird',
    default: 'Bluebird — AI Music Composition',
  },
  description: 'Create original music with AI. Generate melodies, harmonies, and arrangements.',
  keywords: ['AI music', 'composition', 'vocals', 'remix', 'generation'],
  metadataBase: new URL('https://bluebird.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bluebird.app',
    siteName: 'Bluebird',
    title: 'Bluebird — AI Music Composition',
    description: 'Create original music with AI.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bluebird - Create music with AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bluebird',
    description: 'Create original music with AI',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}
```

### Dynamic Metadata (Per-Page)

```typescript
// src/app/studio/[projectId]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { projectId: string }
}): Promise<Metadata> {
  const project = await getProject(params.projectId)

  return {
    title: project.title,
    description: `Edit ${project.title} on Bluebird`,
    openGraph: {
      title: project.title,
      description: `Create music with AI on Bluebird`,
      images: [project.thumbnailUrl],
    },
  }
}
```

---

## Font Optimization

### Self-Hosted Fonts with Swap Display

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // ✅ Prevent FOUT - text visible immediately
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

**Benefits**:

- ✅ **No FOUT** (Flash of Unstyled Text) — text renders immediately
- ✅ **Reduces CLS** (Cumulative Layout Shift) — no layout jumps when font loads
- ✅ **Optimal Performance** — font swaps in smoothly
- ✅ **Self-Hosted** — no external requests to Google Fonts CDN

### Tailwind Integration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## Performance Monitoring

### Web Vitals Tracking

```typescript
// src/app/layout.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'
import type { WebVitalsMetric } from 'next/web-vitals'

function WebVitals() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Log Core Web Vitals
    console.log(`${metric.name}:`, {
      value: metric.value.toFixed(2),
      rating: metric.rating,
      id: metric.id,
    })

    // TODO: Send to analytics service (Sprint 3)
    // analytics.track(metric.name, {
    //   value: metric.value,
    //   rating: metric.rating,
    //   url: window.location.href,
    // })
  })

  return null
}
```

### Tracked Metrics

| Metric   | What It Measures                                | Target |
| -------- | ----------------------------------------------- | ------ |
| **FCP**  | First Contentful Paint — Time to first render   | ≤1.8s  |
| **LCP**  | Largest Contentful Paint — Time to main content | ≤2.5s  |
| **CLS**  | Cumulative Layout Shift — Visual stability      | ≤0.1   |
| **FID**  | First Input Delay — Interactivity (deprecated)  | ≤100ms |
| **INP**  | Interaction to Next Paint — Responsiveness      | ≤200ms |
| **TTFB** | Time to First Byte — Server response            | ≤600ms |

**Future Integration** (Sprint 3):

```typescript
// Send to Datadog, Vercel Analytics, or custom service
analytics.track(metric.name, {
  value: metric.value,
  rating: metric.rating,
  route: router.pathname,
})
```

---

## Image Optimization

### Use Next.js Image Component

```typescript
import Image from 'next/image'

// ❌ WRONG: HTML <img> tag
<img src="/album-cover.jpg" alt="Album" />

// ✅ CORRECT: Next.js Image component
<Image
  src="/album-cover.jpg"
  alt="Album Cover"
  width={400}
  height={400}
  priority // For above-the-fold images
  className="rounded-lg"
/>
```

**Benefits**:

- ✅ **Lazy loading** — Images load only when entering viewport
- ✅ **Responsive** — Serves optimized size for device
- ✅ **Format negotiation** — Serves WebP/AVIF if supported
- ✅ **Prevents CLS** — Dimensions reserved before load
- ✅ **Priority** — Critical images preload

### Background Images

```typescript
// src/components/hero.tsx
export function Hero() {
  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{
        backgroundImage: 'url(/hero.jpg)',
      }}
    >
      {/* Content */}
    </div>
  )
}

// Better: Use image with absolute positioning
export function HeroOptimized() {
  return (
    <div className="relative h-screen overflow-hidden">
      <Image
        src="/hero.jpg"
        alt="Hero Background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Content */}
      </div>
    </div>
  )
}
```

---

## API Routes & Server Actions

### Server Actions (Preferred)

```typescript
// src/app/projects/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const title = formData.get('title') as string

  // Server-side validation
  if (!title || title.length < 3) {
    throw new Error('Title must be at least 3 characters')
  }

  // Call API or database
  const project = await db.projects.create({
    title,
    userId: session.user.id,
  })

  // Revalidate cache
  revalidatePath('/projects')

  // Redirect
  redirect(`/studio/${project.id}`)
}
```

**Usage in Client Component**:

```typescript
'use client'

import { createProject } from './actions'

export function CreateProjectForm() {
  const [error, setError] = useState<string>()

  return (
    <form
      action={createProject}
      onSubmit={(e) => {
        e.preventDefault()
        try {
          // Form will auto-submit via action
        } catch (err) {
          setError((err as Error).message)
        }
      }}
    >
      <input name="title" placeholder="Project name" required />
      <button type="submit">Create</button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  )
}
```

**Benefits**:

- ✅ No API routes needed for simple CRUD
- ✅ Type-safe form handling
- ✅ Direct database access (no HTTP layer)
- ✅ Better error handling
- ✅ Built-in security (no exposed endpoints)

### API Routes (When Needed)

```typescript
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate
  if (!body.title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  // Create project
  const project = await db.projects.create(body)

  return NextResponse.json(project, { status: 201 })
}
```

---

## Middleware & Request Handling

### Auth Middleware

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Check auth
  const token = request.cookies.get('session')?.value

  // Redirect unauthenticated users
  if (!token && isProtectedRoute(request.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add user ID to headers for downstream use
  if (token) {
    const response = NextResponse.next()
    response.headers.set('x-user-id', decodeToken(token).userId)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*', '/projects/:path*', '/account/:path*'],
}
```

---

## Development Workflow

### Local Development

```bash
# Start dev server (with Fast Refresh)
pnpm -F @bluebird/web run dev

# Open http://localhost:3000

# Changes auto-reload
# Type errors shown in terminal
```

### Type Checking

```bash
# Check types without building
pnpm -F @bluebird/web run typecheck

# Or use tsc directly
tsc --noEmit
```

### Production Build

```bash
# Build for production
pnpm -F @bluebird/web run build

# Start production server
pnpm -F @bluebird/web run start
```

---

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel deploy

# Or configure GitHub integration for auto-deploy
```

**Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://api.bluebird.app
NEXT_PUBLIC_CDN_URL=https://cdn.bluebird.app
```

### Self-Hosted (Docker)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Debugging & Performance

### Network Requests

Use browser DevTools:

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Look for slow requests (>500ms)
4. Check waterfall for parallelization opportunities

### Performance Profiling

```typescript
// src/lib/perf.ts
export function measurePerformance(label: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${label}: ${(end - start).toFixed(2)}ms`)
}

// Usage
measurePerformance('createProject', () => {
  // Slow code
})
```

### Next.js Analyzer

```bash
# Analyze bundle size
ANALYZE=true pnpm build

# View interactive visualization
```

---

## Related Documentation

- [TypeScript Configuration](typescript.md) — Monorepo TypeScript setup
- [Performance Baseline](performance.md) — TTFP targets and measurement
- [Deployment Checklist](deployment.md) — Pre-deploy verification steps

---

**Questions?** See [Next.js Documentation](https://nextjs.org/docs) or ask in #frontend Slack.
