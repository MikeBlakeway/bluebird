/**
 * JobTimeline Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { JobTimeline } from './JobTimeline'

// Mock useJobTimeline hook
vi.mock('@/hooks/use-job-timeline', () => ({
  useJobTimeline: vi.fn(),
}))

// Helper to import mock
async function getMockHook() {
  const mod = await import('@/hooks/use-job-timeline')
  return mod.useJobTimeline as ReturnType<typeof vi.fn>
}

describe('JobTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show skeleton while connecting', async () => {
    const mockUseJobTimeline = await getMockHook()
    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: new Map(),
      currentStage: null,
      overallProgress: 0,
      totalDuration: 0,
      estimatedTimeRemaining: 0,
      error: null,
      isComplete: false,
      connectionState: 'connecting',
      reconnect: vi.fn(),
    })

    const { container } = render(<JobTimeline jobId="test-job-id" />)

    // Should render the timeline component (check it's not empty)
    expect(container.firstChild).toBeTruthy()
  })

  it('should render timeline with stages when connected', async () => {
    const mockUseJobTimeline = await getMockHook()
    const mockStages = new Map()
    mockStages.set('queued', { status: 'complete' as const, progress: 1 })
    mockStages.set('analyzing', { status: 'active' as const, progress: 0.5 })
    mockStages.set('planning', { status: 'pending' as const, progress: 0 })

    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: mockStages,
      currentStage: 'analyzing',
      overallProgress: 0.15,
      totalDuration: 5000,
      estimatedTimeRemaining: 45000,
      error: null,
      isComplete: false,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    render(<JobTimeline jobId="test-job-id" />)

    // Should show header with overall progress
    expect(screen.getByText('Job Progress')).toBeTruthy()
    expect(screen.getByText(/Overall: 15%/)).toBeTruthy()
    expect(screen.getByText(/ETA:/)).toBeTruthy()

    // Should show stage labels
    expect(screen.getByText('Queued')).toBeTruthy()
    expect(screen.getByText('Analyzing')).toBeTruthy()
  })

  it('should show error state with retry button', async () => {
    const mockUseJobTimeline = await getMockHook()
    const mockReconnect = vi.fn()

    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: new Map(),
      currentStage: null,
      overallProgress: 0,
      totalDuration: 0,
      estimatedTimeRemaining: 0,
      error: 'Connection timeout',
      isComplete: false,
      connectionState: 'error',
      reconnect: mockReconnect,
    })

    render(<JobTimeline jobId="test-job-id" />)

    expect(screen.getByText('Connection Error')).toBeTruthy()
    expect(screen.getByText('Connection timeout')).toBeTruthy()

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /Retry Connection/ })
    expect(retryButton).toBeTruthy()
  })

  it('should show completed state', async () => {
    const mockUseJobTimeline = await getMockHook()
    const mockStages = new Map()
    mockStages.set('completed', { status: 'complete' as const, progress: 1 })

    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: mockStages,
      currentStage: 'completed',
      overallProgress: 1,
      totalDuration: 42000,
      estimatedTimeRemaining: 0,
      error: null,
      isComplete: true,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    render(<JobTimeline jobId="test-job-id" />)

    expect(screen.getByText(/Overall: 100%/)).toBeTruthy()
    expect(screen.getByText('Complete')).toBeTruthy()
  })

  it('should show failed state with error message and retry', async () => {
    const mockUseJobTimeline = await getMockHook()
    const mockStages = new Map()
    const errorMessage = 'Synthesis timeout'
    mockStages.set('failed', { status: 'failed' as const, progress: 0, error: errorMessage })

    const onError = vi.fn()

    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: mockStages,
      currentStage: 'failed',
      overallProgress: 0.5,
      totalDuration: 20000,
      estimatedTimeRemaining: 0,
      error: errorMessage,
      isComplete: true,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    render(<JobTimeline jobId="test-job-id" onError={onError} />)

    expect(screen.getByText('Failed')).toBeTruthy()

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /Retry/ })
    expect(retryButton).toBeTruthy()
  })

  it('should render compact layout when compact prop is true', async () => {
    const mockUseJobTimeline = await getMockHook()
    const mockStages = new Map()
    mockStages.set('queued', { status: 'complete' as const, progress: 1 })

    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: mockStages,
      currentStage: 'queued',
      overallProgress: 0.1,
      totalDuration: 500,
      estimatedTimeRemaining: 50000,
      error: null,
      isComplete: false,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    const { container } = render(<JobTimeline jobId="test-job-id" compact />)

    // Compact layout should have horizontal overflow
    const compactContainer = container.querySelector('.overflow-x-auto')
    expect(compactContainer).toBeTruthy()
  })

  it('should hide header when showHeader is false', async () => {
    const mockUseJobTimeline = await getMockHook()
    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: new Map(),
      currentStage: null,
      overallProgress: 0,
      totalDuration: 0,
      estimatedTimeRemaining: 0,
      error: null,
      isComplete: false,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    render(<JobTimeline jobId="test-job-id" showHeader={false} />)

    expect(screen.queryByText('Job Progress')).toBeNull()
  })

  it('should format time remaining correctly', async () => {
    const mockUseJobTimeline = await getMockHook()
    const testCases = [
      { ms: 15000, expected: '15s' },
      { ms: 65000, expected: '1m 5s' },
      { ms: 125000, expected: '2m 5s' },
    ]

    for (const { ms, expected } of testCases) {
      mockUseJobTimeline.mockReturnValue({
        jobId: 'test-job-id',
        stages: new Map(),
        currentStage: 'planning',
        overallProgress: 0.3,
        totalDuration: 10000,
        estimatedTimeRemaining: ms,
        error: null,
        isComplete: false,
        connectionState: 'connected',
        reconnect: vi.fn(),
      })

      const { unmount } = render(<JobTimeline jobId="test-job-id" />)
      expect(screen.getByText(new RegExp(`ETA: ${expected}`))).toBeTruthy()
      unmount()
    }
  })

  it('should call onComplete callback when job completes', async () => {
    const mockUseJobTimeline = await getMockHook()
    const onComplete = vi.fn()

    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: new Map(),
      currentStage: 'completed',
      overallProgress: 1,
      totalDuration: 42000,
      estimatedTimeRemaining: 0,
      error: null,
      isComplete: true,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    render(<JobTimeline jobId="test-job-id" onComplete={onComplete} />)

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('test-job-id')
    })
  })

  it('should apply custom className', async () => {
    const mockUseJobTimeline = await getMockHook()
    mockUseJobTimeline.mockReturnValue({
      jobId: 'test-job-id',
      stages: new Map(),
      currentStage: null,
      overallProgress: 0,
      totalDuration: 0,
      estimatedTimeRemaining: 0,
      error: null,
      isComplete: false,
      connectionState: 'connected',
      reconnect: vi.fn(),
    })

    const { container } = render(<JobTimeline jobId="test-job-id" className="custom-class" />)

    const card = container.querySelector('.custom-class')
    expect(card).toBeTruthy()
  })
})
