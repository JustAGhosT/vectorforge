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
      colorMode: 'colored',
      filterSpeckle: 5,
      curveFitting: 'spline',
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
      colorMode: 'colored',
      filterSpeckle: 10,
      curveFitting: 'polygon',
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
      colorMode: 'colored',
      filterSpeckle: 2,
      curveFitting: 'spline',
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
      colorMode: 'colored',
      filterSpeckle: 0,
      curveFitting: 'spline',
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
      colorMode: 'colored',
      filterSpeckle: 15,
      curveFitting: 'polygon',
    },
  },
  {
    id: 'bw-logo',
    name: 'B&W Logo',
    description: 'High contrast black & white',
    icon: 'logo',
    settings: {
      complexity: 0.5,
      colorSimplification: 1.0,
      pathSmoothing: 0.6,
      usePotrace: true,
      colorMode: 'blackAndWhite',
      filterSpeckle: 5,
      curveFitting: 'spline',
    },
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Preserve pixel edges',
    icon: 'icon',
    settings: {
      complexity: 1.0,
      colorSimplification: 0.2,
      pathSmoothing: 0,
      usePotrace: false,
      colorMode: 'colored',
      filterSpeckle: 0,
      curveFitting: 'pixel',
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
    (preset.settings.usePotrace ?? false) === (settings.usePotrace ?? false) &&
    (preset.settings.colorMode ?? 'colored') === (settings.colorMode ?? 'colored') &&
    (preset.settings.filterSpeckle ?? 0) === (settings.filterSpeckle ?? 0) &&
    (preset.settings.curveFitting ?? 'spline') === (settings.curveFitting ?? 'spline')
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
  const colorModeLabel = settings.colorMode === 'blackAndWhite' ? 'B&W' : 'Color'
  const curveModeLabel = settings.curveFitting === 'polygon' ? 'Poly' : settings.curveFitting === 'pixel' ? 'Pix' : 'Spln'
  const newPreset: ConversionPreset = {
    id: `custom-${Date.now()}`,
    name,
    description: `Custom: ${colorModeLabel}, ${curveModeLabel}, C${Math.round(settings.complexity * 100)}%`,
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

/**
 * Export custom presets as JSON string
 */
export function exportPresetsAsJSON(): string {
  const customPresets = loadCustomPresets()
  return JSON.stringify(customPresets, null, 2)
}

/**
 * Import presets from JSON string
 * Returns the number of presets imported
 */
export function importPresetsFromJSON(jsonString: string): { imported: number; errors: string[] } {
  const errors: string[] = []
  let imported = 0
  
  try {
    const presets = JSON.parse(jsonString)
    
    if (!Array.isArray(presets)) {
      return { imported: 0, errors: ['Invalid format: expected an array of presets'] }
    }
    
    const existingPresets = loadCustomPresets()
    const existingIds = new Set(existingPresets.map(p => p.id))
    const existingNames = new Set(existingPresets.map(p => p.name.toLowerCase()))
    
    const newPresets: ConversionPreset[] = []
    
    for (const preset of presets) {
      // Validate preset structure
      if (!preset.name || typeof preset.name !== 'string') {
        errors.push(`Skipped preset: missing or invalid name`)
        continue
      }
      
      if (!preset.settings || typeof preset.settings !== 'object') {
        errors.push(`Skipped "${preset.name}": missing or invalid settings`)
        continue
      }
      
      const { complexity, colorSimplification, pathSmoothing } = preset.settings
      if (typeof complexity !== 'number' || typeof colorSimplification !== 'number' || typeof pathSmoothing !== 'number') {
        errors.push(`Skipped "${preset.name}": invalid settings values`)
        continue
      }
      
      // Skip if preset with same name already exists
      if (existingNames.has(preset.name.toLowerCase())) {
        errors.push(`Skipped "${preset.name}": preset with same name already exists`)
        continue
      }
      
      // Generate unique ID using crypto.randomUUID if available, with fallback
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? `custom-${crypto.randomUUID()}`
        : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      
      // Generate new ID to avoid conflicts
      const newPreset: ConversionPreset = {
        id: uniqueId,
        name: preset.name,
        description: preset.description || `Imported preset`,
        icon: 'custom',
        settings: {
          complexity: Math.max(0, Math.min(1, complexity)),
          colorSimplification: Math.max(0, Math.min(1, colorSimplification)),
          pathSmoothing: Math.max(0, Math.min(1, pathSmoothing)),
          usePotrace: Boolean(preset.settings.usePotrace),
          colorMode: preset.settings.colorMode === 'blackAndWhite' ? 'blackAndWhite' : 'colored',
          filterSpeckle: Math.max(0, Math.min(50, preset.settings.filterSpeckle ?? 0)),
          curveFitting: ['spline', 'polygon', 'pixel'].includes(preset.settings.curveFitting) 
            ? preset.settings.curveFitting 
            : 'spline',
          cornerThreshold: Math.max(0, Math.min(180, preset.settings.cornerThreshold ?? 90)),
        },
        isCustom: true,
      }
      
      newPresets.push(newPreset)
      imported++
    }
    
    if (newPresets.length > 0) {
      const updatedPresets = [...existingPresets, ...newPresets]
      localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets))
    }
    
  } catch (error) {
    return { imported: 0, errors: ['Failed to parse JSON: ' + (error instanceof Error ? error.message : 'Unknown error')] }
  }
  
  return { imported, errors }
}
