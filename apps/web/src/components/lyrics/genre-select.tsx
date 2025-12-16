'use client'

import { cn } from '@/lib/utils'
import { Select, SelectItem } from '@heroui/react'

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
    <Select
      label="Genre"
      placeholder="Select a genre..."
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0]
        if (selected) onChange(selected as string)
      }}
      isDisabled={disabled}
      className={cn(className)}
    >
      {GENRES.map((genre) => (
        <SelectItem key={genre.value}>{genre.label}</SelectItem>
      ))}
    </Select>
  )
}
