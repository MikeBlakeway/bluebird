'use client'

import { useRouter } from 'next/navigation'
import { LyricsForm } from '@/components/lyrics/lyrics-form'

export default function NewStudioPage() {
  const router = useRouter()

  // For now, use a stub project ID. In production, this would be created first
  const projectId = 'project-' + Date.now()

  const handleJobStarted = (jobId: string) => {
    // Navigate to the job timeline/preview page
    router.push(`/studio/jobs/${jobId}`)
  }

  const handleError = (error: Error) => {
    // Error is displayed in the form itself
    console.error('Failed to create composition:', error.message)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">New Composition</h1>

        <div className="bg-card border rounded-lg p-6">
          <LyricsForm
            projectId={projectId}
            onJobCreated={handleJobStarted}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  )
}
