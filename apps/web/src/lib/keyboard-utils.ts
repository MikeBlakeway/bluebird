/**
 * Keyboard Utility Functions
 *
 * Helper functions for keyboard event handling and focus detection.
 */

/**
 * Determines if the currently focused element is a text entry field.
 *
 * This is used to prevent keyboard shortcuts from triggering while the user
 * is typing in an input, textarea, or other text entry field.
 *
 * @returns true if the active element is a text entry field
 */
export function isTextEntryActiveElement(): boolean {
  const el = document.activeElement
  if (!el) return false

  if (el instanceof HTMLInputElement) return true
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLSelectElement) return true

  if (el instanceof HTMLElement && el.isContentEditable) return true

  if (el instanceof HTMLElement) {
    const role = el.getAttribute('role')
    if (role === 'textbox') return true
  }

  return false
}
