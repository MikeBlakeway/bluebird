/**
 * Commander Package Tests
 * Validates Commander 12.x TypeScript support and ensures proper command structure
 */

import { describe, it, expect } from 'vitest'
import { Command } from 'commander'

describe('Commander Package - TypeScript Support', () => {
  it('should have TypeScript types available', () => {
    const program = new Command()

    // Should be able to access Command methods with type safety
    expect(typeof program.name).toBe('function')
    expect(typeof program.version).toBe('function')
    expect(typeof program.command).toBe('function')
    expect(typeof program.option).toBe('function')
    expect(typeof program.requiredOption).toBe('function')
  })

  it('should create commands with proper type inference', () => {
    const program = new Command()

    program.name('bluebird-test').version('1.0.0').description('Test CLI')

    // Should be able to access properties
    expect(program.name()).toBe('bluebird-test')
  })

  it('should handle required options', () => {
    const program = new Command()

    program
      .command('test')
      .requiredOption('-l, --lyrics <text>', 'Lyrics text')
      .option('-g, --genre <genre>', 'Genre', 'pop_2010s')

    // Command should be defined
    const commands = program.commands
    expect(commands).toHaveLength(1)
    expect(commands[0]?.name()).toBe('test')
  })

  it('should support option definitions', () => {
    const program = new Command()

    const planCommand = program
      .command('plan')
      .requiredOption('-l, --lyrics <text>', 'Lyrics')
      .option('-g, --genre <genre>', 'Genre', 'pop_2010s')
      .option('-s, --seed <number>', 'Seed', (val: string) => parseInt(val, 10))
      .option('--pro', 'PRO priority', false)
      .option('--watch', 'Watch mode', false)

    // Options should be defined on the command
    expect(planCommand.options).toBeDefined()
    expect(planCommand.options.length).toBeGreaterThan(0)
  })

  it('should handle command aliases', () => {
    const program = new Command()

    program.command('plan').alias('p').description('Plan a song')

    const planCommand = program.commands.find((cmd) => cmd.name() === 'plan')
    expect(planCommand).toBeDefined()
    expect(planCommand?.aliases()).toContain('p')
  })

  it('should support action handlers with TypeScript inference', () => {
    const program = new Command()

    // TypeScript should infer action function signature
    program.command('test').action(() => {
      // Action logic
    })

    expect(program.commands).toHaveLength(1)
  })
})

describe('Commander - CLI Command Structure', () => {
  it('should match expected bluebird CLI structure', () => {
    const program = new Command()

    program
      .name('bluebird')
      .version('0.1.0')
      .description('Bluebird AI Music Composition Platform - Sprint 0')

    program
      .command('plan')
      .description('Plan a new song arrangement')
      .requiredOption('-l, --lyrics <text>', 'Song lyrics (10-5000 characters)')
      .option('-g, --genre <genre>', 'Genre preset', 'pop_2010s')
      .option('-p, --project <id>', 'Project ID (CUID)')
      .option('-s, --seed <number>', 'Random seed', (val: string) => parseInt(val, 10))
      .option('--pro', 'Use PRO priority queue', false)
      .option('--watch', 'Watch job progress via SSE', false)
      .action(() => {
        // Action implementation
      })

    // Verify structure
    expect(program.name()).toBe('bluebird')
    expect(program.commands).toHaveLength(1)

    const planCommand = program.commands[0]
    expect(planCommand?.name()).toBe('plan')
  })

  it('should provide type safety for command options', () => {
    const program = new Command()

    // The fact that this compiles proves TypeScript types are working
    program
      .name('test-cli')
      .version('1.0.0')
      .option('-v, --verbose', 'Verbose output')
      .option('-p, --port <number>', 'Port number', parseInt)

    expect(program.name()).toBe('test-cli')
  })
})
