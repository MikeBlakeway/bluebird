# Testing Guide

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Open interactive coverage UI
pnpm test:ui

# Run only integration tests
pnpm test:integration
```

## Test Coverage

### Current Coverage Targets

We maintain a **60% minimum coverage threshold** for:

- Lines
- Functions
- Branches
- Statements

These thresholds are enforced in CI and will fail the build if not met.

### Viewing Coverage Reports

After running `pnpm test:coverage`, coverage reports are generated in multiple formats:

1. **Terminal output** - Summary shown in console
2. **HTML report** - Open `coverage/index.html` in your browser for interactive exploration
3. **LCOV** - `coverage/lcov.info` for CI integration (CodeCov, Coveralls)
4. **JSON** - `coverage/coverage-summary.json` for programmatic access

### Coverage Philosophy

**What to test:**

- ✅ Business logic (analyzer, planner)
- ✅ Data transformations
- ✅ Integration points (queue, worker, DB)
- ✅ API endpoints (validation, auth)
- ✅ Error handling paths

**What NOT to test:**

- ❌ Third-party library internals
- ❌ Simple getters/setters
- ❌ Configuration files
- ❌ Type definitions

### Test Organization

```
src/
├── lib/
│   ├── analyzer.ts
│   └── test/
│       └── analyzer.test.ts    # Unit tests for lib modules
├── routes/
│   ├── planner.ts
│   └── test/
│       └── planner.test.ts     # Route handler tests
└── test/
    ├── server.integration.test.ts  # API integration tests
    └── server.burnin.test.ts       # Load/stress tests
```

## Test Types

### Unit Tests

Test individual functions in isolation.

```typescript
describe('analyzeLyrics', () => {
  test('should count syllables correctly', () => {
    const result = analyzeLyrics('Hello world')
    expect(result[0].syllables.length).toBeGreaterThan(0)
  })
})
```

### Integration Tests

Test multiple components working together.

```typescript
describe('Queue Integration', () => {
  test('should process job through worker', async () => {
    await enqueuePlanJob({ ... })
    const status = await getJobStatus(jobId)
    expect(status?.state).toBe('completed')
  })
})
```

### Burn-in Tests

Test system under realistic load.

```typescript
it('should handle 10 concurrent jobs', async () => {
  const jobs = Array.from({ length: 10 }, (_, i) =>
    enqueuePlanJob({ jobId: `job-${i}`, ... })
  )
  await expect(Promise.all(jobs)).resolves.not.toThrow()
}, 30000)
```

## Coverage Tracking

### By Module

Current coverage by module (Sprint 0 baseline):

| Module               | Coverage    | Status          |
| -------------------- | ----------- | --------------- |
| `lib/analyzer.ts`    | ✅ High     | 10 tests        |
| `lib/planner.ts`     | ✅ High     | 12 tests        |
| `lib/music-synth.ts` | ✅ High     | 9 tests         |
| `lib/worker.ts`      | ✅ Good     | 8 tests         |
| `lib/queue.ts`       | ✅ Good     | 3 tests         |
| `lib/events.ts`      | ✅ Good     | 3 tests         |
| `lib/voice-synth.ts` | ⚠️ None     | 0 tests         |
| `lib/jwt.ts`         | ⚠️ Indirect | Via integration |
| `lib/middleware.ts`  | ⚠️ Indirect | Via integration |
| `routes/render.ts`   | ⚠️ None     | 0 tests         |
| `routes/mix.ts`      | ⚠️ None     | 0 tests         |
| `routes/export.ts`   | ⚠️ None     | 0 tests         |

### Sprint 1 Coverage Goals

Add tests for:

- [ ] `lib/voice-synth.ts` - Mirror music-synth test pattern
- [ ] `routes/render.ts` - Test music/vocal rendering endpoints
- [ ] `routes/mix.ts` - Test mixing endpoint
- [ ] `routes/export.ts` - Test export endpoint

Target: **70% overall coverage** by end of Sprint 1

## CI Integration

Coverage reports are:

- Generated on every PR
- Uploaded to coverage service (CodeCov/Coveralls)
- Enforced as a quality gate (60% minimum)
- Tracked over time for trend analysis

## Tips

### Writing Good Tests

1. **Test behavior, not implementation**

   ```typescript
   // Good - tests behavior
   expect(arrangement.bpm).toBeGreaterThan(60)

   // Bad - tests implementation
   expect(calculateBpm.mock.calls.length).toBe(1)
   ```

2. **Use descriptive test names**

   ```typescript
   // Good
   test('should return major scale for happy lyrics', () => {})

   // Bad
   test('guessScale works', () => {})
   ```

3. **Arrange-Act-Assert pattern**

   ```typescript
   test('should create project', async () => {
     // Arrange
     const user = await createTestUser()

     // Act
     const project = await createProject({ userId: user.id })

     // Assert
     expect(project.userId).toBe(user.id)
   })
   ```

4. **Test edge cases**
   - Empty inputs
   - Boundary values
   - Error conditions
   - Race conditions (for async code)

### Coverage Gotchas

- **High coverage ≠ good tests** - Focus on meaningful assertions
- **Don't test libraries** - Trust that Fastify, Prisma, etc. work
- **Mock external dependencies** - S3, email, payment APIs
- **Isolate database tests** - Use transactions or cleanup in `afterEach`

## Debugging Tests

```bash
# Run specific test file
pnpm vitest src/lib/test/analyzer.test.ts

# Run specific test by name
pnpm vitest -t "should detect AABB rhyme scheme"

# Debug with node inspector
node --inspect-brk node_modules/.bin/vitest --run

# Show full error stack traces
pnpm vitest --reporter=verbose
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Coverage Analysis Guide](https://istanbul.js.org/docs/tutorials/)
