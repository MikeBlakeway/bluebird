/**
 * SkeletonSection Component
 *
 * Displays a skeleton loading state that mirrors the SectionCard structure.
 * Used during section regeneration to provide visual feedback that content is loading.
 */

import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react'

export function SkeletonSection() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="w-2/3 h-6 rounded-lg" />
          <Skeleton className="w-1/2 h-4 rounded-lg" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </CardHeader>

      <CardBody className="gap-2">
        {/* Section features skeleton */}
        <div className="flex gap-2">
          <Skeleton className="w-16 h-6 rounded-md" />
          <Skeleton className="w-16 h-6 rounded-md" />
        </div>

        {/* A/B toggle skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-4 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="w-12 h-8 rounded-lg" />
            <Skeleton className="w-12 h-8 rounded-lg" />
          </div>
        </div>

        {/* Regenerate button skeleton */}
        <Skeleton className="w-full h-8 rounded-lg" />
      </CardBody>
    </Card>
  )
}
