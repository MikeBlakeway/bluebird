# Task 2.9: Section-Level Lock/Unlock - Implementation Plan

## Overview

Implement section-level lock/unlock functionality to control which sections can be regenerated. Locked sections are preserved during regeneration operations, while unlocked sections can be freely regenerated. This is a prerequisite for Task 2.10 (Per-Section Regeneration).

---

## Requirements (from SPRINT_2_TASKS.md)

**Acceptance Criteria:**

- [x] Lock icon on each section in UI
- [x] Click to toggle lock state
- [x] Visual indicator (locked sections grayed out)
- [x] Persist lock state in browser (localStorage)
- [x] Locked sections excluded from regeneration
- [x] Keyboard shortcut: `L` to lock/unlock focused section
- [x] Accessible (screen reader announces lock state)

**Estimate:** 2-3 hours

---

## Component Architecture

### 1. `useSectionLock.ts` - State Management Hook

**Responsibilities:**

- Manage lock state for all sections in a take
- Persist state to localStorage
- Provide toggle and query functions
- Handle bulk operations (lock all, unlock all)

**API:**

```typescript
interface UseSectionLockOptions {
  takeId: string
  sectionCount: number
}

interface UseSectionLockReturn {
  lockedSections: Set<number>
  isLocked: (sectionIdx: number) => boolean
  toggleLock: (sectionIdx: number) => void
  lockSection: (sectionIdx: number) => void
  unlockSection: (sectionIdx: number) => void
  lockAll: () => void
  unlockAll: () => void
}

function useSectionLock(options: UseSectionLockOptions): UseSectionLockReturn
```

**LocalStorage Schema:**

```typescript
// Key: `bluebird:section-locks:${takeId}`
// Value: number[] (array of locked section indices)
{
  "bluebird:section-locks:take_abc123": [0, 2, 4]
}
```

**Implementation Details:**

- Use `useState` with Set<number> for O(1) lookups
- Load initial state from localStorage on mount
- Save to localStorage on every state change
- Clear localStorage when take is deleted (future enhancement)
- Handle localStorage quota exceeded gracefully

---

### 2. `LockToggle.tsx` - Lock Button Component

**Responsibilities:**

- Render lock/unlock icon button
- Toggle lock state on click
- Show visual feedback (locked/unlocked state)
- Provide tooltip for accessibility

**Props:**

```typescript
interface LockToggleProps {
  sectionIdx: number
  isLocked: boolean
  onToggle: (sectionIdx: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  'aria-label'?: string
}
```

**Visual States:**

- **Unlocked**: `<Unlock className="text-default-400" />` with tooltip "Lock section"
- **Locked**: `<Lock className="text-warning-500" />` with tooltip "Unlock section"
- **Disabled**: Grayed out, no interaction

**HeroUI Components:**

- `Button` with `isIconOnly`, `variant="light"`
- `Tooltip` for hover hint

---

### 3. `SectionCard.tsx` - Section Display Component

**Responsibilities:**

- Display section metadata (name, duration, status)
- Integrate `LockToggle` component
- Apply visual styling based on lock state
- Show regeneration controls (disabled if locked)
- Keyboard navigation support

**Props:**

```typescript
interface SectionCardProps {
  sectionIdx: number
  section: ArrangementSection // from @bluebird/types
  isLocked: boolean
  onToggleLock: (sectionIdx: number) => void
  onRegenerate?: (sectionIdx: number) => void
  isRegenerating?: boolean
  canRegenerate?: boolean
}
```

**Visual Design:**

```
┌─────────────────────────────────────────┐
│ Section 1: Intro                    🔓  │  ← LockToggle
│ Duration: 0:15 · BPM: 120               │
│ [🎵 Music] [🎤 Vocals]                  │
│ [↻ Regenerate]                          │  ← Disabled if locked
└─────────────────────────────────────────┘

Locked state (grayed):
┌─────────────────────────────────────────┐
│ Section 2: Verse 1                  🔒  │
│ Duration: 0:30 · BPM: 120               │
│ [🎵 Music] [🎤 Vocals]                  │
│ [↻ Regenerate] (disabled)               │
└─────────────────────────────────────────┘
```

**Styling (locked state):**

- `opacity-50` - Reduced opacity
- `cursor-not-allowed` - Show disabled cursor
- Regenerate button disabled
- Card border color changes to `default-200`

---

### 4. Keyboard Shortcut Integration

**Hook:** `useKeyboardShortcuts.ts` (shared with Task 2.13)

**Shortcut:** `L` key to toggle lock on focused section

**Implementation:**

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Don't trigger if typing in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault()
      const focusedSectionIdx = getFocusedSectionIndex()
      if (focusedSectionIdx !== null) {
        toggleLock(focusedSectionIdx)
      }
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [toggleLock])
```

**Focus Management:**

- Sections track focus via `tabIndex`
- Focus indicator shown via `focus:ring-2 ring-primary`
- Arrow keys navigate between sections (future enhancement)

---

## State Flow

### Initial Load

```
Component Mount
  ↓
useSectionLock hook reads localStorage
  ↓
Load locked sections for takeId
  ↓
Initialize Set<number> with locked indices
  ↓
Render sections with lock state
```

### Toggle Lock

```
User clicks LockToggle
  ↓
onToggle(sectionIdx) called
  ↓
Hook updates Set (add/remove)
  ↓
Save to localStorage
  ↓
Component re-renders with new state
  ↓
Visual feedback (icon changes)
```

### Regeneration Check (Task 2.10 integration)

```
User clicks Regenerate
  ↓
Check if section is locked
  ↓
