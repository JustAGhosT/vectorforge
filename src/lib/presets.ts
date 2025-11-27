/**
 * Conversion Presets
 * 
 * Pre-configured settings for common use cases.
 * Users can quickly apply these to get optimal results for different image types.
 */

import type { ConversionSettings } from './converter'

export interface ConversionPreset {
  id: string
  name: string
  description: string
  icon: 'logo' | 'icon' | 'illustration' | 'photo' | 'minimal' | 'custom'
  settings: ConversionSettings
  isCustom?: boolean
}

const CUSTOM_PRESETS_STORAGE_KEY = 'vectorforge-custom-presets'

/**
 * Built-in presets optimized for different image types
 */
export const BUILT_IN_PRESETS: ConversionPreset[] = [
  {
    id: 'logo',
    name: 'Logo',
    description: 'Clean shapes, limited colors',
    icon: 'logo',
    settings: {
      complexity: 0.6,
      colorSimplification: 0.5,
      pathSmoothing: 0.6,
      usePotrace: true,
    },
  },
  {
    id: 'icon',
    name: 'Icon',
    description: 'Simple graphics, bold lines',
    icon: 'icon',
    settings: {
      complexity: 0.4,
      colorSimplification: 0.7,
      pathSmoothing: 0.6,
      usePotrace: true,
    },
  },
  {
    id: 'illustration',
    name: 'Illustration',
    description: 'Detailed artwork, more colors',
    icon: 'illustration',
    settings: {
      complexity: 0.7,
      colorSimplification: 0.3,
      pathSmoothing: 0.5,
      usePotrace: true,
    },
  },
  {
    id: 'photo',
    name: 'Photo',
    description: 'Maximum detail preservation',
    icon: 'photo',
    settings: {
      complexity: 0.85,
      colorSimplification: 0.15,
      pathSmoothing: 0.4,
      usePotrace: false,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Smallest file size',
    icon: 'minimal',
    settings: {
      complexity: 0.3,
      colorSimplification: 0.8,
      pathSmoothing: 0.7,
      usePotrace: true,
    },
  },
]

/**
 * Get a preset by its ID
 */
export function getPresetById(id: string): ConversionPreset | undefined {
  const allPresets = [...BUILT_IN_PRESETS, ...loadCustomPresets()]
  return allPresets.find(preset => preset.id === id)
}

/**
 * Check if settings match a preset
 */
export function matchesPreset(settings: ConversionSettings): ConversionPreset | undefined {
  const allPresets = [...BUILT_IN_PRESETS, ...loadCustomPresets()]
  return allPresets.find(preset => 
    preset.settings.complexity === settings.complexity &&
    preset.settings.colorSimplification === settings.colorSimplification &&
    preset.settings.pathSmoothing === settings.pathSmoothing &&
    (preset.settings.usePotrace ?? false) === (settings.usePotrace ?? false)
  )
}

/**
 * Load custom presets from localStorage
 */
export function loadCustomPresets(): ConversionPreset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load custom presets:', error)
  }
  return []
}

/**
 * Save a custom preset
 */
export function saveCustomPreset(name: string, settings: ConversionSettings): ConversionPreset {
  const customPresets = loadCustomPresets()
  const newPreset: ConversionPreset = {
    id: `custom-${Date.now()}`,
    name,
    description: `Custom preset: C${Math.round(settings.complexity * 100)}% S${Math.round(settings.colorSimplification * 100)}% P${Math.round(settings.pathSmoothing * 100)}%`,
    icon: 'custom',
    settings: { ...settings },
    isCustom: true,
  }
  
  const updatedPresets = [...customPresets, newPreset]
  localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets))
  
  return newPreset
}

/**
 * Delete a custom preset
 */
export function deleteCustomPreset(id: string): void {
  const customPresets = loadCustomPresets()
  const updatedPresets = customPresets.filter(p => p.id !== id)
  localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets))
}

/**
 * Get all presets (built-in + custom)
 */
export function getAllPresets(): ConversionPreset[] {
  return [...BUILT_IN_PRESETS, ...loadCustomPresets()]
}
