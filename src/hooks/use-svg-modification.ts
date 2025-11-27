import { useState, useCallback } from 'react'

export interface SvgModificationOptions {
  removePotraceBlocks?: boolean
  simplifyPaths?: boolean
  optimizeGroups?: boolean
  removeEmptyElements?: boolean
  customTransform?: (svg: string) => string
}

/**
 * Parse and extract info from SVG for post-processing
 */
function parseSvgInfo(svg: string): {
  hasPotraceOutput: boolean
  pathCount: number
  groupCount: number
  hasEmptyElements: boolean
} {
  const hasPotraceOutput = svg.includes('potrace') || 
                           svg.includes('path') && svg.includes('fill=') ||
                           svg.includes('<g id="');
  const pathCount = (svg.match(/<path/g) || []).length
  const groupCount = (svg.match(/<g/g) || []).length
  const hasEmptyElements = svg.includes('<g></g>') || svg.includes('<g/>') || 
                           svg.includes('<path d=""/>') || svg.includes('<path d="" ')

  return {
    hasPotraceOutput,
    pathCount,
    groupCount,
    hasEmptyElements,
  }
}

/**
 * Remove color blocks from potrace-generated SVG by merging similar adjacent paths
 * This creates a more simplified SVG with fewer distinct color regions
 */
function removeColorBlocks(svg: string, threshold = 20): string {
  // Extract the SVG content
  const svgMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  if (!svgMatch) return svg
  
  const svgAttrs = svg.match(/<svg([^>]*)>/i)?.[1] || ''
  const content = svgMatch[1]
  
  // Parse all paths with their colors
  const pathRegex = /<path[^>]*fill="([^"]*)"[^>]*d="([^"]*)"[^>]*\/?>/gi
  const paths: Array<{ fill: string; d: string; original: string }> = []
  let match
  
  while ((match = pathRegex.exec(content)) !== null) {
    paths.push({
      fill: match[1],
      d: match[2],
      original: match[0],
    })
  }
  
  if (paths.length === 0) return svg
  
  // Parse RGB values and group similar colors
  const parseColor = (color: string): [number, number, number] | null => {
    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])]
    }
    const hexMatch = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
    if (hexMatch) {
      return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)]
    }
    return null
  }
  
  const colorDistance = (c1: [number, number, number], c2: [number, number, number]): number => {
    return Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2)
    )
  }
  
  // Group similar colors
  const colorGroups: Map<string, string[]> = new Map()
  
  paths.forEach((path) => {
    const color = parseColor(path.fill)
    if (!color) {
      // Keep non-parseable colors as is
      if (!colorGroups.has(path.fill)) {
        colorGroups.set(path.fill, [])
      }
      colorGroups.get(path.fill)!.push(path.d)
      return
    }
    
    // Find a similar existing color or create a new group
    let foundGroup = false
    for (const [existingFill] of colorGroups) {
      const existingColor = parseColor(existingFill)
      if (existingColor && colorDistance(color, existingColor) < threshold) {
        colorGroups.get(existingFill)!.push(path.d)
        foundGroup = true
        break
      }
    }
    
    if (!foundGroup) {
      colorGroups.set(path.fill, [path.d])
    }
  })
  
  // Generate simplified SVG
  const newPaths = Array.from(colorGroups.entries()).map(([fill, dValues]) => {
    const combinedD = dValues.join(' ')
    return `  <path fill="${fill}" d="${combinedD}" />`
  })
  
  return `<svg${svgAttrs}>\n${newPaths.join('\n')}\n</svg>`
}

/**
 * Remove empty elements from SVG
 */
function removeEmptyElements(svg: string): string {
  return svg
    .replace(/<g>\s*<\/g>/g, '')
    .replace(/<g\/>/g, '')
    .replace(/<path\s+d=""\s*\/?>/g, '')
    .replace(/<path\s+[^>]*d=""\s*[^>]*\/?>/g, '')
    .replace(/\n\s*\n/g, '\n')
}

/**
 * Simplify path data by reducing decimal precision
 */
function simplifyPaths(svg: string, precision = 2): string {
  return svg.replace(
    /(\d+\.\d{3,})/g,
    (match) => parseFloat(match).toFixed(precision)
  )
}

/**
 * Remove unnecessary nested groups
 */
function optimizeGroups(svg: string): string {
  // Remove groups that only contain a single child
  let result = svg
  let changed = true
  
  while (changed) {
    const before = result
    result = result.replace(
      /<g([^>]*)>\s*(<(?:path|circle|rect|polygon|polyline|ellipse|line)[^>]*\/?>\s*)<\/g>/gi,
      (_, attrs, child) => {
        // Transfer group attributes to child if no conflicts
        if (!attrs.trim()) return child.trim()
        return `<g${attrs}>${child}</g>`
      }
    )
    changed = before !== result
  }
  
  return result
}

export function useSvgModification() {
  const [isProcessing, setIsProcessing] = useState(false)

  const getSvgInfo = useCallback((svg: string) => {
    return parseSvgInfo(svg)
  }, [])

  const modifySvg = useCallback((svg: string, options: SvgModificationOptions): string => {
    setIsProcessing(true)
    
    try {
      let result = svg
      
      if (options.removePotraceBlocks) {
        result = removeColorBlocks(result)
      }
      
      if (options.removeEmptyElements) {
        result = removeEmptyElements(result)
      }
      
      if (options.simplifyPaths) {
        result = simplifyPaths(result)
      }
      
      if (options.optimizeGroups) {
        result = optimizeGroups(result)
      }
      
      if (options.customTransform) {
        result = options.customTransform(result)
      }
      
      return result
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    isProcessing,
    getSvgInfo,
    modifySvg,
    removeColorBlocks,
    removeEmptyElements,
    simplifyPaths,
    optimizeGroups,
  }
}
