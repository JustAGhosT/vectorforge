import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  BUILT_IN_PRESETS, 
  getPresetById, 
  matchesPreset,
  exportPresetsAsJSON,
  importPresetsFromJSON,
} from '../lib/presets'
import type { ConversionSettings } from '../lib/converter'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('Presets', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('BUILT_IN_PRESETS', () => {
    it('should have 7 built-in presets', () => {
      expect(BUILT_IN_PRESETS).toHaveLength(7)
    })

    it('should have all required preset types', () => {
      const ids = BUILT_IN_PRESETS.map(p => p.id)
      expect(ids).toContain('logo')
      expect(ids).toContain('icon')
      expect(ids).toContain('illustration')
      expect(ids).toContain('photo')
      expect(ids).toContain('minimal')
      expect(ids).toContain('bw-logo')
      expect(ids).toContain('pixel-art')
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

  describe('exportPresetsAsJSON', () => {
    it('should return empty array when no custom presets', () => {
      const json = exportPresetsAsJSON()
      expect(json).toBe('[]')
    })
  })

  describe('importPresetsFromJSON', () => {
    it('should return error for invalid JSON', () => {
      const result = importPresetsFromJSON('invalid json')
      expect(result.imported).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should return error for non-array JSON', () => {
      const result = importPresetsFromJSON('{"name": "test"}')
      expect(result.imported).toBe(0)
      expect(result.errors).toContain('Invalid format: expected an array of presets')
    })

    it('should skip presets with missing name', () => {
      const result = importPresetsFromJSON('[{"settings": {"complexity": 0.5}}]')
      expect(result.imported).toBe(0)
      expect(result.errors.some(e => e.includes('missing or invalid name'))).toBe(true)
    })

    it('should import valid presets', () => {
      const validPreset = [{
        name: 'Test Preset',
        settings: {
          complexity: 0.5,
          colorSimplification: 0.5,
          pathSmoothing: 0.5,
          usePotrace: true,
        }
      }]
      const result = importPresetsFromJSON(JSON.stringify(validPreset))
      expect(result.imported).toBe(1)
      expect(result.errors.length).toBe(0)
    })

    it('should skip duplicate names', () => {
      // First import
      const preset = [{
        name: 'Duplicate Test',
        settings: {
          complexity: 0.5,
          colorSimplification: 0.5,
          pathSmoothing: 0.5,
        }
      }]
      importPresetsFromJSON(JSON.stringify(preset))
      
      // Second import with same name
      const result = importPresetsFromJSON(JSON.stringify(preset))
      expect(result.imported).toBe(0)
      expect(result.errors.some(e => e.includes('same name already exists'))).toBe(true)
    })
  })
})
