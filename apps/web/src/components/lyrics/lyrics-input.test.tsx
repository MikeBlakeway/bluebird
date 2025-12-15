import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsInput } from './lyrics-input'

// React is used by JSX transpiler
void React

describe('LyricsInput', () => {
  it('renders textarea with placeholder', () => {
    const onChange = vi.fn()
    render(<LyricsInput value="" onChange={onChange} />)

    expect(screen.getByPlaceholderText(/Paste or type/)).toBeDefined()
  })

  it('renders label', () => {
    const onChange = vi.fn()
    render(<LyricsInput value="" onChange={onChange} />)

    expect(screen.getByLabelText('Lyrics')).toBeDefined()
  })

  it('disables textarea when disabled prop is true', () => {
    const onChange = vi.fn()
    const { container } = render(<LyricsInput value="" onChange={onChange} disabled={true} />)

    const textarea = container.querySelector('textarea')
    expect(textarea?.disabled).toBe(true)
  })

  it('renders with a value', () => {
    const onChange = vi.fn()
    const { container } = render(<LyricsInput value="Test lyrics" onChange={onChange} />)

    const textarea = container.querySelector('textarea')
    expect(textarea?.value).toBe('Test lyrics')
  })
})
