import { useState, useCallback } from 'react'

export interface SvgModificationOptions {
  removePotraceBlocks?: boolean
  simplifyPaths?: boolean
  optimizeGroups?: boolean
  removeEmptyElements?: boolean
  removeBackground?: boolean
  removeDarkBackground?: boolean  // Also remove dark/black backgrounds
  addBorder?: {
    type: 'rounded' | 'circle'
    color: string
    strokeWidth: number
    padding: number
  }
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
  // Match numbers with 2+ decimal places for consistent simplification
  return svg.replace(
    /(\d+\.\d{2,})/g,
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
  let iterations = 0
  const MAX_ITERATIONS = 100 // Prevent infinite loops on malformed SVG

  while (changed && iterations < MAX_ITERATIONS) {
    iterations++
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

/**
 * Remove background from SVG by identifying and removing background-like elements
 * Background elements are typically:
 * 1. The first/largest rectangle covering the entire viewBox
 * 2. Elements with fill colors close to white/light gray
 * 3. Elements with fill="white" or fill="#fff*"
 * 4. Circles, ellipses, or polygons that cover the full area
 * @param svg - The SVG string to process
 * @param includeDark - Also remove dark/black backgrounds
 */
function removeBackground(svg: string, includeDark = false): string {
  // Parse SVG dimensions
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/i)
  const widthMatch = svg.match(/width=["']([^"']+)["']/i)
  const heightMatch = svg.match(/height=["']([^"']+)["']/i)
  
  let svgWidth = 0
  let svgHeight = 0
  let viewBoxX = 0
  let viewBoxY = 0
  
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/)
    viewBoxX = parseFloat(parts[0]) || 0
    viewBoxY = parseFloat(parts[1]) || 0
    svgWidth = parseFloat(parts[2]) || 0
    svgHeight = parseFloat(parts[3]) || 0
  } else if (widthMatch && heightMatch) {
    svgWidth = parseFloat(widthMatch[1]) || 0
    svgHeight = parseFloat(heightMatch[1]) || 0
  }
  
  // Thresholds for considering a color as "background"
  const LIGHT_THRESHOLD = 240  // Near-white (lowered from 245 to catch more light backgrounds)
  const DARK_THRESHOLD = 15    // Near-black (raised from 10 to catch more dark backgrounds)

