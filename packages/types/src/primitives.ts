import { z } from 'zod'

// Primitive Types shared across modules (no re-exports to avoid cycles)

/** Unique identifier (CUID2) used across entities. */
export const IdSchema = z.string().cuid2()
export type Id = z.infer<typeof IdSchema>

/** Identifier for a project (CUID2). */
export const ProjectIdSchema = z.string().cuid2()
export type ProjectId = z.infer<typeof ProjectIdSchema>

/** Queue/job identifier; may be composite (project:timestamp:seed). */
export const JobIdSchema = z.string().min(1)
export type JobId = z.infer<typeof JobIdSchema>

/** Identifier for a generated take (CUID2). */
export const TakeIdSchema = z.string().cuid2()
export type TakeId = z.infer<typeof TakeIdSchema>
