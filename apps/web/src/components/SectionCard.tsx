/**
 * SectionCard Component
 *
 * Displays a section with metadata, lock toggle, and regeneration controls.
 * Locked sections are visually grayed out and cannot be regenerated.
 */

import { Button, Card, CardBody, CardHeader } from '@heroui/react'
import { Music, Mic, RotateCw } from 'lucide-react'
import { LockToggle } from './LockToggle'

// ============================================================================
// Types
// ============================================================================

export interface Section {
  name: string
  duration: number // seconds
  bpm: number
  hasMusic: boolean
  hasVocals: boolean
}

export interface SectionCardProps {
  /** Section index (0-based) */
  sectionIdx: number
  /** Section data */
  section: Section
  /** Whether the section is locked */
  isLocked: boolean
  /** Callback to toggle lock state */
  onToggleLock: (sectionIdx: number) => void
  /** Callback to regenerate section (optional) */
  onRegenerate?: (sectionIdx: number) => void
  /** Whether section is currently being regenerated */
  isRegenerating?: boolean
  /** Whether regeneration is available */
  canRegenerate?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function SectionCard({
  sectionIdx,
  section,
  isLocked,
  onToggleLock,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
}: SectionCardProps) {
  const handleRegenerate = () => {
    if (isLocked) {
      return // Silently ignore if locked (UI should disable button)
    }
    if (onRegenerate) {
      onRegenerate(sectionIdx)
    }
  }

  const isRegenDisabled = isLocked || isRegenerating || !canRegenerate

  return (
    <Card
      className={`
        transition-opacity
        ${isLocked ? 'opacity-50' : 'opacity-100'}
      `}
      aria-label={`Section ${sectionIdx + 1}: ${section.name}`}
      aria-readonly={isLocked}
      tabIndex={0}
    >
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-md font-semibold">
            Section {sectionIdx + 1}: {section.name}
          </h3>
          <p className="text-xs text-default-500">
            Duration: {Math.floor(section.duration / 60)}:
            {String(section.duration % 60).padStart(2, '0')} · BPM: {section.bpm}
          </p>
        </div>
        <LockToggle sectionIdx={sectionIdx} isLocked={isLocked} onToggle={onToggleLock} />
      </CardHeader>

      <CardBody className="gap-2">
        {/* Section features */}
        <div className="flex gap-2">
          {section.hasMusic && (
            <div
              className="flex items-center gap-1 rounded-md bg-primary-100 px-2 py-1 text-xs text-primary-700 dark:bg-primary-900 dark:text-primary-300"
              aria-label="Has music track"
            >
              <Music className="h-3 w-3" aria-hidden="true" />
              <span>Music</span>
            </div>
          )}
          {section.hasVocals && (
            <div
              className="flex items-center gap-1 rounded-md bg-secondary-100 px-2 py-1 text-xs text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300"
              aria-label="Has vocal track"
            >
              <Mic className="h-3 w-3" aria-hidden="true" />
              <span>Vocals</span>
            </div>
          )}
        </div>

        {/* Regenerate button */}
        {onRegenerate && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<RotateCw className="h-4 w-4" aria-hidden="true" />}
            onPress={handleRegenerate}
            isDisabled={isRegenDisabled}
            isLoading={isRegenerating}
            aria-label={
              isLocked
                ? 'Regenerate disabled, section is locked'
                : isRegenerating
                  ? 'Regenerating section'
                  : 'Regenerate section'
            }
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
