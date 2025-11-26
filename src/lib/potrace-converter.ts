/**
 * Potrace-based Image to SVG Converter
 * 
 * Uses the Potrace algorithm via WebAssembly for professional-grade
 * bitmap tracing. Potrace is the industry-standard algorithm used by
 * Inkscape and other vector graphics tools.
 * 
 * Features:
 * - High-quality bitmap tracing
 * - WASM-accelerated for 5-10x speedup
 * - Produces clean, optimized SVG paths
 * - Better curve fitting than basic contour tracing
 */

import type { ConversionSettings } from './converter'

// Dynamic import for WASM module
let potraceModule: {
  potrace: (imageData: ImageData, options: Record<string, unknown>) => Promise<string>
  init: () => Promise<void>
} | null = null
let initialized = false

async function loadPotrace() {
  if (!potraceModule) {
    const module = await import('esm-potrace-wasm')
    potraceModule = module
  }
  if (!initialized) {
    await potraceModule.init()
    initialized = true
  }
  return potraceModule
}

export interface PotraceOptions {
  // Turn policy: how to resolve ambiguities in path decomposition (0-4)
  turnpolicy?: number
  // Suppress speckles of up to this size
  turdsize?: number
  // Corner threshold (higher = smoother)
  alphamax?: number
  // Optimize paths for better curves
  opticurve?: number
  // Tolerance for curve optimization
  opttolerance?: number
  // Extract colors from the image
  extractcolors?: boolean
  // Posterize level for color quantization
  posterizelevel?: number
}

/**
 * Convert settings to Potrace options
 */
function settingsToPotraceOptions(settings: ConversionSettings): PotraceOptions {
  // Map our 0-1 settings to Potrace parameters
  const { complexity, colorSimplification, pathSmoothing } = settings

  return {
    // Turn policy: 4 = minority (default), use minority for complex images
    // Based on esm-potrace-wasm defaults: turnpolicy:4
    turnpolicy: 4,
    
    // Turd size: Remove smaller noise for higher simplification
    turdsize: Math.floor(2 + (1 - complexity) * 10),
    
    // Alpha max: Higher for smoother paths
    alphamax: 0.5 + pathSmoothing * 0.8,
    
    // Always optimize curves
    opticurve: 1,
    
    // Tolerance: Higher for more aggressive optimization
    opttolerance: 0.1 + (1 - complexity) * 0.3,
    
    // Enable color extraction for multi-color images
    extractcolors: true,
    
    // Posterize level based on color simplification
    posterizelevel: Math.max(2, Math.floor(8 - colorSimplification * 6)),
  }
}

/**
 * Convert image to SVG using Potrace algorithm (single color)
 */
export async function convertWithPotrace(
  imageData: ImageData,
  settings: ConversionSettings
): Promise<string> {
  const potrace = await loadPotrace()
  const options = settingsToPotraceOptions(settings)
  
  // Use pathonly option for single-color tracing
  const svg = await potrace.potrace(imageData, {
    ...options,
    pathonly: false,
    extractcolors: false,
  })
  
  return svg
}

/**
 * Convert image to SVG using Potrace with color layer separation
 * This produces higher quality results for colored images
 */
export async function convertWithPotraceMultiColor(
  imageData: ImageData,
  settings: ConversionSettings,
  onProgress?: (progress: number) => void
): Promise<string> {
  const potrace = await loadPotrace()
  const options = settingsToPotraceOptions(settings)
  
  onProgress?.(5)
  
  // Use potrace's built-in multi-color support
  const svg = await potrace.potrace(imageData, {
    ...options,
    pathonly: false,
    extractcolors: true,
  })
  
  onProgress?.(100)
  
  return svg
}

/**
 * Check if Potrace WASM is supported in current environment
 */
export async function isPotraceSupported(): Promise<boolean> {
  // First check if WebAssembly is supported (lightweight check)
  if (typeof WebAssembly !== 'object') {
    return false
  }
  
  try {
    // Check if we can instantiate WASM
    const testModule = new WebAssembly.Module(
      new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
    )
    if (!(testModule instanceof WebAssembly.Module)) {
      return false
    }
    
    // Try loading Potrace module
    await loadPotrace()
    return true
  } catch {
    return false
  }
}
