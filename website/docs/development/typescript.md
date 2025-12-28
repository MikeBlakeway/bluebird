---
sidebar_position: 5
---

# TypeScript Configuration & Build

Complete guide to TypeScript setup, configuration, and best practices in the Bluebird monorepo using Project References for optimal incremental builds.

## Architecture Overview

The monorepo uses **TypeScript Project References** for:

- ✅ Incremental builds (only recompile changed projects and dependents)
- ✅ Proper dependency ordering (types → packages → apps)
- ✅ IDE support for cross-package navigation and refactoring
- ✅ Clear project boundaries and circular dependency prevention

### Folder Structure

```
bluebird/
├── tsconfig.json          # Root orchestrator (references all projects)
├── tsconfig.base.json     # Shared base config (inherited by all)
├── apps/
│   ├── api/               # Node.js Fastify backend (composite: true)
│   │   └── tsconfig.json
│   └── web/               # Next.js React frontend (composite: true)
│       └── tsconfig.json
└── packages/
    ├── config/            # Shared configuration exports
    ├── types/             # Zod DTO definitions (emitDeclarationOnly)
    ├── ui/                # React component library (emitDeclarationOnly)
    ├── client/            # API client wrapper (emitDeclarationOnly)
    ├── telemetry/         # OpenTelemetry setup (emitDeclarationOnly)
    └── test-helpers/      # Testing utilities (emitDeclarationOnly)
```

## Configuration Hierarchy

### Root Config (tsconfig.json)

**Purpose**: Orchestrates all projects in correct build order.

```json
{
  "compilerOptions": {
    "composite": false,
    "incremental": false
  },
  "references": [
    { "path": "packages/config" },
    { "path": "packages/types" },
    { "path": "packages/ui" },
    { "path": "packages/client" },
    { "path": "packages/telemetry" },
    { "path": "packages/test-helpers" },
    { "path": "apps/api" },
    { "path": "apps/web" }
  ]
}
```

**Key Settings**:

- `composite: false` — Root doesn't compile, only orchestrates
- `incremental: false` — No .tsbuildinfo for coordinator
- `references: [...]` — All dependent projects in build order

### Base Config (tsconfig.base.json)

**Purpose**: Shared defaults inherited by all projects.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "baseUrl": ".",
    "paths": {
      "@bluebird/*": ["packages/*/src", "apps/*/src"]
    },
    "module": "ES2020",
    "target": "ES2020",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true
  }
}
```

**Strict Mode Features**:

- `noImplicitAny` — All types must be explicit
- `strictNullChecks` — Null/undefined tracked precisely
- `noImplicitThis` — `this` must be typed
- `strictFunctionTypes` — Function parameter types must be assignable
- `noUnusedLocals` / `noUnusedParameters` — Catch dead code
- `exactOptionalPropertyTypes` — Optional properties can't be undefined
- `useUnknownInCatchVariables` — Catch bindings are `unknown`, not `any`

**Path Aliases**:

```typescript
// Instead of:
import { ArrangementSpec } from '../../packages/types/src'

// Use:
import { ArrangementSpec } from '@bluebird/types'
```

### App Configs (apps/api/tsconfig.json, apps/web/tsconfig.json)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "noEmit": false,
    "module": "ES2020",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/types" }, { "path": "../../packages/config" }]
}
```

**For Next.js** (`apps/web/tsconfig.json`):

- `noEmit: true` — Let Next.js handle compilation
- `jsx: "react-jsx"` — React 17+ auto-import
- `incremental: true` — Cache in `.next/`

### Package Configs (packages/\*/tsconfig.json)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"],
  "references": [{ "path": "../types" }]
}
```

**Key Decisions**:

- `composite: true` — Enables references from other projects
- `emitDeclarationOnly: true` — Only generate `.d.ts` files (no JS)
- `outDir: "dist"` — Output in dist/ folder
- `exclude` — Don't emit test files

## Building & Compilation

### Full Build

```bash
# Compile all projects in dependency order
pnpm run build

