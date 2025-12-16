# HeroUI Migration Summary

> Complete migration from shadcn/ui to HeroUI

---

## Migration Overview

**Date**: December 2024
**Branch**: `feature/heroui-migration`
**Reason**: shadcn/ui dropdowns had poor visual appearance; HeroUI provides better default styling and simpler API
**Status**: ✅ Complete

---

## What Changed

### Packages Removed

**Dependencies removed from `apps/web/package.json`:**

- `@bluebird/ui` (workspace package - deleted entirely)
- `@radix-ui/react-dialog`
- `@radix-ui/react-select`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `tailwindcss-animate`

**Workspace packages deleted:**

- `packages/ui/` (entire directory removed)

### Packages Added

**New dependencies in `apps/web/package.json`:**

- `@heroui/react@^2.8.6`
- `framer-motion@^12.23.26` (required peer dependency)

---

## Component API Mapping

### Button

**shadcn/ui:**

```tsx
import { Button } from '@bluebird/ui'
;<Button variant="ghost" size="icon" disabled={loading}>
  {loading && <Loader2 className="animate-spin" />}
  Submit
</Button>
```

**HeroUI:**

```tsx
import { Button } from '@heroui/react'
;<Button variant="light" isIconOnly isDisabled={loading} isLoading={loading}>
  Submit
</Button>
```

**Changes:**

- `variant="ghost"` → `variant="light"`
- `size="icon"` → `isIconOnly`
- `disabled` → `isDisabled`
- Built-in `isLoading` prop (no need for custom spinner)
- `asChild` prop removed; use `as={Link}` instead

### Select

**shadcn/ui:**

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@bluebird/ui'
;<Select value={genre} onValueChange={setGenre}>
  <SelectTrigger>
    <SelectValue placeholder="Select genre" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pop">Pop</SelectItem>
  </SelectContent>
</Select>
```

**HeroUI:**

```tsx
import { Select, SelectItem } from '@heroui/react'
;<Select
  label="Genre"
  placeholder="Select genre"
  variant="bordered"
  selectedKeys={genre ? [genre] : []}
  onSelectionChange={(keys) => setGenre(Array.from(keys)[0] as string)}
>
  <SelectItem key="pop" value="pop">
    Pop
  </SelectItem>
</Select>
```

**Changes:**

- No separate `SelectTrigger`, `SelectValue`, `SelectContent` components
- Built-in `label` prop
- `value` → `selectedKeys` (array)
- `onValueChange` → `onSelectionChange` (returns Set, convert to string)
- Built-in `variant` prop for styling

### Card

**shadcn/ui:**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@bluebird/ui'
;<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**HeroUI:**

```tsx
import { Card, CardHeader, CardBody } from '@heroui/react'
;<Card>
  <CardHeader>
    <h3 className="text-xl font-semibold">Title</h3>
  </CardHeader>
  <CardBody>
    <p className="text-default-500">Description</p>
    <p>Content</p>
  </CardBody>
</Card>
```

**Changes:**

- No separate `CardTitle`, `CardDescription` components
- `CardContent` → `CardBody`
- Use custom heading/paragraph elements for titles and descriptions

---

## Color Token Mapping

### Text Colors

| shadcn/ui               | NextUI             |
| ----------------------- | ------------------ |
| `text-muted-foreground` | `text-default-500` |
| `text-destructive`      | `text-danger`      |
| `text-green-600`        | `text-success`     |
| `text-foreground`       | (default text)     |

### Border Colors

| shadcn/ui            | NextUI           |
| -------------------- | ---------------- |
| `border-destructive` | `border-danger`  |
| `border-muted`       | `border-default` |
| `border-input`       | `border-default` |

### Background Colors

| shadcn/ui      | NextUI           |
| -------------- | ---------------- |
| `bg-muted`     | `bg-default-100` |
| `bg-secondary` | `bg-default-200` |
| `bg-accent`    | `bg-default-100` |

---

## Configuration Changes

### Tailwind Config (`apps/web/tailwind.config.ts`)

**Before:**

```ts
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', '../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* 60+ shadcn color tokens */
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
```

**After:**

```ts
import { heroui } from '@heroui/react'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [heroui()],
}
```

### Global CSS (`apps/web/src/app/globals.css`)

**Before:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 60+ CSS variables for shadcn theming */
  }
}
```

**After:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Next.js Config (`apps/web/next.config.ts`)

**Before:**

```ts
transpilePackages: ['@bluebird/ui']
```

**After:**

```ts
transpilePackages: ['@heroui/react', '@heroui/theme']
```

### TypeScript Config (`apps/web/tsconfig.json`)

**Before:**

```json
"references": [
  { "path": "../../packages/types" },
  { "path": "../../packages/ui" },
  { "path": "../../packages/client" }
]
```

**After:**

```json
"references": [
  { "path": "../../packages/types" },
  { "path": "../../packages/client" }
]
```

---

## Files Modified

### Components Migrated

1. **`apps/web/src/components/theme-toggle.tsx`**
   - Changed: Button from shadcn to NextUI
   - API: `variant="ghost" size="icon"` → `isIconOnly variant="light"`

