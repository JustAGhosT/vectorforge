/**
 * SVG Remix Transformations
 * Common refactoring operations for SVG files
 */

export interface BorderOptions {
  strokeWidth?: number
  strokeColor?: string
  borderRadius?: number
  shape?: 'rectangle' | 'circle' | 'rounded'
  padding?: number
}

export interface BackgroundOptions {
  remove?: boolean
  removeDark?: boolean  // Also remove dark/black backgrounds
  color?: string
  opacity?: number
}

export interface PathBorderOptions {
  strokeWidth?: number
  strokeColor?: string
  strokeLinecap?: 'butt' | 'round' | 'square'
  strokeLinejoin?: 'miter' | 'round' | 'bevel'
}

export interface ShadowOptions {
  offsetX?: number
  offsetY?: number
  blur?: number
  color?: string
}

export interface TransformOptions {
  scale?: number
  rotate?: number
  flipX?: boolean
  flipY?: boolean
}

/**
 * Get SVG viewBox dimensions
 */
function getSvgDimensions(svg: string): { width: number; height: number; viewBox: string } | null {
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/)
  if (viewBoxMatch) {
    // viewBox format is "minX minY width height"
    const [minX, minY, w, h] = viewBoxMatch[1].split(/\s+/).map(Number)
    return { width: w, height: h, viewBox: viewBoxMatch[1] }
  }
  
  const widthMatch = svg.match(/width=["'](\d+)(?:px)?["']/)
  const heightMatch = svg.match(/height=["'](\d+)(?:px)?["']/)
  if (widthMatch && heightMatch) {
    const w = parseInt(widthMatch[1])
    const h = parseInt(heightMatch[1])
    return { width: w, height: h, viewBox: `0 0 ${w} ${h}` }
  }
  
  return null
}

/**
 * Add a border around the SVG content
 */
export function addBorder(svg: string, options: BorderOptions = {}): string {
  const {
    strokeWidth = 2,
    strokeColor = '#000000',
    borderRadius = 0,
    shape = 'rectangle',
    padding = 10,
  } = options

  const dims = getSvgDimensions(svg)
  if (!dims) return svg

  const { width, height } = dims
  const newWidth = width + padding * 2
  const newHeight = height + padding * 2
  
  // Extract SVG content
  const contentMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  if (!contentMatch) return svg
  
  const content = contentMatch[1]
  
  let borderElement = ''
  if (shape === 'circle') {
    const cx = newWidth / 2
    const cy = newHeight / 2
    const radius = Math.min(newWidth, newHeight) / 2 - strokeWidth / 2
    borderElement = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`
  } else {
    const rx = shape === 'rounded' ? borderRadius || 8 : 0
    borderElement = `<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${newWidth - strokeWidth}" height="${newHeight - strokeWidth}" rx="${rx}" ry="${rx}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${newWidth} ${newHeight}" width="${newWidth}" height="${newHeight}">
  ${borderElement}
  <g transform="translate(${padding}, ${padding})">
    ${content}
  </g>
</svg>`
}

/**
 * Remove or modify background
 */
export function modifyBackground(svg: string, options: BackgroundOptions = {}): string {
  const { remove = false, removeDark = false, color, opacity = 1 } = options

  if (remove || removeDark) {
    // Get SVG dimensions for calculating coverage
    const dims = getSvgDimensions(svg)
    const svgWidth = dims?.width || 0
    const svgHeight = dims?.height || 0

    // Thresholds for background detection
    const LIGHT_THRESHOLD = 245  // Near-white colors
    const DARK_THRESHOLD = 10    // Near-black colors

    // Check if a color is a background-like color
    const isBackgroundColor = (fillColor: string): boolean => {
      if (!fillColor) return false

      const normalizedColor = fillColor.toLowerCase().replace(/\s/g, '')

      // Parse color to RGB
      let r = -1, g = -1, b = -1

      // Check named colors
      if (normalizedColor === 'white') { r = 255; g = 255; b = 255 }
      else if (normalizedColor === 'black') { r = 0; g = 0; b = 0 }
      // Common light background colors
      else if (['#fff', '#ffffff', '#fefefe', '#fafafa'].includes(normalizedColor)) { r = 255; g = 255; b = 255 }
      // Common dark background colors
      else if (['#000', '#000000', '#111', '#111111', '#0a0a0a'].includes(normalizedColor)) { r = 0; g = 0; b = 0 }
      else {
        // Parse RGB format
        const rgbMatch = normalizedColor.match(/rgb\((\d+),(\d+),(\d+)\)/i)
        if (rgbMatch) {
          r = Number(rgbMatch[1])
          g = Number(rgbMatch[2])
          b = Number(rgbMatch[3])
        }

        // Parse 6-char hex
        const hexMatch = normalizedColor.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
        if (hexMatch) {
          r = parseInt(hexMatch[1], 16)
          g = parseInt(hexMatch[2], 16)
          b = parseInt(hexMatch[3], 16)
        }

        // Parse 3-char hex
        const shortHexMatch = normalizedColor.match(/#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
        if (shortHexMatch) {
          r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16)
          g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16)
          b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16)
        }
      }

      // Check if color was parsed
      if (r < 0) return false

      // Check for light backgrounds
      if (remove && r > LIGHT_THRESHOLD && g > LIGHT_THRESHOLD && b > LIGHT_THRESHOLD) {
        return true
      }

      // Check for dark backgrounds
      if (removeDark && r < DARK_THRESHOLD && g < DARK_THRESHOLD && b < DARK_THRESHOLD) {
        return true
      }

      return false
    }

    // Check if a rect covers the full SVG area
    const isFullCoverRect = (rectStr: string): boolean => {
      // Check for 100% dimensions first
      if (rectStr.includes('width="100%"') && rectStr.includes('height="100%"')) {
        return true
      }

      // Parse actual pixel dimensions
      const xMatch = rectStr.match(/\bx=["']([^"']+)["']/i)
      const yMatch = rectStr.match(/\by=["']([^"']+)["']/i)
      const wMatch = rectStr.match(/\bwidth=["']([^"']+)["']/i)
      const hMatch = rectStr.match(/\bheight=["']([^"']+)["']/i)

      const x = xMatch ? parseFloat(xMatch[1]) : 0
      const y = yMatch ? parseFloat(yMatch[1]) : 0
      const w = wMatch ? parseFloat(wMatch[1]) : 0
      const h = hMatch ? parseFloat(hMatch[1]) : 0

      // If rect starts at/near 0,0 and covers most of the SVG (95%+)
      if (svgWidth > 0 && svgHeight > 0) {
        if (x <= 1 && y <= 1 && w >= svgWidth * 0.95 && h >= svgHeight * 0.95) {
          return true
        }
      }

      return false
    }

    let result = svg

    // Remove full-coverage rectangles with background colors
    result = result.replace(
      /<rect[^>]*\/?>/gi,
      (match) => {
        const fillMatch = match.match(/fill=["']([^"']+)["']/i)
        const fill = fillMatch ? fillMatch[1] : ''

        if (isBackgroundColor(fill) && isFullCoverRect(match)) {
          return '' // Remove the background rect
        }
        return match
      }
    )

    // Also check for path elements that might be background rectangles
    result = result.replace(
      /<path[^>]*d=["']([^"']+)["'][^>]*>/gi,
      (match, dAttr) => {
        const fillMatch = match.match(/fill=["']([^"']+)["']/i)
        const fill = fillMatch ? fillMatch[1] : ''

        // Check if the path is a simple rectangle pattern
        const isRectPath = /^M\s*0[\s,]+0[\s,]*[HhLl].*[VvLl].*[HhLl].*[Zz]?\s*$/i.test(dAttr.trim())

        if (isBackgroundColor(fill) && isRectPath) {
          return '' // Remove the background path
        }
        return match
      }
    )

    // Clean up any resulting empty lines
    result = result.replace(/\n\s*\n/g, '\n')

    return result
  }

  if (color) {
    const dims = getSvgDimensions(svg)
    if (!dims) return svg

    const contentMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
    if (!contentMatch) return svg

    const svgOpenMatch = svg.match(/<svg[^>]*>/i)
    const bgRect = `<rect x="0" y="0" width="${dims.width}" height="${dims.height}" fill="${color}" opacity="${opacity}" />`

    return svg.replace(svgOpenMatch![0], `${svgOpenMatch![0]}\n  ${bgRect}`)
  }

  return svg
}

/**
 * Add stroke/border to all paths
 */
export function addPathBorder(svg: string, options: PathBorderOptions = {}): string {
  const {
    strokeWidth = 1,
    strokeColor = '#000000',
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
  } = options

  return svg.replace(/<path([^>]*)>/gi, (match, attrs) => {
    // If path already has a stroke attribute (not stroke-width, stroke-dasharray, etc.), don't add another
    // Use word boundary to avoid matching stroke-width, stroke-dasharray, etc.
    if (/\bstroke\s*=/.test(attrs)) {
      return match
    }
    return `<path${attrs} stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}">`
  })
}

/**
 * Add drop shadow effect
 */
export function addShadow(svg: string, options: ShadowOptions = {}): string {
  const {
    offsetX = 2,
    offsetY = 2,
    blur = 4,
    color = 'rgba(0,0,0,0.3)',
  } = options
  
  const filterId = `drop-shadow-${Date.now()}`
  
  const filterDef = `
  <defs>
    <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="${offsetX}" dy="${offsetY}" stdDeviation="${blur}" flood-color="${color}" />
    </filter>
  </defs>`
  
  // Add filter definition after opening svg tag
  const svgOpenMatch = svg.match(/<svg[^>]*>/i)
  if (!svgOpenMatch) return svg
  
  let result = svg.replace(svgOpenMatch[0], `${svgOpenMatch[0]}${filterDef}`)
  
  // Apply filter to all top-level groups or paths
  result = result.replace(/<(g|path)([^>]*)>/gi, (match, tag, attrs) => {
    if (attrs.includes('filter=')) {
      return match
    }
    return `<${tag}${attrs} filter="url(#${filterId})">`
  })
  
  return result
}

/**
 * Apply transformation to SVG
 */
export function applyTransform(svg: string, options: TransformOptions = {}): string {
  const { scale = 1, rotate = 0, flipX = false, flipY = false } = options

  // Validate scale bounds (prevent extreme values)
  const safeScale = Math.max(0.1, Math.min(10, scale))

  // Normalize rotation to 0-360 range
  const safeRotate = ((rotate % 360) + 360) % 360

  const dims = getSvgDimensions(svg)
  if (!dims) return svg

  const contentMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  if (!contentMatch) return svg
  
  const content = contentMatch[1]
  const { width, height } = dims
  
  const transforms: string[] = []

  // Center for rotation and flipping
  const cx = width / 2
  const cy = height / 2

  if (safeRotate !== 0) {
    transforms.push(`rotate(${safeRotate} ${cx} ${cy})`)
  }

  if (safeScale !== 1) {
    transforms.push(`translate(${cx} ${cy}) scale(${safeScale}) translate(${-cx} ${-cy})`)
  }
  
  if (flipX) {
    transforms.push(`translate(${width} 0) scale(-1 1)`)
  }
  
  if (flipY) {
    transforms.push(`translate(0 ${height}) scale(1 -1)`)
  }
  
  if (transforms.length === 0) return svg
  
  const svgOpenMatch = svg.match(/<svg([^>]*)>/i)
  if (!svgOpenMatch) return svg
  
  return `<svg${svgOpenMatch[1]}>
  <g transform="${transforms.join(' ')}">
    ${content}
  </g>
</svg>`
}

/**
 * Convert colors to grayscale
 */
export function convertToGrayscale(svg: string): string {
  const colorRegex = /(fill|stroke)=["'](#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))["']/gi
  
  return svg.replace(colorRegex, (match, attr, color) => {
    let r = 0, g = 0, b = 0
    
    if (color.startsWith('#')) {
      // Hex color
      const hex = color.slice(1)
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
      }
    } else if (color.startsWith('rgb')) {
      const rgbMatch = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
      if (rgbMatch) {
        r = parseInt(rgbMatch[1])
        g = parseInt(rgbMatch[2])
        b = parseInt(rgbMatch[3])
      }
    }
    
    // Convert to grayscale using luminosity method
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    const grayHex = gray.toString(16).padStart(2, '0')
    
    return `${attr}="#${grayHex}${grayHex}${grayHex}"`
  })
}

/**
 * Invert all colors
 */
export function invertColors(svg: string): string {
  // Match all color formats: 3-char hex, 6-char hex, rgb(), rgba()
  const colorRegex = /(fill|stroke)=["'](#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))["']/gi

  return svg.replace(colorRegex, (match, attr, color) => {
    let r = 0, g = 0, b = 0

    if (color.startsWith('#')) {
      // Hex color
      const hex = color.slice(1)
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
      }
    } else if (color.startsWith('rgb')) {
      const rgbMatch = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
      if (rgbMatch) {
        r = parseInt(rgbMatch[1])
        g = parseInt(rgbMatch[2])
        b = parseInt(rgbMatch[3])
      }
    }

    // Invert the color
    const invR = 255 - r
    const invG = 255 - g
    const invB = 255 - b

    const newHex = [invR, invG, invB].map(c => c.toString(16).padStart(2, '0')).join('')
    return `${attr}="#${newHex}"`
  })
}

/**
 * Simplify SVG by reducing path precision
 */
export function simplifyPaths(svg: string, precision = 1): string {
  return svg.replace(
    /(\d+\.\d{2,})/g,
    (match) => parseFloat(match).toFixed(precision)
  )
}

/**
 * Remove specific colors from SVG
 */
export function removeColor(svg: string, colorToRemove: string): string {
  const normalizeColor = (color: string): string => {
    if (color.startsWith('#')) {
      const hex = color.slice(1).toLowerCase()
      if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      }
      return `#${hex}`
    }
    return color.toLowerCase()
  }

  // Escape special regex characters in the color string
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const targetColor = normalizeColor(colorToRemove)
  const escapedColor = escapeRegex(targetColor)

  // Remove elements with the specified fill color
  return svg.replace(
    new RegExp(`<(path|rect|circle|polygon)[^>]*fill=["']${escapedColor}["'][^>]*/?>`, 'gi'),
    ''
  )
}

