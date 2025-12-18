/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ShortcutsPanel } from './ShortcutsPanel'

describe('ShortcutsPanel', () => {
  it('should render ShortcutsPanel component', () => {
    const { container } = render(<ShortcutsPanel isOpen={false} onClose={vi.fn()} />)
    expect(container).toBeTruthy()
  })

  it('should accept isOpen and onClose props', () => {
    const onClose = vi.fn()
    const { rerender } = render(<ShortcutsPanel isOpen={false} onClose={onClose} />)

    // Should not throw errors
    rerender(<ShortcutsPanel isOpen={true} onClose={onClose} />)
    rerender(<ShortcutsPanel isOpen={false} onClose={onClose} />)

    expect(true).toBe(true)
  })
})
