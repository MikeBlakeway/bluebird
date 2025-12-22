/**
 * Timeline Stages Tests
 */

import { describe, it, expect } from 'vitest'
import type { JobStage } from '@bluebird/types'
import {
  STAGES,
  getStageDefinition,
  getStageIndex,
  getTotalEstimatedDuration,
  getCumulativeDuration,
} from './timeline-stages'

describe('timeline-stages', () => {
  describe('STAGES', () => {
    it('should define all required stages', () => {
      const stageIds = STAGES.map((s) => s.id)
      expect(stageIds).toContain('queued')
      expect(stageIds).toContain('analyzing')
      expect(stageIds).toContain('planning')
      expect(stageIds).toContain('melody-gen')
      expect(stageIds).toContain('music-render')
      expect(stageIds).toContain('vocal-render')
      expect(stageIds).toContain('mixing')
      expect(stageIds).toContain('similarity-check')
      expect(stageIds).toContain('exporting')
      expect(stageIds).toContain('completed')
      expect(stageIds).toContain('failed')
    })

    it('should have valid properties for each stage', () => {
      STAGES.forEach((stage) => {
        expect(stage.id).toBeTruthy()
        expect(stage.label).toBeTruthy()
        expect(stage.description).toBeTruthy()
        expect(stage.estimatedDuration).toBeGreaterThanOrEqual(0)
        expect(stage.icon).toBeTruthy()
        expect(stage.color).toBeTruthy()
      })
    })

    it('should have terminal stages with zero duration', () => {
      const completed = STAGES.find((s) => s.id === 'completed')
      const failed = STAGES.find((s) => s.id === 'failed')

      expect(completed?.estimatedDuration).toBe(0)
      expect(failed?.estimatedDuration).toBe(0)
    })
  })

  describe('getStageDefinition', () => {
    it('should return stage definition for valid stage', () => {
      const stage = getStageDefinition('planning')
      expect(stage.id).toBe('planning')
      expect(stage.label).toBe('Planning')
    })

    it('should throw error for invalid stage', () => {
      expect(() => getStageDefinition('invalid' as JobStage)).toThrow('Unknown stage')
    })
  })

  describe('getStageIndex', () => {
    it('should return correct index for stages', () => {
      expect(getStageIndex('queued')).toBe(0)
      expect(getStageIndex('planning')).toBe(2)
      expect(getStageIndex('completed')).toBe(9)
    })

    it('should return -1 for invalid stage', () => {
      expect(getStageIndex('invalid' as JobStage)).toBe(-1)
    })
  })

  describe('getTotalEstimatedDuration', () => {
    it('should calculate total duration excluding terminal stages', () => {
      const total = getTotalEstimatedDuration()
      // Should be sum of all non-terminal stages
      // queued(500) + analyzing(2000) + planning(12000) + melody(5000) +
      // music(20000) + vocals(8000) + mixing(2000) + checking(1000) + exporting(1500)
      expect(total).toBe(52000)
    })

    it('should not include completed/failed stages', () => {
      const total = getTotalEstimatedDuration()
      const completedDuration = STAGES.find((s) => s.id === 'completed')?.estimatedDuration || 0
      const failedDuration = STAGES.find((s) => s.id === 'failed')?.estimatedDuration || 0

      expect(total).not.toContain(completedDuration)
      expect(total).not.toContain(failedDuration)
    })
  })

  describe('getCumulativeDuration', () => {
    it('should calculate cumulative duration up to stage', () => {
      // Up to queued: 500
      expect(getCumulativeDuration('queued')).toBe(500)

      // Up to analyzing: 500 + 2000 = 2500
      expect(getCumulativeDuration('analyzing')).toBe(2500)

      // Up to planning: 500 + 2000 + 12000 = 14500
      expect(getCumulativeDuration('planning')).toBe(14500)
    })

    it('should include the specified stage duration', () => {
      const planningDuration = STAGES.find((s) => s.id === 'planning')?.estimatedDuration || 0
      const cumulativeThroughPlanning = getCumulativeDuration('planning')

      expect(cumulativeThroughPlanning).toBeGreaterThanOrEqual(planningDuration)
    })
  })
})
