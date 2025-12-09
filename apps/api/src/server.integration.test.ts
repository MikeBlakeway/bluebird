import { test, describe, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../src/server.js'
import type { FastifyInstance } from 'fastify'

let server: FastifyInstance

beforeAll(async () => {
  server = await createServer()
})

afterAll(async () => {
  await server.close()
})

describe('Auth Routes', () => {
  test('POST /auth/magic-link should request a magic link', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/auth/magic-link',
      payload: {
        email: 'test@example.com',
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.message).toContain('test@example.com')
  })

  test('GET /health should return ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.status).toBe('ok')
  })
})

describe('Project Routes', () => {
  test('GET /projects should return 401 without auth', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/projects',
    })

    expect(response.statusCode).toBe(401)
  })

  test('POST /projects should return 401 without auth', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/projects',
      payload: {
        name: 'Test Project',
        lyrics: 'This is a test project with lyrics that are long enough',
        genre: 'Pop',
      },
    })

    expect(response.statusCode).toBe(401)
  })
})