/**
 * Outline text (convert fills to strokes)
 */
export function convertFillToStroke(svg: string, strokeWidth = 2): string {
  return svg.replace(
    /<path([^>]*)fill=["']([^"']+)["']([^>]*)>/gi,
    (match, before, fillColor, after) => {
      if (fillColor === 'none') return match
      return `<path${before}fill="none" stroke="${fillColor}" stroke-width="${strokeWidth}"${after}>`
    }
  )
}

/**
 * Extract color palette from SVG
 * Returns array of unique colors with their usage count
 */
export interface ColorInfo {
  color: string
  count: number
  type: 'fill' | 'stroke' | 'both'
}

export function extractColorPalette(svg: string): ColorInfo[] {
  const colorMap = new Map<string, { fill: number; stroke: number }>()

  // Normalize color to consistent format
  const normalizeColor = (color: string): string | null => {
    if (!color || color === 'none' || color === 'transparent') return null
    const c = color.toLowerCase().trim()

    // Convert named colors to hex
    const namedColors: Record<string, string> = {
      white: '#ffffff', black: '#000000', red: '#ff0000',
      green: '#008000', blue: '#0000ff', yellow: '#ffff00',
      cyan: '#00ffff', magenta: '#ff00ff', gray: '#808080',
      grey: '#808080', orange: '#ffa500', purple: '#800080',
    }
    if (namedColors[c]) return namedColors[c]

    // Normalize 3-char hex to 6-char
    if (/^#[0-9a-f]{3}$/i.test(c)) {
      return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
    }

    // Return 6-char hex as-is
    if (/^#[0-9a-f]{6}$/i.test(c)) {
      return c
    }

    // Parse rgb() to hex
    const rgbMatch = c.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if (rgbMatch) {
      const r = Math.min(255, parseInt(rgbMatch[1])).toString(16).padStart(2, '0')
      const g = Math.min(255, parseInt(rgbMatch[2])).toString(16).padStart(2, '0')
      const b = Math.min(255, parseInt(rgbMatch[3])).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }

    return c // Return as-is for unknown formats
  }

  // Extract fill colors
  const fillRegex = /fill=["']([^"']+)["']/gi
  let match
  while ((match = fillRegex.exec(svg)) !== null) {
    const color = normalizeColor(match[1])
    if (color) {
      const existing = colorMap.get(color) || { fill: 0, stroke: 0 }
      existing.fill++
      colorMap.set(color, existing)
    }
  }

  // Extract stroke colors
  const strokeRegex = /\bstroke=["']([^"']+)["']/gi
  while ((match = strokeRegex.exec(svg)) !== null) {
    const color = normalizeColor(match[1])
    if (color) {
      const existing = colorMap.get(color) || { fill: 0, stroke: 0 }
      existing.stroke++
      colorMap.set(color, existing)
    }
  }

  // Convert to array and sort by usage
  const colors: ColorInfo[] = []
  colorMap.forEach((counts, color) => {
    colors.push({
      color,
      count: counts.fill + counts.stroke,
      type: counts.fill > 0 && counts.stroke > 0 ? 'both'
           : counts.fill > 0 ? 'fill' : 'stroke'
    })
  })

  return colors.sort((a, b) => b.count - a.count)
}