If locked: Show toast "Section is locked"
  ↓
If unlocked: Proceed with API call
```

---

## Testing Strategy

### Unit Tests: `use-section-lock.test.ts`

**Test Cases:**

1. Initializes with empty locked sections
2. Loads locked sections from localStorage on mount
3. toggleLock adds section to Set
4. toggleLock removes section from Set
5. isLocked returns correct boolean
6. lockAll locks all sections
7. unlockAll clears all locks
8. Persists to localStorage after each change
9. Handles localStorage quota exceeded gracefully
10. Different takeIds have independent lock states

**Mock localStorage:**

```typescript
const mockStorage: Record<string, string> = {}

global.localStorage = {
  getItem: vi.fn((key) => mockStorage[key] || null),
  setItem: vi.fn((key, value) => {
    mockStorage[key] = value
  }),
  removeItem: vi.fn((key) => {
    delete mockStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  }),
  length: Object.keys(mockStorage).length,
  key: vi.fn((index) => Object.keys(mockStorage)[index] || null),
}
```

---

### Component Tests: `LockToggle.test.tsx`

**Test Cases:**

1. Renders unlock icon when not locked
2. Renders lock icon when locked
3. Calls onToggle with sectionIdx on click
4. Shows correct tooltip on hover
5. Disabled state prevents interaction
6. Size prop changes button size
7. Custom aria-label is applied

---

### Component Tests: `SectionCard.test.tsx`

**Test Cases:**

1. Renders section metadata correctly
2. Shows LockToggle component
3. Applies opacity-50 when locked
4. Disables regenerate button when locked
5. Calls onToggleLock when LockToggle clicked
6. Shows regenerating state (spinner)
7. Keyboard focus works (tabIndex)
8. Accessible (ARIA labels)

---

## Integration Points

### Task 2.10 Integration (Per-Section Regeneration)

```typescript
// In RegenButton.tsx
function RegenButton({ sectionIdx }: { sectionIdx: number }) {
  const { isLocked } = useSectionLock({ takeId, sectionCount })
  const handleRegen = () => {
    if (isLocked(sectionIdx)) {
      toast.error('Cannot regenerate locked section')
      return
    }
    // Proceed with regeneration
    client.renderSection({ takeId, sectionIdx })
  }

  return (
    <Button
      onClick={handleRegen}
      disabled={isLocked(sectionIdx)}
    >
      Regenerate
    </Button>
  )
}
```

### Task 2.11 Integration (A/B Comparison)

- A/B comparison works independently of lock state
- Users can compare locked vs unlocked sections
- Lock prevents new regeneration, not playback

---

## Accessibility

**ARIA Attributes:**

```tsx
<Button
  aria-label={isLocked ? 'Unlock section' : 'Lock section'}
  aria-pressed={isLocked}
  role="switch"
>
  {isLocked ? <Lock /> : <Unlock />}
</Button>

<Card
  aria-label={`Section ${sectionIdx + 1}: ${section.name}`}
  aria-readonly={isLocked}
  tabIndex={0}
>
  {/* Section content */}
</Card>
```

**Screen Reader Announcements:**

- "Section 1 locked" when toggling to locked
- "Section 1 unlocked" when toggling to unlocked
- "Regenerate button disabled, section is locked" on focus

---

## File Structure

```
apps/web/src/
├── hooks/
│   └── use-section-lock.ts          (94 lines)
│   └── use-section-lock.test.ts     (150 lines, 10 tests)
├── components/
│   ├── LockToggle.tsx                (65 lines)
│   ├── LockToggle.test.tsx           (85 lines, 7 tests)
│   ├── SectionCard.tsx               (125 lines)
│   └── SectionCard.test.tsx          (110 lines, 8 tests)
```

**Total Estimate:**

- Hook implementation: 30 min
- Hook tests: 30 min
- LockToggle component: 20 min
- LockToggle tests: 20 min
- SectionCard component: 45 min
- SectionCard tests: 30 min
- Documentation: 15 min
- **Total: ~3 hours**

---

## Implementation Order

1. **Create `use-section-lock.ts` hook** (30 min)
   - State management with Set<number>
   - localStorage persistence
   - Toggle and query functions

2. **Create hook tests** (30 min)
   - Mock localStorage
   - Test all public methods
   - Test persistence behavior

3. **Create `LockToggle.tsx` component** (20 min)
   - Icon button with HeroUI
   - Tooltip for accessibility
   - Click handler

4. **Create LockToggle tests** (20 min)
   - Render states
   - Click behavior
   - Accessibility

5. **Create `SectionCard.tsx` component** (45 min)
   - Layout with section metadata
   - Integrate LockToggle
   - Visual locked state
   - Keyboard navigation

6. **Create SectionCard tests** (30 min)
   - Render variations
   - Lock state styling
   - Interaction tests

7. **Run quality gates** (15 min)
   - TypeScript check
   - ESLint check
   - All tests passing

---

## Dependencies

**Existing:**

- `@bluebird/types` - ArrangementSection type
- `@heroui/react` - Button, Tooltip, Card
- `lucide-react` - Lock, Unlock icons
- `vitest` - Testing framework
- `@testing-library/react` - Component testing

**New:**

- None (all dependencies already in project)

---

## Future Enhancements (Not in Sprint 2)

- Persist lock state to backend (API endpoint)
- Bulk lock/unlock UI controls
- Lock templates (e.g., "Lock all choruses")
- Lock expiration (auto-unlock after N days)
- Undo/redo for lock changes
- Lock reason annotation ("Don't change, perfect!")

---

## Status

- [ ] Implementation pending approval
