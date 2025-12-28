# Documentation Strategy Proposal for Bluebird

**Date:** 16 December 2025
**Status:** Proposal
**Purpose:** Define a comprehensive documentation approach for the Bluebird AI music composition platform

---

## Executive Summary

This proposal recommends a **multi-tool documentation strategy** combining:

1. **TypeDoc** for TypeScript/Node.js code API documentation
2. **Sphinx** for Python inference pods documentation
3. **Swagger/OpenAPI** for REST API documentation (already partially implemented)
4. **Docusaurus** as a unified documentation portal
5. **Storybook** for UI component library documentation (optional, Phase 2)

**Rationale:** Bluebird's polyglot architecture (TypeScript monorepo + Python inference) requires language-specific tools coordinated through a single portal.

---

## Current State Analysis

### What We Have

- ✅ Comprehensive project documentation in `docs/`
- ✅ OpenAPI types defined in `@bluebird/types`
- ✅ Inline code comments (inconsistent coverage)
- ✅ Agent instructions (`AGENTS.MD`, `.github/copilot-instructions.md`)
- ✅ Sprint planning and development logs

### What's Missing

- ❌ Generated API documentation from code
- ❌ Searchable, cross-referenced documentation
- ❌ Auto-updating docs from code changes
- ❌ Developer onboarding documentation
- ❌ Component usage examples and playground
- ❌ Python pod API documentation
- ❌ Centralized documentation portal

---

## Architecture Requirements

Bluebird's architecture demands specialized tooling:

| Component                                    | Language                      | Current Docs    | Proposed Tool           |
| -------------------------------------------- | ----------------------------- | --------------- | ----------------------- |
| **API** (`apps/api`)                         | TypeScript/Node.js            | Code comments   | **TypeDoc**             |
| **Web** (`apps/web`)                         | TypeScript/Next.js            | Code comments   | **TypeDoc**             |
| **Packages** (`packages/*`)                  | TypeScript                    | Minimal         | **TypeDoc**             |
| **Inference Pods** (`bluebird-infer/pods/*`) | Python/FastAPI                | None            | **Sphinx + autodoc**    |
| **REST API**                                 | FastAPI (pods), Fastify (api) | Partial OpenAPI | **Swagger/OpenAPI**     |
| **UI Components** (`packages/ui`)            | React/TypeScript              | None            | **Storybook** (Phase 2) |
| **Unified Portal**                           | N/A                           | None            | **Docusaurus**          |

---

## Recommended Tools

### 1. TypeDoc (Code → API Docs for TypeScript)

**Why TypeDoc?**

- ✅ Native TypeScript support (our primary language)
- ✅ Understands Zod schemas, type definitions, generics
- ✅ Generates HTML/JSON from TSDoc comments
- ✅ Integrates with monorepo structure
- ✅ Actively maintained, large ecosystem

**Use Cases:**

- Document `@bluebird/types` (DTOs, schemas)
- Generate API reference for `apps/api` routes and workers
- Document `packages/client` SDK
- Expose `packages/telemetry`, `packages/test-helpers` utilities

**Integration:**

```bash
# Install TypeDoc
pnpm add -D -w typedoc

# Generate docs
pnpm typedoc --entryPointStrategy packages "packages/*/src/index.ts" "apps/*/src/**/*.ts"
```

**Output:** `docs/api/typescript/` (static HTML)

---

### 2. Sphinx (Python Pods Documentation)

**Why Sphinx?**

- ✅ Industry standard for Python documentation
- ✅ Autodoc extension extracts docstrings automatically
- ✅ Supports reStructuredText + Markdown
- ✅ Cross-referencing, search, multiple output formats
- ✅ Works with FastAPI (via `sphinx-fastapi`)

**Use Cases:**

- Document `bluebird-infer/pods/*` (analyzer, planner, melody, music, voice, etc.)
- Extract docstrings from Python functions/classes
- Generate API reference for FastAPI endpoints in pods

**Integration:**

```bash
# In bluebird-infer/
pip install -U sphinx sphinx-autodoc-typehints sphinx-fastapi

# Initialize
sphinx-quickstart docs/

# Build
sphinx-build -b html docs/source docs/build
```

**Output:** `bluebird-infer/docs/build/html/` (static HTML)

---

### 3. Swagger/OpenAPI (REST API Spec)

**Why Swagger/OpenAPI?**

- ✅ Already using OpenAPI types in `@bluebird/types`
- ✅ Fastify supports OpenAPI via `@fastify/swagger`
- ✅ FastAPI (Python pods) auto-generates OpenAPI specs
- ✅ Interactive API testing via Swagger UI

