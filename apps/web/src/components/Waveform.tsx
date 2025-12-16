/**
 * Waveform Visualization Component
 *
 * Renders audio waveform using extracted peaks from the audio engine.
 * Supports interactive scrubbing, playback position indicator, and A/B version comparison overlay.
 */

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Peak } from '@/lib/peaks'

export interface WaveformProps {
  peaks: Peak[]
  duration: number
  currentTime: number
  className?: string
  height?: number
  waveColor?: string
  progressColor?: string
  backgroundColor?: string
  cursorColor?: string
  onSeek?: (time: number) => void
  interactive?: boolean
  showCursor?: boolean
  // A/B comparison mode
  peaksB?: Peak[]
  overlayColor?: string
  showOverlay?: boolean
}

export function Waveform({
  peaks,
  duration,
  currentTime,
  className = '',
  height = 80,
  waveColor = 'rgb(59, 130, 246)', // blue-500
  progressColor = 'rgb(37, 99, 235)', // blue-600
  backgroundColor = 'rgb(17, 24, 39)', // gray-900
  cursorColor = 'rgb(239, 68, 68)', // red-500
  overlayColor = 'rgba(147, 51, 234, 0.3)', // purple-600 with opacity
  onSeek,
  interactive = true,
  showCursor = true,
  peaksB,
  showOverlay = false,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(800)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverX, setHoverX] = useState(0)

  // Update canvas width on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      const width = container.clientWidth
      setCanvasWidth(width)
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || peaks.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvasWidth
    const displayHeight = height

    // Set canvas size accounting for device pixel ratio
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    // Scale context for device pixel ratio
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    const centerY = displayHeight / 2
    const maxAmplitude = displayHeight / 2 - 2 // Leave 2px padding

    // Draw waveform peaks
    const peaksPerPixel = peaks.length / displayWidth
    ctx.lineWidth = 1

    for (let x = 0; x < displayWidth; x++) {
      const peakIndex = Math.floor(x * peaksPerPixel)
      const peak = peaks[peakIndex]
      if (!peak) continue

      const normalizedMin = peak.min * maxAmplitude
      const normalizedMax = peak.max * maxAmplitude

      const progressRatio = currentTime / duration
      const progressX = progressRatio * displayWidth

      // Use different colors for played vs unplayed regions
      ctx.strokeStyle = x < progressX ? progressColor : waveColor

      ctx.beginPath()
      ctx.moveTo(x, centerY + normalizedMin)
      ctx.lineTo(x, centerY + normalizedMax)
      ctx.stroke()
    }

    // Draw overlay waveform (version B in A/B comparison)
    if (showOverlay && peaksB && peaksB.length > 0) {
      ctx.globalAlpha = 0.5
      const peaksBPerPixel = peaksB.length / displayWidth

      for (let x = 0; x < displayWidth; x++) {
        const peakIndex = Math.floor(x * peaksBPerPixel)
        const peak = peaksB[peakIndex]
        if (!peak) continue

        const normalizedMin = peak.min * maxAmplitude
        const normalizedMax = peak.max * maxAmplitude

        ctx.strokeStyle = overlayColor

        ctx.beginPath()
        ctx.moveTo(x, centerY + normalizedMin)
        ctx.lineTo(x, centerY + normalizedMax)
        ctx.stroke()
      }

      ctx.globalAlpha = 1.0
    }

    // Draw playback cursor
    if (showCursor) {
      const progressRatio = currentTime / duration
      const cursorX = progressRatio * displayWidth

      ctx.strokeStyle = cursorColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cursorX, 0)
      ctx.lineTo(cursorX, displayHeight)
      ctx.stroke()
    }

    // Draw hover cursor (if interactive and hovering)
    if (interactive && isHovering) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(hoverX, 0)
      ctx.lineTo(hoverX, displayHeight)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [
    peaks,
    peaksB,
    currentTime,
    duration,
    canvasWidth,
    height,
    waveColor,
    progressColor,
    backgroundColor,
    cursorColor,
    overlayColor,
    showCursor,
    showOverlay,
    isHovering,
    hoverX,
    interactive,
  ])

  // Handle click to seek
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || !onSeek || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = x / rect.width
      const seekTime = ratio * duration

      onSeek(seekTime)
    },
    [interactive, onSeek, duration]
  )

  // Handle hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    setHoverX(x)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={interactive ? 'cursor-pointer' : 'cursor-default'}
        style={{ display: 'block' }}
      />
      {interactive && isHovering && (
        <div
          className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded pointer-events-none"
          style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}
        >
          {formatTime((hoverX / canvasWidth) * duration)}
        </div>
      )}
    </div>
  )
}

/**
 * Format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
