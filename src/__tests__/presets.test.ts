import { describe, it, expect } from 'vitest'
import { 
  BUILT_IN_PRESETS, 
  getPresetById, 
  matchesPreset 
} from '../lib/presets'
import type { ConversionSettings } from '../lib/converter'

describe('Presets', () => {
  describe('BUILT_IN_PRESETS', () => {
    it('should have 5 built-in presets', () => {
      expect(BUILT_IN_PRESETS).toHaveLength(5)
    })

    it('should have all required preset types', () => {
      const ids = BUILT_IN_PRESETS.map(p => p.id)
      expect(ids).toContain('logo')
      expect(ids).toContain('icon')
      expect(ids).toContain('illustration')
      expect(ids).toContain('photo')
      expect(ids).toContain('minimal')
    })

    it('should have valid settings for each preset', () => {
      BUILT_IN_PRESETS.forEach(preset => {
        expect(preset.settings.complexity).toBeGreaterThanOrEqual(0)
        expect(preset.settings.complexity).toBeLessThanOrEqual(1)
        expect(preset.settings.colorSimplification).toBeGreaterThanOrEqual(0)
        expect(preset.settings.colorSimplification).toBeLessThanOrEqual(1)
        expect(preset.settings.pathSmoothing).toBeGreaterThanOrEqual(0)
        expect(preset.settings.pathSmoothing).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('getPresetById', () => {
    it('should return the correct preset for valid id', () => {
      const logoPreset = getPresetById('logo')
      expect(logoPreset).toBeDefined()
      expect(logoPreset?.name).toBe('Logo')
    })

    it('should return undefined for invalid id', () => {
      const result = getPresetById('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('matchesPreset', () => {
    it('should match settings to the correct preset', () => {
      const logoPreset = getPresetById('logo')!
      const matched = matchesPreset(logoPreset.settings)
      expect(matched?.id).toBe('logo')
    })

    it('should return undefined for non-matching settings', () => {
      const customSettings: ConversionSettings = {
        complexity: 0.123,
        colorSimplification: 0.456,
        pathSmoothing: 0.789,
      }
      const matched = matchesPreset(customSettings)
      expect(matched).toBeUndefined()
    })

    it('should match settings when usePotrace matches', () => {
      const logoPreset = getPresetById('logo')!
      // Logo preset has usePotrace: true
      expect(logoPreset.settings.usePotrace).toBe(true)
      
      const settingsWithPotrace: ConversionSettings = {
        ...logoPreset.settings,
        usePotrace: true,
      }
      const matched = matchesPreset(settingsWithPotrace)
      expect(matched?.id).toBe('logo')
    })

    it('should not match when usePotrace differs', () => {
      const logoPreset = getPresetById('logo')!
      const settingsWithoutPotrace: ConversionSettings = {
        complexity: logoPreset.settings.complexity,
        colorSimplification: logoPreset.settings.colorSimplification,
        pathSmoothing: logoPreset.settings.pathSmoothing,
        usePotrace: false, // Different from preset
      }
      const matched = matchesPreset(settingsWithoutPotrace)
      expect(matched).toBeUndefined()
    })
  })
})