**Use Cases:**

- Auto-generate API docs from Fastify routes
- Expose Python pod endpoints (already done by FastAPI)
- Provide interactive API playground

**Integration:**

```typescript
// apps/api/src/server.ts
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

await app.register(swagger, {
  openapi: {
    info: { title: 'Bluebird API', version: '0.2.0' },
    servers: [{ url: 'http://localhost:4000' }],
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
  staticCSP: true,
})
```

**Output:** Interactive UI at `http://localhost:4000/docs`

---

### 4. Docusaurus (Unified Documentation Portal)

**Why Docusaurus?**

- ✅ Built by Meta, industry-proven (React, Kubernetes, Jest use it)
- ✅ React-based, integrates seamlessly with Next.js ecosystem
- ✅ Markdown + MDX (embed React components in docs)
- ✅ Versioning, search, i18n, dark mode out-of-the-box
- ✅ Can aggregate TypeDoc, Sphinx, OpenAPI outputs

**Use Cases:**

- Centralized portal for all documentation
- Developer onboarding guides
- Sprint planning, architecture decisions (ADRs)
- Tutorials, how-tos, troubleshooting

**Structure:**

```bash
docs-site/
  docs/
    intro.md
    getting-started/
    architecture/
    api-reference/
      typescript/   # Embed TypeDoc output
      python/       # Embed Sphinx output
      rest-api/     # Link to Swagger UI
    guides/
      how-to-add-features.md
      testing-strategy.md
    contributing.md
  blog/
    sprint-0-complete.md
    sprint-1-complete.md
  sidebars.js
  docusaurus.config.js
```

**Integration:**

```bash
npx create-docusaurus@latest docs-site classic

# Serve
cd docs-site && pnpm start
```

**Output:** Interactive portal at `http://localhost:3001`

---

### 5. Storybook (UI Component Library - Phase 2)

**Why Storybook? (Optional)**

- ✅ Interactive component playground
- ✅ Visual regression testing
- ✅ Accessibility checks
- ✅ Widely used for design systems

**Use Cases:**

- Document `packages/ui` React components
- Showcase shadcn/ui customizations
- Provide usage examples for designers/developers

**Deferred to Phase 2:** Focus on API docs first, add Storybook when UI stabilizes.

---

## Proposed Documentation Workflow

### Phase 1: Foundation (Sprint 3)

**Goals:**

- Set up TypeDoc for TypeScript codebase
- Configure Swagger UI for REST API
- Initialize Docusaurus portal

**Tasks:**

1. Install TypeDoc in root workspace
2. Add TSDoc comments to `@bluebird/types` (ArrangementSpec, VocalScore, etc.)
3. Configure `typedoc.json` for monorepo
4. Set up Swagger UI in `apps/api`
5. Create Docusaurus site structure
6. Migrate existing `docs/` content to Docusaurus

**Acceptance Criteria:**

- ✅ TypeDoc generates API reference for `packages/types`
- ✅ Swagger UI accessible at `/docs` endpoint
- ✅ Docusaurus site serves at `localhost:3001`
- ✅ CI pipeline builds and validates docs

**Time Estimate:** 3-4 days

---

### Phase 2: Python Integration (Sprint 4)

**Goals:**

- Document Python inference pods with Sphinx
- Integrate Sphinx output into Docusaurus

**Tasks:**

1. Install Sphinx in `bluebird-infer/`
2. Add docstrings to pod modules (planner, analyzer, melody, etc.)
3. Configure `conf.py` with autodoc, napoleon (Google/NumPy style)
4. Build HTML docs
5. Link Sphinx output to Docusaurus

**Acceptance Criteria:**

- ✅ Sphinx generates docs for all pods
- ✅ Python API reference accessible from Docusaurus
- ✅ Docstrings follow consistent format (Google style)

**Time Estimate:** 3-4 days

---

### Phase 3: Advanced Features (Sprint 5+)

**Goals:**

- Add interactive examples
- Set up automated doc deployment
- Introduce Storybook for UI components

**Tasks:**

1. Create interactive code examples in Docusaurus (MDX)
2. Configure GitHub Actions to build/deploy docs on merge to `main`
3. Host docs on GitHub Pages or Vercel
4. Set up Storybook for `packages/ui`
5. Add visual regression testing with Chromatic

**Acceptance Criteria:**

- ✅ Docs auto-deploy to public URL
- ✅ Searchable, versioned documentation
- ✅ UI component library interactive playground

**Time Estimate:** 5-6 days

---

## Documentation Standards

### TSDoc Comment Format (TypeScript)

