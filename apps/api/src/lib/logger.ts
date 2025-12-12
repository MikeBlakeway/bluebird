import pino from 'pino'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const ENV = process.env.BLUEBIRD_ENV || 'development'

export const logger = pino({
  level: LOG_LEVEL,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  transport:
    ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  base: {
    env: ENV,
    service: 'bluebird-api',
  },
})

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

export function createJobLogger(jobId: string, jobType: string) {
  return createChildLogger({ jobId, jobType })
}

export function createRouteLogger(route: string, method: string) {
  return createChildLogger({ route, method })
}
