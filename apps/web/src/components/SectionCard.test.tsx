/**
 * Tests for SectionCard Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SectionCard, type Section } from './SectionCard'

describe('SectionCard', () => {
  const mockSection: Section = {
    name: 'Intro',
    duration: 75, // 1:15
    bpm: 120,
    hasMusic: true,
    hasVocals: true,
  }

  const defaultProps = {
    sectionIdx: 0,
    section: mockSection,
    isLocked: false,
    onToggleLock: vi.fn(),
  }

  it('renders section metadata correctly', () => {
    render(<SectionCard {...defaultProps} />)

    expect(screen.getByText('Section 1: Intro')).not.toBeNull()
    expect(screen.getByText(/Duration: 1:15/)).not.toBeNull()
    expect(screen.getByText(/BPM: 120/)).not.toBeNull()
  })

  it('shows music and vocal badges when present', () => {
    render(<SectionCard {...defaultProps} />)

    expect(screen.getByLabelText(/has music track/i)).not.toBeNull()
    expect(screen.getByLabelText(/has vocal track/i)).not.toBeNull()
  })

  it('hides badges when tracks not present', () => {
    const sectionNoTracks: Section = {
      ...mockSection,
      hasMusic: false,
      hasVocals: false,
    }

    render(<SectionCard {...defaultProps} section={sectionNoTracks} />)

    expect(screen.queryByLabelText(/has music track/i)).toBeNull()
    expect(screen.queryByLabelText(/has vocal track/i)).toBeNull()
  })

  it('renders LockToggle component', () => {
    render(<SectionCard {...defaultProps} />)

    const lockToggle = screen.getByRole('switch')
    expect(lockToggle).not.toBeNull()
  })

  it('applies opacity-50 when locked', () => {
    render(<SectionCard {...defaultProps} isLocked={true} />)

    const card = screen.getByLabelText(/Section 1: Intro/i)
    expect(card.className).toContain('opacity-50')
  })

  it('applies opacity-100 when not locked', () => {
    render(<SectionCard {...defaultProps} isLocked={false} />)

    const card = screen.getByLabelText(/Section 1: Intro/i)
    expect(card.className).toContain('opacity-100')
  })

  it('calls onToggleLock when LockToggle clicked', () => {
    const onToggleLock = vi.fn()

    render(<SectionCard {...defaultProps} sectionIdx={2} onToggleLock={onToggleLock} />)

    const lockToggle = screen.getByRole('switch')
    fireEvent.click(lockToggle)

    expect(onToggleLock).toHaveBeenCalledWith(2)
  })

  it('shows regenerate button when onRegenerate provided', () => {
    render(<SectionCard {...defaultProps} onRegenerate={vi.fn()} />)

    const regenButton = screen.getByRole('button', { name: /regenerate section/i })
    expect(regenButton).not.toBeNull()
  })

  it('hides regenerate button when onRegenerate not provided', () => {
    render(<SectionCard {...defaultProps} />)

    const regenButton = screen.queryByRole('button', { name: /regenerate/i })
    expect(regenButton).toBeNull()
  })

  it('disables regenerate button when locked', () => {
    render(<SectionCard {...defaultProps} isLocked={true} onRegenerate={vi.fn()} />)

    const regenButton = screen.getByRole('button', {
      name: /regenerate disabled/i,
    }) as HTMLButtonElement
    expect(regenButton.disabled).toBe(true)
  })

  it('disables regenerate button when regenerating', () => {
    render(<SectionCard {...defaultProps} isRegenerating={true} onRegenerate={vi.fn()} />)

    const regenButton = screen.getByRole('button', {
      name: /regenerating section/i,
    }) as HTMLButtonElement
    expect(regenButton.disabled).toBe(true)
  })

  it('shows loading state when regenerating', () => {
    render(<SectionCard {...defaultProps} isRegenerating={true} onRegenerate={vi.fn()} />)

    expect(screen.getByText('Regenerating...')).not.toBeNull()
  })

  it('calls onRegenerate with sectionIdx when clicked', () => {
    const onRegenerate = vi.fn()

    render(<SectionCard {...defaultProps} sectionIdx={3} onRegenerate={onRegenerate} />)

    const regenButton = screen.getByRole('button', { name: /regenerate section/i })
    fireEvent.click(regenButton)

    expect(onRegenerate).toHaveBeenCalledWith(3)
  })

  it('does not call onRegenerate when locked', () => {
    const onRegenerate = vi.fn()

    render(<SectionCard {...defaultProps} isLocked={true} onRegenerate={onRegenerate} />)

    const regenButton = screen.getByRole('button', { name: /regenerate disabled/i })
    fireEvent.click(regenButton)

    // Button is disabled, so click should not trigger callback
    expect(onRegenerate).not.toHaveBeenCalled()
  })

  it('card has correct aria attributes', () => {
    render(<SectionCard {...defaultProps} />)

    const card = screen.getByLabelText('Section 1: Intro')
    expect(card.getAttribute('aria-readonly')).toBe('false')
    expect(card.getAttribute('tabindex')).toBe('0')
  })

  it('card has aria-readonly=true when locked', () => {
    render(<SectionCard {...defaultProps} isLocked={true} />)

    const card = screen.getByLabelText('Section 1: Intro')
    expect(card.getAttribute('aria-readonly')).toBe('true')
  })
})
