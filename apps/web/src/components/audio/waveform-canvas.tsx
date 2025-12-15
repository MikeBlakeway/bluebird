'use client'

import { useEffect, useRef } from 'react'
import type { Peak } from '@/lib/peaks'

interface WaveformCanvasProps {
  peaks: Peak[]
  width?: number
  height?: number
  color?: string
  background?: string
}

export function WaveformCanvas({
  peaks,
  width = 600,
  height = 120,
  color = '#0ea5e9',
  background = 'transparent',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)

    if (!peaks.length) return

    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()

    const midY = height / 2
    const xScale = width / peaks.length
    const yScale = midY

    peaks.forEach((peak, index) => {
      const x = index * xScale
      const yMax = midY - peak.max * yScale
      const yMin = midY - peak.min * yScale

      ctx.moveTo(x, yMin)
      ctx.lineTo(x, yMax)
    })

    ctx.stroke()
  }, [background, color, height, peaks, width])

  return <canvas ref={canvasRef} aria-label="Waveform" />
}
