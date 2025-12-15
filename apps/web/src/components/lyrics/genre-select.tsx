'use client'

import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bluebird/ui'

interface GenreSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const GENRES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'r-and-b', label: 'R&B' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'country', label: 'Country' },
  { value: 'folk', label: 'Folk' },
  { value: 'indie', label: 'Indie' },
  { value: 'alternative', label: 'Alternative' },
]

export function GenreSelect({ value, onChange, disabled, className }: GenreSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor="genre"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Genre
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="genre" className="h-10">
          <SelectValue placeholder="Select a genre..." />
        </SelectTrigger>
        <SelectContent>
          {GENRES.map((genre) => (
            <SelectItem key={genre.value} value={genre.value}>
              {genre.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
