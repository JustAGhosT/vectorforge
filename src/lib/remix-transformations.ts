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
  const { remove = false, color, opacity = 1 } = options
  
  if (remove) {
    // Remove any background rectangles that cover the full SVG (100% width/height)
    let result = svg.replace(/<rect[^>]*fill=["'][^"']*["'][^>]*width=["']100%["'][^>]*height=["']100%["'][^>]*\/?>/gi, '')
    // Also remove rectangles at position 0,0 that have 100% dimensions (likely backgrounds)
    result = result.replace(/<rect[^>]*(?:x=["']0["'][^>]*y=["']0["']|y=["']0["'][^>]*x=["']0["'])[^>]*\/?>/gi, (match) => {
      // Only remove if it has 100% dimensions (indicating it's a full-size background)
      // Don't remove based on fill attribute alone as that could remove foreground elements
      if (!match.includes('transform') && (match.includes('width="100%"') || match.includes('height="100%"'))) {
        return ''
      }
      return match
    })
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
    // If path already has a stroke, don't add another
    if (attrs.includes('stroke=')) {
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
  
  if (rotate !== 0) {
    transforms.push(`rotate(${rotate} ${cx} ${cy})`)
  }
  
  if (scale !== 1) {
    transforms.push(`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`)
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
  const hexRegex = /(fill|stroke)=["']#([0-9a-fA-F]{6})["']/gi
  
  return svg.replace(hexRegex, (match, attr, hex) => {
    const r = 255 - parseInt(hex.slice(0, 2), 16)
    const g = 255 - parseInt(hex.slice(2, 4), 16)
    const b = 255 - parseInt(hex.slice(4, 6), 16)
    
    const newHex = [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
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
  
  const targetColor = normalizeColor(colorToRemove)
  
  // Remove elements with the specified fill color
  return svg.replace(
    new RegExp(`<(path|rect|circle|polygon)[^>]*fill=["']${targetColor}["'][^>]*/?>`, 'gi'),
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
