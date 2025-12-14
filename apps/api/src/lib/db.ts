import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function buildPooledDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const url = new URL(rawUrl)
  // Keep pool tight to avoid exhausting Postgres under load
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '10')
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '5')
  }

  return url.toString()
}

const DATABASE_URL = buildPooledDatabaseUrl()

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect()
}

export default prisma