2. **`apps/web/src/components/lyrics/generate-button.tsx`**
   - Changed: Button with loading state
   - API: Custom Loader2 spinner → built-in `isLoading` prop
   - API: `disabled` → `isDisabled`

3. **`apps/web/src/components/lyrics/genre-select.tsx`**
   - Changed: Select dropdown for genre
   - API: `value` → `selectedKeys`, `onValueChange` → `onSelectionChange`
   - Removed: SelectTrigger, SelectValue, SelectContent wrappers

4. **`apps/web/src/components/lyrics/artist-select.tsx`**
   - Changed: Select dropdown for AI artist
   - Same pattern as genre-select

5. **`apps/web/src/components/lyrics/lyrics-input.tsx`**
   - Changed: Color tokens only
   - Mapping: `text-muted-foreground` → `text-default-500`, etc.

6. **`apps/web/src/app/page.tsx`**
   - Changed: Card components on homepage
   - API: CardTitle/CardDescription → custom heading/paragraph elements
   - API: CardContent → CardBody
   - API: Button `asChild` → `as={Link}`

### Root Layout Updated

**`apps/web/src/app/layout.tsx`:**

- Added `HeroUIProvider` wrapper around `ThemeProvider`
- Updated footer text color to `text-default-500`

### Tests Updated

**`apps/web/src/components/lyrics/lyrics-form.test.tsx`:**

- Fixed: `getByText('Genre')` → `getAllByText('Genre').length).toBeGreaterThan(0)`
- Reason: HeroUI Select renders label in multiple DOM locations

---

## Quality Gates Passed

### TypeScript Check

```bash
✅ pnpm typecheck
All 7 workspace packages pass with 0 errors
```

### Build

```bash
✅ pnpm build (apps/web)
Production build successful
Routes: / (425 KB), /studio/new (240 KB), dynamic routes (102 KB)
```

### Tests

```bash
✅ pnpm test (apps/web)
Test Files: 6 passed (6)
Tests: 67 passed | 1 skipped (68)
```

### Linting

```bash
✅ ESLint passes (1 Prettier warning auto-fixed)
```

---

## Known Issues & Notes

### Tailwind CSS Version

HeroUI v2 officially requires Tailwind CSS v4, but v4 is not yet fully compatible with Next.js 15. We're using Tailwind CSS v3.4.19 which works correctly despite the peer dependency warning.

**Status**: Production build successful with Tailwind v3. Will migrate to Tailwind v4 when Next.js compatibility is resolved.

### API Differences Summary

1. **Button**: Built-in loading state vs. custom spinner
2. **Select**: Returns `Set` instead of string (requires conversion)
3. **Card**: No built-in Title/Description components
4. **All Components**: Boolean props use `is` prefix (`isDisabled`, `isLoading`, etc.)

### Test Adjustments

HeroUI Select component renders labels in multiple DOM locations (for accessibility):

- Main `<label>` element
- Hidden `<select>` element with duplicate label text

Tests must use `getAllByText()` instead of `getByText()` for Select labels.

---

## Migration Checklist

- ✅ Phase 1: Setup & Dependencies
  - ✅ Install HeroUI + framer-motion
  - ✅ Update Tailwind config (remove shadcn plugin, add heroui)
  - ✅ Clean globals.css (remove CSS variables)
  - ✅ Update next.config.ts (transpile HeroUI packages)

- ✅ Phase 2: Component Migration
  - ✅ Migrate ThemeToggle
  - ✅ Migrate GenerateButton
  - ✅ Migrate GenreSelect
  - ✅ Migrate ArtistSelect
  - ✅ Migrate LyricsInput (color tokens)
  - ✅ Migrate Homepage (Card components)
  - ✅ Update root layout with HeroUIProvider

- ✅ Phase 3: Cleanup & Removal
  - ✅ Delete `packages/ui` directory
  - ✅ Remove `@bluebird/ui` from package.json
  - ✅ Remove shadcn dependencies (Radix UI, CVA, tailwindcss-animate)
  - ✅ Delete `components.json`
  - ✅ Delete empty `src/components/ui/` directory
  - ✅ Update tsconfig.json references
  - ✅ Run `pnpm install` to clean lockfile

- ✅ Phase 4: Testing & Validation
  - ✅ TypeScript check (0 errors)
  - ✅ Production build (successful)
  - ✅ Unit tests (67 passing)
  - ✅ ESLint (0 errors)
  - ✅ Prettier (auto-fixed)
  - ✅ Update test assertions for HeroUI DOM structure

---

## Next Steps

1. **Visual Testing**: Start dev server and verify all components look correct
2. **Accessibility Audit**: Ensure keyboard navigation, ARIA labels work properly
3. **Documentation**: Update component usage docs if needed
4. **Merge Strategy**: Decide whether to merge to `develop` or keep on migration branch

---

## References

- **HeroUI Docs**: https://www.heroui.com/docs
- **Next.js Setup Guide**: https://www.heroui.com/docs/frameworks/nextjs
- **Component API**: https://www.heroui.com/docs/components/button
- **Tailwind Plugin**: https://www.heroui.com/docs/customization/customize-theme
- **GitHub**: https://github.com/heroui-inc/heroui

---

## Status

Migration complete and validated. All quality gates passed. Ready for visual testing and merge decision.
