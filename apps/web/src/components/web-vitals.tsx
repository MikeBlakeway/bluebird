'use client'

import { useReportWebVitals } from 'next/web-vitals'

/**
 * Web Vitals reporting component
 * Captures Core Web Vitals metrics and sends them to analytics
 *
 * Core metrics:
 * - CLS: Cumulative Layout Shift
 * - FID: First Input Delay
 * - FCP: First Contentful Paint
 * - LCP: Largest Contentful Paint
 * - TTFB: Time to First Byte
 * - INP: Interaction to Next Paint
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      })
    }

    // TODO Sprint 3: Send to analytics service (e.g., Vercel Analytics, Google Analytics)
    // Example:
    // switch (metric.name) {
    //   case 'FCP':
    //     // Track First Contentful Paint
    //     break
    //   case 'LCP':
    //     // Track Largest Contentful Paint
    //     break
    //   case 'CLS':
    //     // Track Cumulative Layout Shift
    //     break
    //   case 'FID':
    //     // Track First Input Delay
    //     break
    //   case 'TTFB':
    //     // Track Time to First Byte
    //     break
    //   case 'INP':
    //     // Track Interaction to Next Paint
    //     break
    // }
  })

  return null
}