  // Check if a color is a background-like color
  const isBackgroundColor = (color: string): boolean => {
    if (!color) return false

    const normalizedColor = color.toLowerCase().replace(/\s/g, '')

    // Common light background colors
    const lightBgColors = ['white', '#fff', '#ffffff', '#fefefe', '#fafafa', '#f0f0f0', '#efefef', '#e0e0e0', 'rgb(255,255,255)', 'rgb(254,254,254)', 'rgb(250,250,250)', 'rgb(240,240,240)']
    if (lightBgColors.includes(normalizedColor)) return true

    // Common dark background colors (only check if includeDark is true)
    if (includeDark) {
      const darkBgColors = ['black', '#000', '#000000', '#111', '#111111', '#0a0a0a', '#0f0f0f', 'rgb(0,0,0)', 'rgb(10,10,10)', 'rgb(15,15,15)']
      if (darkBgColors.includes(normalizedColor)) return true
    }

    // Parse color to RGB for threshold checks
    let r = -1, g = -1, b = -1

    // Check for RGB format
    const rgbMatch = normalizedColor.match(/rgb\((\d+),(\d+),(\d+)\)/i)
    if (rgbMatch) {
      r = Number(rgbMatch[1])
      g = Number(rgbMatch[2])
      b = Number(rgbMatch[3])
    }

    // Check 6-character hex colors
    const hexMatch = normalizedColor.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
    if (hexMatch) {
      r = parseInt(hexMatch[1], 16)
      g = parseInt(hexMatch[2], 16)
      b = parseInt(hexMatch[3], 16)
    }

    // Check 3-character short hex colors like #fff
    const shortHexMatch = normalizedColor.match(/#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
    if (shortHexMatch) {
      r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16)
      g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16)
      b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16)
    }

    // If color was parsed successfully
    if (r >= 0) {
      // Check for light backgrounds
      if (r >= LIGHT_THRESHOLD && g >= LIGHT_THRESHOLD && b >= LIGHT_THRESHOLD) return true

      // Check for dark backgrounds (only if includeDark is true)
      if (includeDark && r <= DARK_THRESHOLD && g <= DARK_THRESHOLD && b <= DARK_THRESHOLD) return true
    }

    return false
  }
  
  // Check if a rect covers the full SVG area
  const isFullCoverRect = (rectStr: string): boolean => {
    // Check for 100% dimensions first (common in some SVG generators)
    if (rectStr.includes('width="100%"') && rectStr.includes('height="100%"')) {
      return true
    }

    const xMatch = rectStr.match(/\bx=["']([^"']+)["']/i)
    const yMatch = rectStr.match(/\by=["']([^"']+)["']/i)
    const wMatch = rectStr.match(/\bwidth=["']([^"']+)["']/i)
    const hMatch = rectStr.match(/\bheight=["']([^"']+)["']/i)

    const x = xMatch ? parseFloat(xMatch[1]) : 0
    const y = yMatch ? parseFloat(yMatch[1]) : 0
    const w = wMatch ? parseFloat(wMatch[1]) : 0
    const h = hMatch ? parseFloat(hMatch[1]) : 0

    // If rect starts at/near viewBox origin and covers most of the SVG (90%+ instead of 95%)
    // Lowered threshold to catch more realistic background cases
    if (svgWidth > 0 && svgHeight > 0) {
      const xThreshold = Math.max(5, svgWidth * 0.05) // Allow 5px or 5% margin
      const yThreshold = Math.max(5, svgHeight * 0.05)
      if (x <= viewBoxX + xThreshold && y <= viewBoxY + yThreshold && 
          w >= svgWidth * 0.9 && h >= svgHeight * 0.9) {
        return true
      }
    }
    return false
  }

  // Check if a circle or ellipse covers most of the SVG area
  const isFullCoverCircle = (circleStr: string): boolean => {
    const cxMatch = circleStr.match(/\bcx=["']([^"']+)["']/i)
    const cyMatch = circleStr.match(/\bcy=["']([^"']+)["']/i)
    const rMatch = circleStr.match(/\br=["']([^"']+)["']/i)
    const rxMatch = circleStr.match(/\brx=["']([^"']+)["']/i)
    const ryMatch = circleStr.match(/\bry=["']([^"']+)["']/i)

    const cx = cxMatch ? parseFloat(cxMatch[1]) : 0
    const cy = cyMatch ? parseFloat(cyMatch[1]) : 0
    const r = rMatch ? parseFloat(rMatch[1]) : 0
    const rx = rxMatch ? parseFloat(rxMatch[1]) : r
    const ry = ryMatch ? parseFloat(ryMatch[1]) : r

    if (svgWidth > 0 && svgHeight > 0 && (r > 0 || (rx > 0 && ry > 0))) {
      // Check if circle is centered and radius covers most of the SVG
      const centerX = viewBoxX + svgWidth / 2
      const centerY = viewBoxY + svgHeight / 2
      const maxRadius = Math.max(svgWidth, svgHeight) / 2

      // Allow 10% margin for circle detection
      if (Math.abs(cx - centerX) < svgWidth * 0.1 && 
          Math.abs(cy - centerY) < svgHeight * 0.1 &&
          (r >= maxRadius * 0.85 || (rx >= svgWidth * 0.85 / 2 && ry >= svgHeight * 0.85 / 2))) {
        return true
      }
    }
    return false
  }
  
  let result = svg
  let changesMade = false
  
  // Remove full-coverage rectangles with background colors
  result = result.replace(
    /<rect[^>]*>/gi,
    (match) => {
      const fillMatch = match.match(/fill=["']([^"']+)["']/i)
      const fill = fillMatch ? fillMatch[1] : ''
      
      if (isBackgroundColor(fill) && isFullCoverRect(match)) {
        changesMade = true
        return '' // Remove the background rect
      }
      return match
    }
  )
  
  // Remove full-coverage circles and ellipses with background colors
  result = result.replace(
    /<(circle|ellipse)[^>]*>/gi,
    (match) => {
      const fillMatch = match.match(/fill=["']([^"']+)["']/i)
      const fill = fillMatch ? fillMatch[1] : ''
      
      if (isBackgroundColor(fill) && isFullCoverCircle(match)) {
        changesMade = true
        return '' // Remove the background circle/ellipse
      }
      return match
    }
  )
  
  // Also check for path elements that might be background rectangles
  // (some converters use paths instead of rects)
  result = result.replace(
    /<path[^>]*d=["']([^"']+)["'][^>]*>/gi,
    (match, dAttr) => {
      const fillMatch = match.match(/fill=["']([^"']+)["']/i)
      const fill = fillMatch ? fillMatch[1] : ''
      
      // Check if the path is a simple rectangle covering the full area
      // Simple rectangular paths have patterns like "M0 0H{width}V{height}H0Z" or similar
      const isRectPath = /^M\s*[\d.-]+[\s,]+[\d.-]+[\s,]*[HhLlVv].*[HhLlVv].*[Zz]?\s*$/i.test(dAttr.trim())
      
      if (isBackgroundColor(fill) && isRectPath) {
        // Check if path data suggests it covers most of the SVG by examining bounds
        const coords = dAttr.match(/[\d.]+/g)?.map(parseFloat) || []
        if (coords.length >= 4 && svgWidth > 0 && svgHeight > 0) {
          // Extract approximate bounds from coordinates
          const xCoords = coords.filter((_, i) => i % 2 === 0)
          const yCoords = coords.filter((_, i) => i % 2 === 1)
          const minX = Math.min(...xCoords)
          const maxX = Math.max(...xCoords)
          const minY = Math.min(...yCoords)
          const maxY = Math.max(...yCoords)
          const pathWidth = maxX - minX
          const pathHeight = maxY - minY
          
          // Check if path covers most of the SVG (90%+)
          if (pathWidth >= svgWidth * 0.9 && pathHeight >= svgHeight * 0.9) {
            changesMade = true
            return '' // Remove the background path
          }
        }
      }
      return match
    }
  )
  
  // Remove background polygons (less common but still worth checking)
  result = result.replace(
    /<polygon[^>]*>/gi,
    (match) => {
      const fillMatch = match.match(/fill=["']([^"']+)["']/i)
      const fill = fillMatch ? fillMatch[1] : ''
      const pointsMatch = match.match(/points=["']([^"']+)["']/i)
      
      if (isBackgroundColor(fill) && pointsMatch && svgWidth > 0 && svgHeight > 0) {
        const points = pointsMatch[1].split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
        if (points.length >= 6) { // At least 3 points (x,y pairs)
          // Check if polygon covers most of the SVG by checking bounds
          const xCoords = points.filter((_, i) => i % 2 === 0)
          const yCoords = points.filter((_, i) => i % 2 === 1)
          const minX = Math.min(...xCoords)
          const maxX = Math.max(...xCoords)
          const minY = Math.min(...yCoords)
          const maxY = Math.max(...yCoords)
          
          const polyWidth = maxX - minX
          const polyHeight = maxY - minY
          
          if (polyWidth >= svgWidth * 0.85 && polyHeight >= svgHeight * 0.85) {
            changesMade = true
            return '' // Remove the background polygon
          }
        }
      }
      return match
    }
  )
  
  // Clean up any resulting empty lines
  result = result.replace(/\n\s*\n/g, '\n')
  
  return result
}

