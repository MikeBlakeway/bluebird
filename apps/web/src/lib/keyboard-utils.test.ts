/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import { isTextEntryActiveElement } from './keyboard-utils'

describe('keyboard-utils', () => {
  describe('isTextEntryActiveElement', () => {
    it('should return false when no element is focused', () => {
      document.body.focus()
      expect(isTextEntryActiveElement()).toBe(false)
    })

    it('should return true when an input element is focused', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      expect(isTextEntryActiveElement()).toBe(true)

      document.body.removeChild(input)
    })

    it('should return true for different input types', () => {
      const types = ['text', 'email', 'password', 'search', 'tel', 'url']

      types.forEach((type) => {
        const input = document.createElement('input')
        input.type = type
        document.body.appendChild(input)
        input.focus()

        expect(isTextEntryActiveElement()).toBe(true)

        document.body.removeChild(input)
      })
    })

    it('should return true when a textarea element is focused', () => {
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      expect(isTextEntryActiveElement()).toBe(true)

      document.body.removeChild(textarea)
    })

    it('should return true when a select element is focused', () => {
      const select = document.createElement('select')
      document.body.appendChild(select)
      select.focus()

      expect(isTextEntryActiveElement()).toBe(true)

      document.body.removeChild(select)
    })

    it.skip('should return true when a contentEditable element is focused', () => {
      // Skip: jsdom doesn't fully support contentEditable focus behavior
      const div = document.createElement('div')
      div.contentEditable = 'true'
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      expect(isTextEntryActiveElement()).toBe(true)

      document.body.removeChild(div)
    })

    it('should return true when an element with role="textbox" is focused', () => {
      const div = document.createElement('div')
      div.setAttribute('role', 'textbox')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      expect(isTextEntryActiveElement()).toBe(true)

      document.body.removeChild(div)
    })

    it('should return false when a button is focused', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      expect(isTextEntryActiveElement()).toBe(false)

      document.body.removeChild(button)
    })

    it('should return false when a regular div is focused', () => {
      const div = document.createElement('div')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      expect(isTextEntryActiveElement()).toBe(false)

      document.body.removeChild(div)
    })

    it('should return false when an element with other role is focused', () => {
      const div = document.createElement('div')
      div.setAttribute('role', 'navigation')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      expect(isTextEntryActiveElement()).toBe(false)

      document.body.removeChild(div)
    })
  })
})
