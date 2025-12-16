/**
 * LockToggle Component
 *
 * Icon button to toggle section lock state. Locked sections cannot be
 * regenerated, providing user control over which content to preserve.
 */

import { Button, Tooltip } from '@heroui/react'
import { Lock, Unlock } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface LockToggleProps {
  /** Section index */
  sectionIdx: number
  /** Whether the section is currently locked */
  isLocked: boolean
  /** Callback when lock state is toggled */
  onToggle: (sectionIdx: number) => void
  /** Disable the toggle button */
  disabled?: boolean
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Custom aria-label (defaults to lock/unlock description) */
  'aria-label'?: string
}

// ============================================================================
// Component
// ============================================================================

export function LockToggle({
  sectionIdx,
  isLocked,
  onToggle,
  disabled = false,
  size = 'sm',
  'aria-label': ariaLabel,
}: LockToggleProps) {
  const defaultLabel = isLocked ? 'Unlock section' : 'Lock section'
  const label = ariaLabel || defaultLabel

  return (
    <Tooltip content={isLocked ? 'Unlock to allow regeneration' : 'Lock to preserve content'}>
      <Button
        isIconOnly
        variant="light"
        size={size}
        onPress={() => onToggle(sectionIdx)}
        isDisabled={disabled}
        aria-label={label}
        aria-pressed={isLocked}
        role="switch"
        className="min-w-unit-8 data-[pressed=true]:text-warning-500"
      >
        {isLocked ? (
          <Lock className="h-4 w-4 text-warning-500" aria-hidden="true" />
        ) : (
          <Unlock className="h-4 w-4 text-default-400" aria-hidden="true" />
        )}
      </Button>
    </Tooltip>
  )
}
