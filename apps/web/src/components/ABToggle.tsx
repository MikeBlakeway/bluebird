/**
 * ABToggle Component
 *
 * Small toggle UI for switching between Version A and Version B.
 */

'use client'

import { Button } from '@heroui/react'
import type { PlaybackVersion } from '@/lib/audio-engine'

export interface ABToggleProps {
  activeVersion: PlaybackVersion
  onChange: (version: PlaybackVersion) => void
  disabled?: boolean
  isBAvailable?: boolean
}

export function ABToggle({
  activeVersion,
  onChange,
  disabled = false,
  isBAvailable = true,
}: ABToggleProps) {
  const isAActive = activeVersion === 'A'
  const isBActive = activeVersion === 'B'

  return (
    <div className="flex items-center gap-2" aria-label="A/B version toggle">
      <span className="text-xs text-default-500">Version:</span>
      <div className="flex items-center gap-1" role="group" aria-label="Select version">
        <Button
          size="sm"
          variant={isAActive ? 'solid' : 'flat'}
          color={isAActive ? 'primary' : 'default'}
          onPress={() => onChange('A')}
          isDisabled={disabled}
          aria-pressed={isAActive}
          aria-label="Switch to Version A"
          className="min-w-unit-8"
        >
          A
        </Button>
        <Button
          size="sm"
          variant={isBActive ? 'solid' : 'flat'}
          color={isBActive ? 'primary' : 'default'}
          onPress={() => onChange('B')}
          isDisabled={disabled || !isBAvailable}
          aria-pressed={isBActive}
          aria-label={isBAvailable ? 'Switch to Version B' : 'Version B unavailable'}
          className="min-w-unit-8"
        >
          B
        </Button>
      </div>
    </div>
  )
}