/**
 * Add a decorative border around the SVG content
 */
function addBorder(
  svg: string, 
  borderType: 'rounded' | 'circle', 
  color: string, 
  strokeWidth: number,
  padding: number
): string {
  // Parse SVG dimensions
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/i)
  const widthMatch = svg.match(/width=["']([^"']+)["']/i)
  const heightMatch = svg.match(/height=["']([^"']+)["']/i)
  
  let svgWidth = 0
  let svgHeight = 0
  let viewBoxX = 0
  let viewBoxY = 0
  
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/)
    viewBoxX = parseFloat(parts[0]) || 0
    viewBoxY = parseFloat(parts[1]) || 0
    svgWidth = parseFloat(parts[2]) || 0
    svgHeight = parseFloat(parts[3]) || 0
  } else if (widthMatch && heightMatch) {
    svgWidth = parseFloat(widthMatch[1]) || 0
    svgHeight = parseFloat(heightMatch[1]) || 0
  }
  
  if (!svgWidth || !svgHeight) return svg
  
  // Calculate new dimensions with padding
  const newViewBoxX = viewBoxX - padding
  const newViewBoxY = viewBoxY - padding
  const newWidth = svgWidth + (padding * 2)
  const newHeight = svgHeight + (padding * 2)
  
  // Create border element
  let borderElement = ''
  const halfStroke = strokeWidth / 2
  
  if (borderType === 'circle') {
    const centerX = viewBoxX + svgWidth / 2
    const centerY = viewBoxY + svgHeight / 2
    const radius = Math.max(svgWidth, svgHeight) / 2 + padding - halfStroke
    borderElement = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`
  } else {
    // Rounded rectangle
    const cornerRadius = Math.min(svgWidth, svgHeight) * 0.1 // 10% corner radius
    borderElement = `<rect x="${newViewBoxX + halfStroke}" y="${newViewBoxY + halfStroke}" width="${newWidth - strokeWidth}" height="${newHeight - strokeWidth}" rx="${cornerRadius}" ry="${cornerRadius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`
  }
  
  // Update viewBox and add border
  let result = svg
  
  // Update viewBox
  if (viewBoxMatch) {
    result = result.replace(
      /viewBox=["'][^"']+["']/i,
      `viewBox="${newViewBoxX} ${newViewBoxY} ${newWidth} ${newHeight}"`
    )
  } else {
    // Add viewBox if missing
    result = result.replace(
      /<svg/i,
      `<svg viewBox="${newViewBoxX} ${newViewBoxY} ${newWidth} ${newHeight}"`
    )
  }
  
  // Update width/height if present
  if (widthMatch) {
    result = result.replace(/width=["'][^"']+["']/i, `width="${newWidth}"`)
  }
  if (heightMatch) {
    result = result.replace(/height=["'][^"']+["']/i, `height="${newHeight}"`)
  }
  
  // Insert border element at the beginning of SVG content
  result = result.replace(
    /(<svg[^>]*>)/i,
    `$1\n  ${borderElement}`
  )
  
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
      
      // Remove background first (before other operations)
      if (options.removeBackground) {
        result = removeBackground(result, options.removeDarkBackground)
      }
      
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
      
      // Add border last (after all other operations)
      if (options.addBorder) {
        result = addBorder(
          result, 
          options.addBorder.type, 
          options.addBorder.color, 
          options.addBorder.strokeWidth,
          options.addBorder.padding
        )
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
    removeBackground,
    addBorder,
  }
}
