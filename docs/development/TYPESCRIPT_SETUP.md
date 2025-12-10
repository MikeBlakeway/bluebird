# TypeScript Build & Development Guide

## Project Architecture

This monorepo uses **Project References** for optimized incremental builds and proper dependency management.

### Structure

```bash
bluebird/
├── tsconfig.json          # Root orchestrator (references all projects)
├── tsconfig.base.json     # Shared base config (inherited by all)
├── apps/
│   ├── api/               # Node.js Fastify backend
│   └── web/               # Next.js React frontend
└── packages/
    ├── config/            # Shared configuration exports
    ├── types/             # Zod DTO definitions (declaration-only)
    ├── ui/                # React component library
    ├── client/            # API client stub
    ├── telemetry/         # OpenTelemetry setup
    └── test-helpers/      # Testing utilities
```

## Building

### Full Build (all projects)

```bash
# Compile all projects in dependency order
pnpm run build

# Or using tsc --build (faster incremental)
pnpm -F . run tsc:build
```

### Single Project Build

```bash
# Build specific package
pnpm -F @bluebird/types run build
pnpm -F @bluebird/api run build
pnpm -F @bluebird/web run build
```

### Incremental Build (tsc -b)

```bash
# Builds only what's changed (uses .tsbuildinfo cache)
tsc -b

# With verbosity
tsc -b --verbose

# Force full rebuild
tsc -b --force

# Clean build artifacts
tsc -b --clean
```

## Development

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
# Check all projects
pnpm run typecheck

# Single project
pnpm -F @bluebird/types run typecheck
```

## Configuration Features

### Root Config (tsconfig.json)

- **Purpose**: Orchestrates all projects via references
- **composite**: false (coordinator, not compilable)
- **incremental**: false (doesn't generate .tsbuildinfo)
- **references**: Lists all dependent projects in build order

### Base Config (tsconfig.base.json)

**Shared defaults for all projects:**

- **strict mode**: Full type checking enabled
  - noImplicitAny, strictNullChecks, noImplicitThis, etc.
- **Unused detection**: noUnusedLocals, noUnusedParameters
- **Best practices**: exactOptionalPropertyTypes, useUnknownInCatchVariables
- **Path aliases**: @bluebird/\* for seamless imports
- **Watch options**: Optimized for monorepo (useFsEvents, excludes)
- **Module system**: ES2020 modules + bundler resolution
- **Declaration maps**: Source-map support for IDE "Go to Definition"

### App Configs

**apps/api/tsconfig.json:**

- composite: true (emits JS + declarations)
- incremental: true (caches via .tsbuildinfo)
- module: ES2020 (modern Node.js)
- noEmit: false (generates output)

**apps/web/tsconfig.json:**

- composite: true
- noEmit: true (Next.js handles output)
- jsx: react-jsx (React 17+ auto-import)
- incremental: true (caches in .next/)

### Package Configs

**Libraries (packages/types, ui, client, etc.):**

- composite: true (enables references)
- emitDeclarationOnly: true (declaration files only, no JS)
- incremental: true (efficient rebuilds)
- references: Lists dependencies (types ← client ← api/web)

## Key Best Practices

1. **Never store baseUrl without ignoreDeprecations** - TypeScript 7.0 deprecation
2. **allowImportingTsExtensions requires emitDeclarationOnly or noEmit**
3. **composite: true on all referenced projects** - Required for tsc -b
4. **declaration: true on libraries, false on apps** - Apps don't export types
5. **tsBuildInfoFile placement** - Keep in dist/ for clean artifacts
6. **Watch optimization** - excludeDirectories prevents node_modules thrashing

## Incremental Build Performance

Build times with Project References:

- First build: ~5-10s (all projects)
- Incremental: ~1-2s (changed + dependents only)
- Full clean: 5-10s

Cached files (keep in .gitignore):

- `dist/.tsbuildinfo`
- `.next/.tsbuildinfo`
- `packages/**/dist/.tsbuildinfo`

## Troubleshooting

### "Cannot find referenced project"

→ Ensure all `references` paths have tsconfig.json files

### ".tsbuildinfo generation is bugged"

→ Delete `.tsbuildinfo` files and rebuild: `tsc -b --force`

### IDE not recognizing cross-package imports

→ Ensure composite: true on both packages, run `pnpm install` to link

### "noEmit conflicts with composite"

→ Use noEmit only on non-composite projects (apps/web), libraries must emit declarations

## IDE Support

- **VS Code**: Automatically uses project references from tsconfig.json
- **Intellij/WebStorm**: Requires IDE restart after tsconfig changes
- **Go to Definition**: Works across packages via declarationMap files
- **Rename**: Safely refactors across project boundaries
