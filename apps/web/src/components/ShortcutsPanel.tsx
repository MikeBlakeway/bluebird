/**
 * ShortcutsPanel Component
 *
 * Displays a modal with keyboard shortcut documentation.
 * Triggered by pressing '?' key in the studio editor.
 */

'use client'

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'

interface ShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string
  action: string
  context: string
}

const shortcuts: Shortcut[] = [
  { keys: 'Space', action: 'Play/Pause', context: 'Global' },
  { keys: 'L', action: 'Lock/Unlock Section', context: 'Focused section' },
  { keys: 'R', action: 'Regenerate Section', context: 'Focused section (unlocked)' },
  { keys: 'A', action: 'Switch to Version A', context: 'Focused section' },
  { keys: 'B', action: 'Switch to Version B', context: 'Focused section' },
  { keys: '↑', action: 'Navigate to Previous Section', context: 'Global' },
  { keys: '↓', action: 'Navigate to Next Section', context: 'Global' },
  { keys: 'Esc', action: 'Cancel Active Job', context: 'During job (future)' },
  { keys: '?', action: 'Show This Panel', context: 'Global' },
]

export function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <p className="text-sm font-normal text-muted-foreground">
            Use these shortcuts to speed up your workflow
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  <th className="px-4 py-2 text-left text-sm font-semibold">Shortcut</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Context</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((shortcut, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-divider last:border-b-0 hover:bg-content2/50"
                  >
                    <td className="px-4 py-3">
                      <kbd className="rounded border border-divider bg-content2 px-2 py-1 text-xs font-mono font-semibold shadow-sm">
                        {shortcut.keys}
                      </kbd>
                    </td>
                    <td className="px-4 py-3 text-sm">{shortcut.action}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{shortcut.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-content2 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Shortcuts are disabled when typing in text fields. The "focused
              section" is indicated by the highlighted card border.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
