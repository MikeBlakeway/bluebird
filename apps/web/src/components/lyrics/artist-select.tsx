'use client'

import { cn } from '@/lib/utils'
import { Select, SelectItem } from '@heroui/react'

interface ArtistSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const AI_ARTISTS = [
  { value: 'aria', label: 'Aria (Pop/Jazz Female)' },
  { value: 'echo', label: 'Echo (Rock/Indie Male)' },
  { value: 'nova', label: 'Nova (R&B/Soul Female)' },
  { value: 'sage', label: 'Sage (Folk/Acoustic Male)' },
  { value: 'spark', label: 'Spark (Hip-Hop/Electronic Male)' },
]

export function ArtistSelect({ value, onChange, disabled, className }: ArtistSelectProps) {
  return (
    <Select
      label="AI Artist"
      placeholder="Select an AI artist..."
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0]
        if (selected) onChange(selected as string)
      }}
      isDisabled={disabled}
      className={cn(className)}
    >
      {AI_ARTISTS.map((artist) => (
        <SelectItem key={artist.value}>{artist.label}</SelectItem>
      ))}
    </Select>
  )
}
