import { describe, it, expect } from 'vitest'
import { getSimilarityLabel, getSeverityInfo, getCategoryIcon } from '../lib/ai-comparison'

describe('AI Comparison utilities', () => {
  describe('getSimilarityLabel', () => {
    it('should return "Excellent" for scores 90 and above', () => {
      expect(getSimilarityLabel(90)).toEqual({ label: 'Excellent', color: 'green' })
      expect(getSimilarityLabel(100)).toEqual({ label: 'Excellent', color: 'green' })
      expect(getSimilarityLabel(95)).toEqual({ label: 'Excellent', color: 'green' })
    })

    it('should return "Good" for scores between 75 and 89', () => {
      expect(getSimilarityLabel(75)).toEqual({ label: 'Good', color: 'yellow' })
      expect(getSimilarityLabel(89)).toEqual({ label: 'Good', color: 'yellow' })
      expect(getSimilarityLabel(80)).toEqual({ label: 'Good', color: 'yellow' })
    })

    it('should return "Fair" for scores between 60 and 74', () => {
      expect(getSimilarityLabel(60)).toEqual({ label: 'Fair', color: 'orange' })
      expect(getSimilarityLabel(74)).toEqual({ label: 'Fair', color: 'orange' })
      expect(getSimilarityLabel(67)).toEqual({ label: 'Fair', color: 'orange' })
    })

    it('should return "Needs Improvement" for scores below 60', () => {
      expect(getSimilarityLabel(59)).toEqual({ label: 'Needs Improvement', color: 'red' })
      expect(getSimilarityLabel(0)).toEqual({ label: 'Needs Improvement', color: 'red' })
      expect(getSimilarityLabel(30)).toEqual({ label: 'Needs Improvement', color: 'red' })
    })
  })

  describe('getSeverityInfo', () => {
    it('should return correct info for minor severity', () => {
      const result = getSeverityInfo('minor')
      expect(result.label).toBe('Minor')
      expect(result.color).toContain('green')
    })

    it('should return correct info for moderate severity', () => {
      const result = getSeverityInfo('moderate')
      expect(result.label).toBe('Moderate')
      expect(result.color).toContain('yellow')
    })

    it('should return correct info for significant severity', () => {
      const result = getSeverityInfo('significant')
      expect(result.label).toBe('Significant')
      expect(result.color).toContain('red')
    })
  })

  describe('getCategoryIcon', () => {
    it('should return correct icon for each category', () => {
      expect(getCategoryIcon('color')).toBe('Palette')
      expect(getCategoryIcon('shape')).toBe('Polygon')
      expect(getCategoryIcon('detail')).toBe('MagnifyingGlass')
      expect(getCategoryIcon('edge')).toBe('BoundingBox')
      expect(getCategoryIcon('texture')).toBe('Gradient')
      expect(getCategoryIcon('other')).toBe('Question')
    })
  })
})
