import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsForm } from './lyrics-form'

// React is used by JSX transpiler
void React

// Mock the client
vi.mock('@/hooks/use-client', () => ({
  useClient: () => ({
    planSong: vi.fn(async () => ({ jobId: 'job-123' })),
  }),
}))

describe('LyricsForm', () => {
  const mockProjectId = 'proj-123'
  const mockOnJobCreated = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(
      <LyricsForm projectId={mockProjectId} onJobCreated={mockOnJobCreated} onError={mockOnError} />
    )

    expect(screen.getByLabelText('Lyrics')).toBeDefined()
    expect(screen.getByText('Genre')).toBeDefined()
    expect(screen.getByText('AI Artist')).toBeDefined()
  })

  it('disables submit button when form is invalid', () => {
    const { container } = render(
      <LyricsForm projectId={mockProjectId} onJobCreated={mockOnJobCreated} onError={mockOnError} />
    )

    const button = container.querySelector('button[type="submit"]')
    expect(button?.getAttribute('disabled')).toBe('')
  })

  it('renders with proper structure', () => {
    const { container } = render(
      <LyricsForm projectId={mockProjectId} onJobCreated={mockOnJobCreated} onError={mockOnError} />
    )

    const form = container.querySelector('form')
    expect(form).toBeDefined()
    const button = form?.querySelector('button[type="submit"]')
    expect(button).toBeDefined()
  })
})
