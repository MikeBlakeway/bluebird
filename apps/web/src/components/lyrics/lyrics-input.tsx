'use client'

import React, { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface LyricsInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

const MIN_LYRICS = 4
const MAX_LYRICS = 100
const MIN_CHARS = 10
const MAX_CHARS = 5000

export function LyricsInput({ value, onChange, error, disabled, className }: LyricsInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const lines = value.split('\n')
  const lineNumbers = lines.map((_, i) => i + 1)

  const isEmpty = value.trim().length === 0
  const lineCount = value.split('\n').filter((line) => line.trim().length > 0).length

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="lyrics"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Lyrics
        </label>
        <span className="text-xs text-muted-foreground">
          {lineCount} / {MIN_LYRICS}-{MAX_LYRICS} lines
        </span>
      </div>

      <div
        className={cn('relative border rounded-md overflow-hidden', {
          'border-destructive': error && !isEmpty,
          'border-input': !error || isEmpty,
        })}
      >
        <div className="flex">
          {/* Line numbers */}
          <div className="bg-muted px-3 py-2 text-right text-xs text-muted-foreground select-none pointer-events-none font-mono">
            {lineNumbers.map((num) => (
              <div key={num} className="h-6">
                {num}
              </div>
            ))}
            {/* Placeholder line when empty */}
            {isEmpty && <div className="h-6">1</div>}
          </div>

          {/* Textarea */}
          <textarea
            id="lyrics"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={`Paste or type your lyrics here (${MIN_LYRICS}-${MAX_LYRICS} lines, ${MIN_CHARS}-${MAX_CHARS} characters)`}
            className={cn(
              'flex-1 px-3 py-2 bg-background text-sm font-mono resize-none focus:outline-none',
              'placeholder:text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            rows={12}
            spellCheck="true"
          />
        </div>
      </div>

      {/* Error message */}
      {error && !isEmpty && <p className="text-xs text-destructive">{error}</p>}

      {/* Validation feedback */}
      {!isEmpty && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className={lineCount < MIN_LYRICS ? 'text-destructive' : 'text-green-600'}>
              {lineCount < MIN_LYRICS
                ? `Need ${MIN_LYRICS - lineCount} more line${MIN_LYRICS - lineCount !== 1 ? 's' : ''}`
                : '✓ Lines OK'}
            </span>
            <span className={value.length > MAX_CHARS ? 'text-destructive' : 'text-green-600'}>
              {value.length} / {MAX_CHARS} characters
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
