'use client'

import { useMemo } from 'react'
import { BluebirdClient } from '@bluebird/client'

export function useClient() {
  return useMemo(() => {
    const baseURL =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        : ''
    return new BluebirdClient({ baseURL })
  }, [])
}
