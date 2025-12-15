'use client'

import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bluebird/ui'

interface ArtistSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const ARTISTS = [
  { value: 'aria', label: 'Aria (Pop/Jazz Female)' },
  { value: 'echo', label: 'Echo (Rock/Indie Male)' },
  { value: 'nova', label: 'Nova (R&B/Soul Female)' },
  { value: 'sage', label: 'Sage (Folk/Acoustic Male)' },
  { value: 'spark', label: 'Spark (Hip-Hop/Electronic Male)' },
]

export function ArtistSelect({ value, onChange, disabled, className }: ArtistSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor="artist"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        AI Artist
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="artist" className="h-10">
          <SelectValue placeholder="Select an artist..." />
        </SelectTrigger>
        <SelectContent>
          {ARTISTS.map((artist) => (
            <SelectItem key={artist.value} value={artist.value}>
              {artist.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