Use [TSDoc](https://tsdoc.org/) standard for TypeScript:

````typescript
/**
 * Validates an arrangement plan against performance budgets.
 *
 * @param plan - The arrangement specification to validate
 * @param budget - Maximum allowed complexity score
 * @returns Validation result with errors and warnings
 * @throws {ValidationError} If plan structure is invalid
 *
 * @example
 * ```typescript
 * const result = validateArrangement(plan, { maxComplexity: 100 })
 * if (!result.valid) {
 *   console.error(result.errors)
 * }
 * ```
 *
 * @remarks
 * Complexity is calculated as: sections × instruments × energy curve variance
 *
 * @see {@link ArrangementSpec} for plan structure
 * @internal
 */
export function validateArrangement(
  plan: ArrangementSpec,
  budget: { maxComplexity: number }
): ValidationResult {
  // ...
}
````

**Required Tags:**

- `@param` - For all parameters (with type if not inferred)
- `@returns` - For non-void functions
- `@throws` - For expected errors
- `@example` - For complex functions (at least one example)

**Optional Tags:**

- `@remarks` - Additional context
- `@see` - Cross-references
- `@deprecated` - For deprecated APIs
- `@internal` - For private/internal APIs

---

### Python Docstring Format (Google Style)

Use [Google style](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings) for Python:

```python
def extract_melody_features(audio_path: str, config: FeatureConfig) -> MelodyFeatures:
    """Extract melodic features from audio using HPSS and pitch tracking.

    This function performs harmonic-percussive source separation (librosa.hpss)
    followed by pitch tracking (librosa.pyin) to extract interval n-grams,
    contour, and melodic density.

    Args:
        audio_path: Path to WAV file (mono, 44.1/48kHz, 16/24-bit)
        config: Feature extraction configuration (min_freq, max_freq, hop_length)

    Returns:
        MelodyFeatures object containing:
            - interval_ngrams (dict): n-gram histograms (n=3..5)
            - contour (list): Pitch contour in MIDI notes
            - density (float): Average notes per second

    Raises:
        AudioLoadError: If audio file is invalid or corrupted
        FeatureExtractionError: If HPSS or pitch tracking fails

    Example:
        >>> config = FeatureConfig(min_freq=80, max_freq=800)
        >>> features = extract_melody_features("vocals.wav", config)
        >>> print(features.interval_ngrams[3])  # Trigram histogram

    Note:
        Performance: ~3-5s CPU time for 30s audio on modern hardware.
        Requires librosa>=0.10.0 and numpy>=1.24.0.
    """
    # ...
```

---

### Markdown Documentation (Guides, Tutorials)

Use consistent structure for narrative docs:

````markdown
# Feature Title

**Purpose:** One-sentence description
**Audience:** Who should read this (developers, ops, product)
**Estimated Time:** 10 minutes

---

## Overview

[Brief introduction]

## Prerequisites

- Requirement 1
- Requirement 2

## Step-by-Step Instructions

### Step 1: [Action]

[Description]

```bash
# Code example
pnpm install
```
````

### Step 2: [Action]

[Description]

## Troubleshooting

**Issue:** [Common problem]
**Solution:** [Fix]

## Next Steps

- Link to related guide
- Link to API reference

---

**Last Updated:** 16 Dec 2025
**Related:** [Link], [Link]

````

---

## CI/CD Integration

### Automated Documentation Build

Add to `.github/workflows/docs.yml`:

```yaml
name: Documentation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build TypeDoc
        run: pnpm typedoc

      - name: Build Swagger specs
        run: pnpm --filter @bluebird/api build:openapi

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Build Sphinx docs
        run: |
          cd bluebird-infer
          pip install sphinx sphinx-autodoc-typehints
          sphinx-build -b html docs/source docs/build

      - name: Build Docusaurus
        run: |
          cd docs-site
          pnpm install
          pnpm build

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs-site/build
````

---

## Success Metrics

### Developer Onboarding Time

- **Before:** 2-3 days to understand codebase
- **Target:** <1 day with comprehensive docs

### Documentation Coverage

- **Current:** ~30% (manual docs only)
- **Target:** >80% (auto-generated + manual)

### Support Requests

- **Baseline:** Track "how does X work?" questions
- **Target:** 50% reduction after Phase 3

### Search Effectiveness

- **Metric:** Time to find API reference
- **Target:** <30 seconds via Docusaurus search

---

## Cost Analysis

### Tool Costs

- TypeDoc: **Free** (open source)
- Sphinx: **Free** (open source)
- Swagger/OpenAPI: **Free** (open source)
- Docusaurus: **Free** (open source)
- Storybook: **Free** (open source)

### Hosting Costs

- GitHub Pages: **Free** for public repos
- Vercel: **Free** for OSS projects
- Alternative: AWS S3 + CloudFront (~$5/month for low traffic)

### Time Investment

- **Phase 1:** 3-4 days (TypeDoc + Swagger + Docusaurus)
- **Phase 2:** 3-4 days (Sphinx integration)
- **Phase 3:** 5-6 days (Advanced features + Storybook)
- **Ongoing:** ~1-2 hours/sprint for updates

**Total Initial Investment:** 11-14 days
**Ongoing Maintenance:** ~5% of development time

---

## Alternative Approaches Considered

### Single-Tool Solutions

| Tool              | Pros                                              | Cons                                                  | Verdict                             |
| ----------------- | ------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| **Swimm**         | Documentation as Code, IDE integration, auto-sync | Proprietary, limited language support, learning curve | ❌ Not polyglot-friendly            |
| **Doxygen**       | Multi-language support                            | Poor TypeScript support, outdated UI                  | ❌ Weak for modern TS/JS            |
| **JSDoc**         | Simple, widely used                               | JavaScript-only, no TypeScript generics               | ❌ TypeDoc is superior              |
| **GitBook**       | Beautiful UI, collaboration                       | Commercial for teams, vendor lock-in                  | ❌ Cost prohibitive                 |
| **Read the Docs** | Great for Python                                  | Primarily Sphinx-focused, limited customization       | ✅ Could host Sphinx output         |
| **MkDocs**        | Simpler than Docusaurus                           | Less extensible, smaller ecosystem                    | ⚠️ Viable alternative to Docusaurus |

**Decision:** Multi-tool approach gives us:

- Best-in-class tools for each language
- No vendor lock-in
- Maximum flexibility
- Open-source, zero licensing costs

---

## Risk Assessment

| Risk                      | Impact | Mitigation                                                         |
| ------------------------- | ------ | ------------------------------------------------------------------ |
| **Docs drift from code**  | High   | CI checks enforce doc builds; pre-commit hooks                     |
| **Maintenance burden**    | Medium | Auto-generation reduces manual work; clear ownership               |
| **Developer adoption**    | Medium | Training session; integrate into onboarding; enforce in PR reviews |
| **Tool churn**            | Low    | All tools are mature, industry-standard                            |
| **Multi-repo complexity** | Medium | Docusaurus aggregates; clear directory structure                   |

---

## Implementation Roadmap

### Sprint 3 (Current Sprint - Weeks 1-2)

- [ ] Install TypeDoc in root workspace
- [ ] Add TSDoc comments to `@bluebird/types`
- [ ] Configure Swagger UI in `apps/api`
- [ ] Create Docusaurus site skeleton
- [ ] Migrate existing markdown docs to Docusaurus

### Sprint 4 (Weeks 3-4)

- [ ] Set up Sphinx in `bluebird-infer/`
- [ ] Document Python pods with Google-style docstrings
- [ ] Build and integrate Sphinx output
- [ ] Configure CI pipeline for automated builds

### Sprint 5 (Weeks 5-6)

- [ ] Add interactive examples (MDX)
- [ ] Set up GitHub Pages deployment
- [ ] Implement doc versioning
- [ ] Add search functionality

### Sprint 6+ (Future)

- [ ] Introduce Storybook for UI components
- [ ] Visual regression testing
- [ ] Internationalization (i18n)
- [ ] Contributor guidelines in docs

---

## Recommended Action

**Approve** this multi-tool strategy and proceed with **Phase 1 implementation in Sprint 3**.

**Key Benefits:**

1. **Developer velocity:** Faster onboarding, less "how does this work?" questions
2. **Code quality:** Enforces documentation as part of PR reviews
3. **Discoverability:** Searchable, cross-referenced docs from single portal
4. **Maintainability:** Auto-generated docs stay in sync with code
5. **Professionalism:** Public-facing docs demonstrate maturity to users/investors

**Next Steps:**

1. Review this proposal with team
2. Approve/modify recommended tooling
3. Assign tasks for Sprint 3
4. Schedule kickoff meeting for Phase 1

---

## References

- [TypeDoc Official Docs](https://typedoc.org/)
- [Sphinx Documentation](https://www.sphinx-doc.org/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Docusaurus Documentation](https://docusaurus.io/)
- [TSDoc Standard](https://tsdoc.org/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Original Article: 13 Code Documentation Tools](https://overcast.blog/13-code-documentation-tools-you-should-know-e838c6e793e8)

---

**Prepared by:** AI Agent (GitHub Copilot)
**Date:** 16 December 2025
**Version:** 1.0
**Status:** Awaiting Approval
