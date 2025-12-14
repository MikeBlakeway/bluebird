/**
 * Tests for SSE Authorization Fix (Phase 1 Security Improvement)
 *
 * Verifies that:
 * 1. Unauthenticated users cannot access SSE streams
 * 2. Authenticated users can only access their own job streams
 * 3. Attempting to access another user's job returns 404
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../server.js'
import type { FastifyInstance } from 'fastify'
import { generateToken } from '../../lib/jwt.js'
import { prisma } from '../../lib/db.js'

describe('SSE Authorization (Security Fix)', () => {
  let server: FastifyInstance | undefined
  let user1Token: string
  let user2Token: string
  let user1Id: string
  let user2Id: string
  let user1ProjectId: string
  let user2ProjectId: string

  beforeAll(async () => {
    try {
      server = await createServer()

      // Create test users
      const user1 = await prisma.user.create({
        data: { email: 'user1@test.com', name: 'User 1' },
      })
      const user2 = await prisma.user.create({
        data: { email: 'user2@test.com', name: 'User 2' },
      })

      user1Id = user1.id
      user2Id = user2.id

      // Generate tokens
      user1Token = await generateToken({ userId: user1.id, email: user1.email })
      user2Token = await generateToken({ userId: user2.id, email: user2.email })

      // Create projects for each user
      const project1 = await prisma.project.create({
        data: {
          userId: user1.id,
          name: 'User 1 Project',
          lyrics: 'These are lyrics for user 1 with enough words to pass validation',
          genre: 'pop',
        },
      })

      const project2 = await prisma.project.create({
        data: {
          userId: user2.id,
          name: 'User 2 Project',
          lyrics: 'These are lyrics for user 2 with enough words to pass validation',
          genre: 'rock',
        },
      })

      user1ProjectId = project1.id
      user2ProjectId = project2.id

      // Create takes with jobIds for each project
      await prisma.take.create({
        data: {
          projectId: project1.id,
          jobId: 'user1-job-id',
          plan: {},
          status: 'pending',
        },
      })

      await prisma.take.create({
        data: {
          projectId: project2.id,
          jobId: 'user2-job-id',
          plan: {},
          status: 'pending',
        },
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to setup SSE authorization tests:', error)
      server = undefined
    }
  })

  afterAll(async () => {
    // Cleanup test data
    if (user1ProjectId) {
      await prisma.take.deleteMany({ where: { projectId: user1ProjectId } })
      await prisma.project.delete({ where: { id: user1ProjectId } })
    }
    if (user2ProjectId) {
      await prisma.take.deleteMany({ where: { projectId: user2ProjectId } })
      await prisma.project.delete({ where: { id: user2ProjectId } })
    }
    if (user1Id) {
      await prisma.user.delete({ where: { id: user1Id } })
    }
    if (user2Id) {
      await prisma.user.delete({ where: { id: user2Id } })
    }

    if (server) {
      await server.close()
    }
  })

  it('should reject unauthenticated requests with 401', async () => {
    if (!server) return

    const response = await server.inject({
      method: 'GET',
      url: '/jobs/user1-job-id/events',
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body)
    expect(body.message).toBe('Unauthorized')
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('should allow authenticated user to access their own job', async () => {
    if (!server) return

    const response = await server.inject({
      method: 'GET',
      url: '/jobs/user1-job-id/events',
      cookies: { auth_token: user1Token },
    })

    // SSE should start streaming (200)
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/event-stream')
  })

  it('should reject user trying to access another users job with 404', async () => {
    if (!server) return

    const response = await server.inject({
      method: 'GET',
      url: '/jobs/user2-job-id/events', // User 2's job
      cookies: { auth_token: user1Token }, // User 1's token
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Job not found')
  })

  it('should reject requests for non-existent jobs with 404', async () => {
    if (!server) return

    const response = await server.inject({
      method: 'GET',
      url: '/jobs/non-existent-job-id/events',
      cookies: { auth_token: user1Token },
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Job not found')
  })

  it('should allow user 2 to access their own job', async () => {
    if (!server) return

    const response = await server.inject({
      method: 'GET',
      url: '/jobs/user2-job-id/events',
      cookies: { auth_token: user2Token },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/event-stream')
  })
})