/**
 * Replace a color throughout the SVG
 */
export function replaceColor(svg: string, oldColor: string, newColor: string): string {
  const normalizeColor = (color: string): string => {
    if (color.startsWith('#')) {
      const hex = color.slice(1).toLowerCase()
      if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      }
      return `#${hex}`
    }
    return color.toLowerCase()
  }

  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const normalizedOld = normalizeColor(oldColor)
  const escapedOld = escapeRegex(normalizedOld)

  // Replace in fill attributes
  let result = svg.replace(
    new RegExp(`(fill=["'])${escapedOld}(["'])`, 'gi'),
    `$1${newColor}$2`
  )

  // Replace in stroke attributes
  result = result.replace(
    new RegExp(`(stroke=["'])${escapedOld}(["'])`, 'gi'),
    `$1${newColor}$2`
  )

  return result
}

/**
 * Transformation preset definition
 */
export interface TransformationPreset {
  id: string
  name: string
  description: string
  transformations: Array<{
    id: string
    options?: Record<string, unknown>
  }>
  icon: string
}

/**
 * Get built-in transformation presets
 */
export function getPresets(): TransformationPreset[] {
  return [
    {
      id: 'logo-ready',
      name: 'Logo Ready',
      description: 'Remove background and add a subtle border for logos',
      transformations: [
        { id: 'remove-background' },
        { id: 'add-rounded-border', options: { strokeWidth: 1, strokeColor: '#e5e7eb', padding: 8 } },
      ],
      icon: 'Sparkle',
    },
    {
      id: 'icon-optimized',
      name: 'Icon Optimized',
      description: 'Simplify paths and remove background for clean icons',
      transformations: [
        { id: 'remove-background' },
        { id: 'simplify' },
      ],
      icon: 'Cube',
    },
    {
      id: 'dark-mode-ready',
      name: 'Dark Mode Ready',
      description: 'Invert colors for dark theme compatibility',
      transformations: [
        { id: 'invert-colors' },
      ],
      icon: 'Moon',
    },
    {
      id: 'print-ready',
      name: 'Print Ready',
      description: 'Convert to grayscale and add border for printing',
      transformations: [
        { id: 'grayscale' },
        { id: 'add-rectangle-border', options: { strokeWidth: 1, strokeColor: '#000000', padding: 10 } },
      ],
      icon: 'Printer',
    },
    {
      id: 'social-avatar',
      name: 'Social Avatar',
      description: 'Add circle border for profile pictures',
      transformations: [
        { id: 'remove-background' },
        { id: 'add-circle-border', options: { strokeWidth: 2, strokeColor: '#3b82f6', padding: 5 } },
      ],
      icon: 'User',
    },
    {
      id: 'outlined-style',
      name: 'Outlined Style',
      description: 'Convert fills to strokes for line art look',
      transformations: [
        { id: 'fill-to-stroke' },
        { id: 'remove-background' },
      ],
      icon: 'PencilLine',
    },
  ]
}

