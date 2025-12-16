/**
 * StageIndicator Component Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StageIndicator } from './StageIndicator'
import type { StageState } from '@/hooks/use-job-timeline'
import type { StageDefinition } from '@/lib/timeline-stages'
import { Music } from 'lucide-react'

describe('StageIndicator', () => {
  const mockStage: StageDefinition = {
    id: 'music-render',
    label: 'Music',
    description: 'Rendering instrumental tracks',
    estimatedDuration: 20000,
    icon: Music,
    color: 'primary',
  }

  it('should render pending state correctly', () => {
    const state: StageState = {
      status: 'pending',
      progress: 0,
    }

    render(<StageIndicator stage={mockStage} state={state} />)

    expect(screen.getByText('Music')).toBeTruthy()
    // Pending stages should have muted styling
    const label = screen.getByText('Music')
    expect(label.className).toContain('text-default-400')
  })

  it('should render active state with progress bar', () => {
    const state: StageState = {
      status: 'active',
      progress: 0.45,
    }

    render(<StageIndicator stage={mockStage} state={state} />)

    expect(screen.getByText('Music')).toBeTruthy()
    expect(screen.getByText('Rendering instrumental tracks')).toBeTruthy()

    // Should show progress bar with correct value
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeTruthy()
    expect(progressBar.getAttribute('aria-valuenow')).toBe('45')
  })

  it('should render complete state', () => {
    const state: StageState = {
      status: 'complete',
      progress: 1,
      duration: 18500,
    }

    render(<StageIndicator stage={mockStage} state={state} />)

    expect(screen.getByText('Music')).toBeTruthy()
    expect(screen.getByText('19s')).toBeTruthy() // Rounded duration
  })

  it('should render failed state with error message', () => {
    const errorMessage = 'Synthesis timeout'
    const state: StageState = {
      status: 'failed',
      progress: 0.3,
      error: errorMessage,
    }

    render(<StageIndicator stage={mockStage} state={state} />)

    expect(screen.getByText('Music')).toBeTruthy()
    expect(screen.getByText(errorMessage)).toBeTruthy()
  })

  it('should display custom message when provided', () => {
    const customMessage = 'Processing chord progressions...'
    const state: StageState = {
      status: 'active',
      progress: 0.5,
      message: customMessage,
    }

    render(<StageIndicator stage={mockStage} state={state} />)

    expect(screen.getByText(customMessage)).toBeTruthy()
  })

  it('should format duration correctly', () => {
    const testCases = [
      { duration: 1234, expected: '1s' },
      { duration: 5678, expected: '6s' },
      { duration: 12000, expected: '12s' },
    ]

    testCases.forEach(({ duration, expected }) => {
      const state: StageState = {
        status: 'complete',
        progress: 1,
        duration,
      }

      const { unmount } = render(<StageIndicator stage={mockStage} state={state} />)
      expect(screen.getByText(expected)).toBeTruthy()
      unmount()
    })
  })

  it('should render compact layout when compact prop is true', () => {
    const state: StageState = {
      status: 'active',
      progress: 0.5,
    }

    const { container } = render(<StageIndicator stage={mockStage} state={state} compact />)

    // Compact layout uses flex-col
    const compactContainer = container.querySelector('.flex-col')
    expect(compactContainer).toBeTruthy()

    // Should show label
    expect(screen.getByText('Music')).toBeTruthy()
  })

  it('should not show description in compact mode', () => {
    const state: StageState = {
      status: 'active',
      progress: 0.5,
    }

    render(<StageIndicator stage={mockStage} state={state} compact />)

    // Description should not be rendered in compact mode
    expect(screen.queryByText('Rendering instrumental tracks')).toBeNull()
  })

  it('should show progress bar only for active stages', () => {
    const states: Array<{ status: StageState['status']; shouldShowProgress: boolean }> = [
      { status: 'pending', shouldShowProgress: false },
      { status: 'active', shouldShowProgress: true },
      { status: 'complete', shouldShowProgress: false },
      { status: 'failed', shouldShowProgress: false },
    ]

    states.forEach(({ status, shouldShowProgress }) => {
      const state: StageState = {
        status,
        progress: 0.5,
      }

      const { unmount } = render(<StageIndicator stage={mockStage} state={state} />)

      if (shouldShowProgress) {
        expect(screen.queryByRole('progressbar')).toBeTruthy()
      } else {
        expect(screen.queryByRole('progressbar')).toBeNull()
      }

      unmount()
    })
  })

  it('should not show progress bar when progress is 0', () => {
    const state: StageState = {
      status: 'active',
      progress: 0,
    }

    render(<StageIndicator stage={mockStage} state={state} />)

    // Progress bar only shows when progress > 0
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
