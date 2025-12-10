# ESLint + Prettier Setup

This monorepo uses ESLint and Prettier for consistent code quality and formatting across all packages.

## Configuration

### ESLint (`.eslintrc.json`)

- **Extends:**
  - `eslint:recommended` - Core ESLint recommended rules
  - `plugin:@typescript-eslint/recommended` - TypeScript linting
  - `plugin:@typescript-eslint/strict` - Strict TypeScript rules
  - `plugin:prettier/recommended` - Prettier integration (disables conflicting rules)

- **Custom Rules:**
  - `@typescript-eslint/no-explicit-any`: Error (no `any` types)
  - `@typescript-eslint/no-unused-vars`: Error (with `_` prefix ignore pattern)
  - `no-console`: Warn (allows `console.warn` and `console.error`)
  - `no-var`: Error (use `const` or `let` instead)
  - `prettier/prettier`: Warn (formatting issues as warnings)

### Prettier (`.prettierrc.json`)

- **Semi:** `false` - No semicolons
- **Single Quote:** `true` - Use single quotes
- **Tab Width:** `2` - 2 spaces for indentation
- **Trailing Comma:** `es5` - Trailing commas where valid in ES5
- **Print Width:** `100` - Line wrap at 100 characters
- **Arrow Parens:** `always` - Always include parens in arrow functions

### Ignore Files

- **`.eslintignore`** - Skip linting for build outputs, generated files, and dependencies
- **`.prettierignore`** - Skip formatting for build outputs, lock files, and dependencies

## Available Commands

### Root Level (Monorepo-wide)

```bash
# Lint all TypeScript/JavaScript files
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Format all files with Prettier
pnpm format

# Check formatting without making changes
pnpm format:check

# Run all checks (format + lint + typecheck)
pnpm check
```

### Package Level

Each package can define its own scripts:

```bash
# In apps/api or any package
pnpm lint
pnpm format
```

## VS Code Integration

The workspace includes VS Code settings (`.vscode/settings.json`) for automatic formatting:

- **Format on Save:** Enabled
- **ESLint Auto-fix on Save:** Enabled
- **Default Formatter:** Prettier

### Required Extension

Install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) in VS Code.

## Pre-commit Hooks (Optional)

To enforce code quality before commits, you can add husky + lint-staged:

```bash
# Install packages
pnpm add -D -w husky lint-staged

# Initialize husky
pnpm exec husky init

# Add lint-staged config to package.json
```

## Common Issues

### TypeScript Version Warning

You may see warnings about TypeScript version compatibility. This is non-blocking and can be ignored for now. The officially supported TypeScript version is <5.4.0, but we're using 5.9.3 which works fine.

### ESLint-disable Comments

In rare cases where you need to disable a rule (e.g., `var` in global type declarations), use:

```typescript
// eslint-disable-next-line no-var
var globalVar: string
```

### Prettier vs ESLint Conflicts

This should never happen since we're using `eslint-config-prettier` which disables all ESLint formatting rules that conflict with Prettier. If you see conflicts, verify that `"plugin:prettier/recommended"` is the **last** item in the `extends` array.

## Testing the Setup

```bash
# Format all code
pnpm format

# Check for lint errors
pnpm lint

# Run TypeScript compilation
pnpm typecheck

# Run all checks at once
pnpm check
```

All commands should pass with no errors (warnings are acceptable).