/**
 * Get list of all available transformations
 */
export function getAvailableTransformations(): Array<{
  id: string
  name: string
  description: string
  category: 'border' | 'background' | 'color' | 'transform' | 'style'
  icon: string
}> {
  return [
    {
      id: 'add-rectangle-border',
      name: 'Add Rectangle Border',
      description: 'Add a rectangular border around the SVG',
      category: 'border',
      icon: 'BoundingBox',
    },
    {
      id: 'add-rounded-border',
      name: 'Add Rounded Border',
      description: 'Add a rounded rectangle border',
      category: 'border',
      icon: 'Square',
    },
    {
      id: 'add-circle-border',
      name: 'Add Circle Border',
      description: 'Add a circular border around the SVG',
      category: 'border',
      icon: 'Circle',
    },
    {
      id: 'add-path-stroke',
      name: 'Add Path Stroke',
      description: 'Add stroke to all paths',
      category: 'border',
      icon: 'Path',
    },
    {
      id: 'remove-background',
      name: 'Remove Background',
      description: 'Remove background elements for transparency',
      category: 'background',
      icon: 'Eraser',
    },
    {
      id: 'add-white-background',
      name: 'Add White Background',
      description: 'Add a white background',
      category: 'background',
      icon: 'Square',
    },
    {
      id: 'add-shadow',
      name: 'Add Drop Shadow',
      description: 'Add a drop shadow effect',
      category: 'style',
      icon: 'Sun',
    },
    {
      id: 'grayscale',
      name: 'Convert to Grayscale',
      description: 'Convert all colors to grayscale',
      category: 'color',
      icon: 'Palette',
    },
    {
      id: 'invert-colors',
      name: 'Invert Colors',
      description: 'Invert all colors in the SVG',
      category: 'color',
      icon: 'SwapCircle',
    },
    {
      id: 'fill-to-stroke',
      name: 'Convert Fill to Stroke',
      description: 'Convert filled paths to outlined strokes',
      category: 'style',
      icon: 'Path',
    },
    {
      id: 'simplify',
      name: 'Simplify Paths',
      description: 'Reduce path precision for smaller file size',
      category: 'style',
      icon: 'ArrowsIn',
    },
    {
      id: 'flip-horizontal',
      name: 'Flip Horizontal',
      description: 'Mirror the SVG horizontally',
      category: 'transform',
      icon: 'ArrowsLeftRight',
    },
    {
      id: 'flip-vertical',
      name: 'Flip Vertical',
      description: 'Mirror the SVG vertically',
      category: 'transform',
      icon: 'ArrowsDownUp',
    },
    {
      id: 'rotate-90',
      name: 'Rotate 90°',
      description: 'Rotate the SVG 90 degrees clockwise',
      category: 'transform',
      icon: 'ArrowClockwise',
    },
    {
      id: 'scale-up',
      name: 'Scale Up (150%)',
      description: 'Increase SVG size by 50%',
      category: 'transform',
      icon: 'ArrowsOut',
    },
    {
      id: 'scale-down',
      name: 'Scale Down (50%)',
      description: 'Reduce SVG size by 50%',
      category: 'transform',
      icon: 'ArrowsIn',
    },
  ]
}
