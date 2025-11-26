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
let potraceModule: typeof import('esm-potrace-wasm') | null = null

async function loadPotrace() {
  if (!potraceModule) {
    potraceModule = await import('esm-potrace-wasm')
  }
  return potraceModule
}

export interface PotraceOptions {
  // Turn policy: how to resolve ambiguities in path decomposition
  turnPolicy?: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority'
  // Threshold for converting to black/white (0-255)
  threshold?: number
  // Suppress speckles of up to this size
  turdSize?: number
  // Corner threshold (higher = smoother)
  alphaMax?: number
  // Optimize paths for better curves
  optCurve?: boolean
  // Tolerance for curve optimization
  optTolerance?: number
}

/**
 * Convert settings to Potrace options
 */
function settingsToPotraceOptions(settings: ConversionSettings): PotraceOptions {
  // Map our 0-1 settings to Potrace parameters
  const { complexity, colorSimplification, pathSmoothing } = settings

  return {
    // Turn policy: minority for complex images, majority for simpler
    turnPolicy: complexity > 0.5 ? 'minority' : 'majority',
    
    // Threshold: Use middle value for auto, adjust based on color simplification
    threshold: Math.floor(128 + (colorSimplification - 0.5) * 50),
    
    // Turd size: Remove smaller noise for higher simplification
    turdSize: Math.floor(2 + (1 - complexity) * 10),
    
    // Alpha max: Higher for smoother paths
    alphaMax: 0.5 + pathSmoothing * 0.8,
    
    // Always optimize curves
    optCurve: true,
    
    // Tolerance: Higher for more aggressive optimization
    optTolerance: 0.1 + (1 - complexity) * 0.3,
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
  
  // Convert ImageData to bitmap format expected by Potrace
  const { width, height, data } = imageData
  
  // Potrace works with monochrome images, so we need to handle colors separately
  // For a single color conversion, we'll use luminance-based thresholding
  const bitmap = new Uint8Array(width * height)
  const threshold = options.threshold ?? 128
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    
    // Calculate luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    // If transparent or above threshold, mark as white (0), else black (1)
    bitmap[i / 4] = (a < 128 || luminance > threshold) ? 0 : 1
  }
  
  // Trace the bitmap
  const svg = await potrace.trace({
    data: bitmap,
    width,
    height,
  }, {
    turnpolicy: options.turnPolicy || 'minority',
    turdsize: options.turdSize || 2,
    alphamax: options.alphaMax || 1.0,
    opticurve: options.optCurve ?? true,
    opttolerance: options.optTolerance || 0.2,
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
  
  const { width, height, data } = imageData
  
  onProgress?.(5)
  
  // Step 1: Quantize colors
  const colorCount = Math.max(2, Math.floor(16 - settings.colorSimplification * 14))
  const quantizedColors = quantizeColorsMedianCut(data, colorCount)
  
  onProgress?.(20)
  
  // Step 2: Create color layers and trace each
  const paths: string[] = []
  const totalColors = quantizedColors.length
  
  for (let i = 0; i < quantizedColors.length; i++) {
    const color = quantizedColors[i]
    const colorHex = rgbToHex(color.r, color.g, color.b)
    
    // Create bitmap for this color
    const bitmap = new Uint8Array(width * height)
    
    for (let j = 0; j < data.length; j += 4) {
      const r = data[j]
      const g = data[j + 1]
      const b = data[j + 2]
      const a = data[j + 3]
      
      // Check if pixel matches this color (with tolerance)
      const tolerance = 30
      const matches = a > 128 &&
        Math.abs(r - color.r) < tolerance &&
        Math.abs(g - color.g) < tolerance &&
        Math.abs(b - color.b) < tolerance
      
      bitmap[j / 4] = matches ? 1 : 0
    }
    
    // Skip if no pixels match
    const hasPixels = bitmap.some(v => v === 1)
    if (!hasPixels) continue
    
    try {
      // Trace this color layer
      const svg = await potrace.trace({
        data: bitmap,
        width,
        height,
      }, {
        turnpolicy: options.turnPolicy || 'minority',
        turdsize: options.turdSize || 2,
        alphamax: options.alphaMax || 1.0,
        opticurve: options.optCurve ?? true,
        opttolerance: options.optTolerance || 0.2,
      })
      
      // Extract path from SVG and add color
      const pathMatch = svg.match(/<path[^>]*d="([^"]+)"[^>]*>/g)
      if (pathMatch) {
        pathMatch.forEach(pathStr => {
          const dMatch = pathStr.match(/d="([^"]+)"/)
          if (dMatch) {
            paths.push(`<path d="${dMatch[1]}" fill="${colorHex}" />`)
          }
        })
      }
    } catch (error) {
      console.warn(`Failed to trace color layer ${colorHex}:`, error)
    }
    
    onProgress?.(20 + Math.floor((i / totalColors) * 70))
  }
  
  onProgress?.(95)
  
  // Combine all paths into final SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${paths.join('\n  ')}
</svg>`
  
  onProgress?.(100)
  
  return svg
}

/**
 * Median-cut color quantization for better color palette extraction
 */
function quantizeColorsMedianCut(
  data: Uint8ClampedArray,
  numColors: number
): Array<{ r: number; g: number; b: number }> {
  // Collect all non-transparent pixels
  const pixels: Array<{ r: number; g: number; b: number }> = []
  
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 128) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      })
    }
  }
  
  if (pixels.length === 0) {
    return [{ r: 255, g: 255, b: 255 }]
  }
  
  // Simple median-cut implementation
  const boxes: Array<typeof pixels> = [pixels]
  
  while (boxes.length < numColors) {
    // Find box with largest range
    let maxRange = 0
    let maxIndex = 0
    let maxChannel: 'r' | 'g' | 'b' = 'r'
    
    boxes.forEach((box, index) => {
      if (box.length < 2) return
      
      (['r', 'g', 'b'] as const).forEach(channel => {
        const values = box.map(p => p[channel])
        const range = Math.max(...values) - Math.min(...values)
        if (range > maxRange) {
          maxRange = range
          maxIndex = index
          maxChannel = channel
        }
      })
    })
    
    if (maxRange === 0) break
    
    // Split the box
    const box = boxes[maxIndex]
    box.sort((a, b) => a[maxChannel] - b[maxChannel])
    const mid = Math.floor(box.length / 2)
    
    boxes.splice(maxIndex, 1, box.slice(0, mid), box.slice(mid))
  }
  
  // Calculate average color for each box
  return boxes.map(box => {
    if (box.length === 0) return { r: 128, g: 128, b: 128 }
    
    const sum = box.reduce(
      (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
      { r: 0, g: 0, b: 0 }
    )
    
    return {
      r: Math.round(sum.r / box.length),
      g: Math.round(sum.g / box.length),
      b: Math.round(sum.b / box.length),
    }
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
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
