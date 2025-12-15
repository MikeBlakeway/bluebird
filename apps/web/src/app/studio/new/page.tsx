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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Create a Composition
            </h1>
            <p className="text-lg text-muted-foreground">
              Write your lyrics and Bluebird will generate an original melody, harmony, and
              arrangement.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <LyricsForm
              projectId={projectId}
              onJobCreated={handleJobStarted}
              onError={handleError}
            />
          </div>

          {/* Info Callout */}
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> The longer and more detailed your lyrics,
              the better the composition will be.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
