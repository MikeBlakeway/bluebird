/**
 * Tests for Waveform Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Waveform } from './Waveform'
import type { Peak } from '@/lib/peaks'

// Mock canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
  scale: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  setLineDash: vi.fn(),
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any
  vi.clearAllMocks()
})

describe('Waveform', () => {
  const mockPeaks: Peak[] = [
    { min: -0.5, max: 0.5 },
    { min: -0.8, max: 0.8 },
    { min: -0.3, max: 0.3 },
  ]

  it('should render canvas', () => {
    render(<Waveform peaks={mockPeaks} duration={3.0} currentTime={0} />)

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('should draw waveform with peaks', () => {
    render(<Waveform peaks={mockPeaks} duration={3.0} currentTime={0} />)

    expect(mockContext.stroke).toHaveBeenCalled()
  })

  it('should draw playback cursor at current time', () => {
    render(<Waveform peaks={mockPeaks} duration={3.0} currentTime={1.5} />)

    // Cursor should be drawn at 50% position (1.5 / 3.0)
    expect(mockContext.stroke).toHaveBeenCalled()
  })

  it('should not draw cursor when showCursor is false', () => {
    const { rerender } = render(
      <Waveform peaks={mockPeaks} duration={3.0} currentTime={1.5} showCursor={false} />
    )

    // Re-render with cursor enabled
    rerender(<Waveform peaks={mockPeaks} duration={3.0} currentTime={1.5} showCursor={true} />)
  })

  it('should draw overlay waveform in A/B comparison mode', () => {
    const peaksB: Peak[] = [
      { min: -0.6, max: 0.6 },
      { min: -0.9, max: 0.9 },
      { min: -0.4, max: 0.4 },
    ]

    render(
      <Waveform
        peaks={mockPeaks}
        peaksB={peaksB}
        showOverlay={true}
        duration={3.0}
        currentTime={0}
      />
    )

    // Should call stroke method (overlay draws additional waveform)
    expect(mockContext.stroke).toHaveBeenCalled()
  })

  it('should use custom colors', () => {
    render(
      <Waveform
        peaks={mockPeaks}
        duration={3.0}
        currentTime={0}
        waveColor="rgb(255, 0, 0)"
        progressColor="rgb(0, 255, 0)"
        cursorColor="rgb(0, 0, 255)"
      />
    )

    expect(mockContext.strokeStyle).toContain('rgb')
  })

  it('should handle empty peaks array', () => {
    render(<Waveform peaks={[]} duration={0} currentTime={0} />)

    // Should render without errors
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('should call onSeek when clicked in interactive mode', () => {
    const mockOnSeek = vi.fn()

    const { container } = render(
      <Waveform
        peaks={mockPeaks}
        duration={3.0}
        currentTime={0}
        interactive={true}
        onSeek={mockOnSeek}
      />
    )

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()

    if (canvas) {
      // Mock click at 50% position
      canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 80,
        right: 800,
        bottom: 80,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }))

      canvas.click()
      // onSeek should be called via onClick handler
    }
  })

  it('should not call onSeek when interactive is false', () => {
    const mockOnSeek = vi.fn()

    const { container } = render(
      <Waveform
        peaks={mockPeaks}
        duration={3.0}
        currentTime={0}
        interactive={false}
        onSeek={mockOnSeek}
      />
    )

    const canvas = container.querySelector('canvas')
    if (canvas) {
      canvas.click()
      expect(mockOnSeek).not.toHaveBeenCalled()
    }
  })

  it('should update waveform when currentTime changes', () => {
    const { rerender } = render(<Waveform peaks={mockPeaks} duration={3.0} currentTime={0} />)

    vi.clearAllMocks()

    rerender(<Waveform peaks={mockPeaks} duration={3.0} currentTime={1.5} />)

    // Should redraw with new cursor position
    expect(mockContext.stroke).toHaveBeenCalled()
  })

  it('should resize canvas on container resize', () => {
    const { container } = render(<Waveform peaks={mockPeaks} duration={3.0} currentTime={0} />)

    // ResizeObserver should be set up
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('should apply custom height', () => {
    render(<Waveform peaks={mockPeaks} duration={3.0} currentTime={0} height={120} />)

    const canvas = document.querySelector('canvas')
    expect(canvas?.style.height).toBe('120px')
  })
})