# Or use tsc -b directly (faster incremental)
tsc -b
```

**Output**:

```
dist/
├── .tsbuildinfo
├── index.js
├── index.d.ts
└── index.d.ts.map
```

### Incremental Build

```bash
# Build only changed projects + dependents
tsc -b

# With verbosity (see what's being compiled)
tsc -b --verbose

# Force full rebuild
tsc -b --force

# Clean build artifacts
tsc -b --clean
```

**Speed**:

- First build: ~5-10s (all projects)
- Incremental: ~1-2s (changed + dependents only)
- Clean + rebuild: 5-10s

### Single Project Build

```bash
# Build specific package
pnpm -F @bluebird/types run build
pnpm -F @bluebird/api run build

# Watch mode
pnpm -F @bluebird/web run dev:next
```

## Development Workflow

### Watch Mode

```bash
# Watch all projects (root level)
pnpm run dev

# Watch specific workspace
pnpm -F @bluebird/api run dev
pnpm -F @bluebird/web run dev:next
```

### Type Checking

```bash
# Check all projects without building
pnpm run typecheck

# Single project
pnpm -F @bluebird/types run typecheck
```

### IDE Support

**VS Code**:

- Automatically uses project references
- "Go to Definition" works across packages
- "Find All References" includes all dependents
- Rename refactoring is safe across boundaries

**IntelliJ / WebStorm**:

- Requires IDE restart after tsconfig changes
- Select "Sources" tab in run configuration

## Best Practices

### 1. Type Safety Rules

Always follow these patterns (§ 5.0 of copilot-instructions.md):

```typescript
// ❌ WRONG: Unsafe cast bypasses validation
const arrangement = take.plan as ArrangementSpec

// ✅ CORRECT: Runtime validation with Zod
const parseResult = ArrangementSpecSchema.safeParse(take.plan)
if (!parseResult.success) {
  throw new Error(`Invalid arrangement: ${parseResult.error.message}`)
}
const arrangement = parseResult.data
```

### 2. Project Reference Checks

Before building, verify:

- [ ] All referenced projects have `tsconfig.json`
- [ ] All projects have `composite: true`
- [ ] Library projects use `emitDeclarationOnly: true` or `noEmit: true`
- [ ] App projects have `composite: true` and `tsBuildInfoFile` set
- [ ] Path aliases match actual folder structure

### 3. Incremental Build Caching

Keep these in `.gitignore`:

```
dist/
.next/
*.tsbuildinfo
node_modules/.tsbuildinfo
```

### 4. Declaration Maps

Enable for IDE navigation:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

This enables "Go to Definition" to jump to `.ts` source files, not just `.d.ts`.

## Troubleshooting

### "Cannot find referenced project"

Check that all paths in `references` have valid `tsconfig.json`:

```bash
# List all referenced projects
cat tsconfig.json | grep -A 20 '"references"'
```

### "Property X not found in module Y"

Verify the package is in `references`:

```json
// In app that uses it:
"references": [
  { "path": "../../packages/types" }  // Add missing reference
]
```

### IDE not recognizing imports across packages

1. Ensure `composite: true` on both projects
2. Run `pnpm install` to link packages
3. Restart IDE

### ".tsbuildinfo generation is bugged"

Delete and rebuild:

```bash
find . -name "*.tsbuildinfo" -delete
tsc -b --force
```

### "noEmit conflicts with composite"

- Use `noEmit: true` only on apps that don't export (like Next.js)
- Use `emitDeclarationOnly: true` on libraries that export types
- Root config must have `composite: false`

## Performance Metrics

Build performance on recent hardware:

| Scenario             | Time  | Notes                       |
| -------------------- | ----- | --------------------------- |
| Clean build (all)    | 5-10s | First compile of everything |
| Incremental (1 file) | 1-2s  | Only changed + dependents   |
| Type check only      | 3-5s  | No code generation          |
| Single package       | ≤1s   | Isolated, cached            |

Cache invalidation triggers rebuild of dependents:

- Change in `packages/types` → rebuild all apps
- Change in `apps/api` → only rebuild api
- Change in test files → no rebuild needed (excluded)

---

**Next**: See § 5.0 (Type Safety) in copilot-instructions.md for runtime validation patterns.
