'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useClient } from '@/hooks/use-client'
import { LyricsInput } from './lyrics-input'
import { GenreSelect } from './genre-select'
import { ArtistSelect } from './artist-select'
import { GenerateButton } from './generate-button'
import { cn } from '@/lib/utils'

interface LyricsFormProps {
  projectId: string
  onJobCreated?: (jobId: string) => void
  onError?: (error: Error) => void
  className?: string
}

const MIN_LINES = 4
const MAX_LINES = 100

function validateLyrics(lyrics: string): string | null {
  const lines = lyrics.split('\n').filter((line) => line.trim().length > 0)

  if (lines.length < MIN_LINES) {
    return `Lyrics must have at least ${MIN_LINES} lines`
  }
  if (lines.length > MAX_LINES) {
    return `Lyrics must have at most ${MAX_LINES} lines`
  }
  if (lyrics.length < 10) {
    return 'Lyrics must be at least 10 characters'
  }
  if (lyrics.length > 5000) {
    return 'Lyrics must be at most 5000 characters'
  }

  return null
}

export function LyricsForm({ projectId, onJobCreated, onError, className }: LyricsFormProps) {
  const client = useClient()
  const [lyrics, setLyrics] = useState('')
  const [genre, setGenre] = useState('')
  const [artist, setArtist] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lyricsError = useMemo(() => validateLyrics(lyrics), [lyrics])

  const canSubmit = useMemo(
    () => !lyricsError && genre && artist && !isLoading,
    [lyricsError, genre, artist, isLoading]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!canSubmit) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await client.planSong({
          projectId,
          lyrics,
          genre,
        })

        if (response.jobId) {
          onJobCreated?.(response.jobId)
        } else {
          throw new Error('No job ID returned from server')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview'
        setError(errorMessage)
        onError?.(err instanceof Error ? err : new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    },
    [canSubmit, client, lyrics, genre, projectId, onJobCreated, onError]
  )

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-8', className)}>
      {/* Lyrics Input Section */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-3">
          <h2 className="text-lg font-semibold text-foreground">Lyrics</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Enter 4-100 lines (10-5000 characters total). One line per row.
          </p>
        </div>
        <LyricsInput
          value={lyrics}
          onChange={setLyrics}
          error={lyricsError || undefined}
          disabled={isLoading}
        />
      </div>

      {/* Genre & Artist Section */}
      <div className="space-y-4">
        <div className="border-b border-border/40 pb-3">
          <h2 className="text-lg font-semibold text-foreground">Style</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Select genre and AI artist to define your composition's sound.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <GenreSelect value={genre} onChange={setGenre} disabled={isLoading} />
          <ArtistSelect value={artist} onChange={setArtist} disabled={isLoading} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-destructive">Error</p>
          <p className="text-sm text-destructive/90">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <GenerateButton
          type="submit"
          disabled={!canSubmit}
          isLoading={isLoading}
          className="w-full h-11 text-base"
        />
      </div>
    </form>
  )
}
