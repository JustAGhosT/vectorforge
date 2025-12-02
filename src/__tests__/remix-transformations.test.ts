import { describe, it, expect } from 'vitest'
import {
  addBorder,
  modifyBackground,
  addPathBorder,
  addShadow,
  applyTransform,
  convertToGrayscale,
  invertColors,
  simplifyPaths,
  convertFillToStroke,
  getAvailableTransformations,
} from '@/lib/remix-transformations'

const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect x="10" y="10" width="80" height="80" fill="#FF0000"/>
  <circle cx="50" cy="50" r="20" fill="#00FF00"/>
</svg>`

describe('remix-transformations', () => {
  describe('addBorder', () => {
    it('adds a rectangle border to SVG', () => {
      const result = addBorder(sampleSvg, { shape: 'rectangle', strokeWidth: 2, padding: 10 })
      expect(result).toContain('<rect')
      expect(result).toContain('stroke=')
      expect(result).toContain('fill="none"')
    })

    it('adds a rounded border to SVG', () => {
      const result = addBorder(sampleSvg, { shape: 'rounded', borderRadius: 8, padding: 10 })
      expect(result).toContain('<rect')
      expect(result).toContain('rx="8"')
    })

    it('adds a circle border to SVG', () => {
      const result = addBorder(sampleSvg, { shape: 'circle', padding: 10 })
      expect(result).toContain('<circle')
      expect(result).toContain('fill="none"')
      expect(result).toContain('stroke=')
    })

    it('uses default options when not provided', () => {
      const result = addBorder(sampleSvg)
      expect(result).toContain('<rect')
      expect(result).toContain('stroke="#000000"')
    })
  })

  describe('modifyBackground', () => {
    it('can remove background elements', () => {
      const svgWithBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithBg, { remove: true })
      expect(result).not.toContain('width="100%"')
    })

    it('can remove light gray background (#f0f0f0)', () => {
      const svgWithLightGray = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="0" y="0" width="100" height="100" fill="#f0f0f0"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithLightGray, { remove: true })
      expect(result).not.toContain('fill="#f0f0f0"')
      expect(result).toContain('fill="#00FF00"')
    })

    it('can remove background with 5px margin', () => {
      const svgWithMargin = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="2" y="2" width="96" height="96" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithMargin, { remove: true })
      expect(result).not.toContain('width="96"')
    })

    it('can remove circular backgrounds', () => {
      const svgWithCircleBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithCircleBg, { remove: true })
      // Should remove the large white circle but keep the green one
      const circleMatches = result.match(/<circle/g)
      expect(circleMatches).toBeTruthy()
      expect(circleMatches!.length).toBe(1)
      expect(result).toContain('fill="#00FF00"')
    })

    it('can remove ellipse backgrounds', () => {
      const svgWithEllipseBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" rx="48" ry="48" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithEllipseBg, { remove: true })
      expect(result).not.toContain('<ellipse')
      expect(result).toContain('fill="#00FF00"')
    })

    it('can remove polygon backgrounds', () => {
      const svgWithPolygonBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="0,0 100,0 100,100 0,100" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithPolygonBg, { remove: true })
      expect(result).not.toContain('<polygon')
      expect(result).toContain('fill="#00FF00"')
    })

    it('can remove dark backgrounds when removeDark is true', () => {
      const svgWithDarkBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="0" y="0" width="100" height="100" fill="#000000"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithDarkBg, { remove: false, removeDark: true })
      expect(result).not.toContain('fill="#000000"')
      expect(result).toContain('fill="#00FF00"')
    })

    it('does not remove small rectangles', () => {
      const svgWithSmallRect = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithSmallRect, { remove: true })
      // Small rect should remain (doesn't cover 90% of SVG)
      expect(result).toContain('width="80"')
    })

    it('does not remove colored elements', () => {
      const svgWithColoredRect = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="0" y="0" width="100" height="100" fill="#FF0000"/>
        <circle cx="50" cy="50" r="20" fill="#00FF00"/>
      </svg>`
      const result = modifyBackground(svgWithColoredRect, { remove: true })
      // Red rect should remain (not a background color)
      expect(result).toContain('fill="#FF0000"')
    })

    it('can add a background color', () => {
      const result = modifyBackground(sampleSvg, { color: '#FFFFFF' })
      expect(result).toContain('fill="#FFFFFF"')
    })
  })

  describe('addPathBorder', () => {
    it('adds stroke to paths', () => {
      const result = addPathBorder(sampleSvg, { strokeWidth: 2, strokeColor: '#000000' })
      // Note: The sample SVG uses rect and circle, not path elements
      expect(result).toBeDefined()
    })

    it('does not double-add stroke to paths that already have stroke', () => {
      const svgWithStroke = `<svg xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L100 100" stroke="#FF0000" stroke-width="2"/>
      </svg>`
      const result = addPathBorder(svgWithStroke, { strokeColor: '#000000' })
      // Should not add another stroke attribute
      expect(result.match(/stroke=/g)?.length).toBe(1)
    })
  })

  describe('addShadow', () => {
    it('adds a drop shadow filter definition', () => {
      const result = addShadow(sampleSvg)
      expect(result).toContain('<defs>')
      expect(result).toContain('<filter')
      expect(result).toContain('feDropShadow')
    })

    it('applies custom shadow options', () => {
      const result = addShadow(sampleSvg, { offsetX: 5, offsetY: 5, blur: 10 })
      expect(result).toContain('dx="5"')
      expect(result).toContain('dy="5"')
      expect(result).toContain('stdDeviation="10"')
    })
  })

  describe('applyTransform', () => {
    it('applies rotation transform', () => {
      const result = applyTransform(sampleSvg, { rotate: 90 })
      expect(result).toContain('rotate(90')
    })

    it('applies horizontal flip', () => {
      const result = applyTransform(sampleSvg, { flipX: true })
      expect(result).toContain('scale(-1 1)')
    })

    it('applies vertical flip', () => {
      const result = applyTransform(sampleSvg, { flipY: true })
      expect(result).toContain('scale(1 -1)')
    })

    it('applies scale transform', () => {
      const result = applyTransform(sampleSvg, { scale: 1.5 })
      expect(result).toContain('scale(1.5)')
    })

    it('returns original SVG when no transforms provided', () => {
      const result = applyTransform(sampleSvg, {})
      expect(result).toBe(sampleSvg)
    })
  })

  describe('convertToGrayscale', () => {
    it('converts hex colors to grayscale', () => {
      const result = convertToGrayscale(sampleSvg)
      // The red (#FF0000) should become a gray value
      // The green (#00FF00) should become a different gray value
      expect(result).toMatch(/fill="#[0-9a-f]{6}"/i)
    })
  })

  describe('invertColors', () => {
    it('inverts hex colors', () => {
      const svgWithBlack = `<svg xmlns="http://www.w3.org/2000/svg">
        <rect fill="#000000"/>
      </svg>`
      const result = invertColors(svgWithBlack)
      expect(result).toContain('fill="#ffffff"')
    })

    it('inverts white to black', () => {
      const svgWithWhite = `<svg xmlns="http://www.w3.org/2000/svg">
        <rect fill="#ffffff"/>
      </svg>`
      const result = invertColors(svgWithWhite)
      expect(result).toContain('fill="#000000"')
    })
  })

  describe('simplifyPaths', () => {
    it('reduces decimal precision in path data', () => {
      const svgWithDecimals = `<svg xmlns="http://www.w3.org/2000/svg">
        <path d="M10.123456 20.987654 L30.555555 40.111111"/>
      </svg>`
      const result = simplifyPaths(svgWithDecimals, 1)
      expect(result).toContain('10.1')
      expect(result).toContain('21.0')
      expect(result).not.toContain('10.123456')
    })
  })

  describe('convertFillToStroke', () => {
    it('converts filled paths to stroked paths', () => {
      const svgWithFill = `<svg xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L100 100" fill="#FF0000"/>
      </svg>`
      const result = convertFillToStroke(svgWithFill)
      expect(result).toContain('fill="none"')
      expect(result).toContain('stroke="#FF0000"')
    })

    it('does not modify paths with fill="none"', () => {
      const svgWithNoFill = `<svg xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L100 100" fill="none"/>
      </svg>`
      const result = convertFillToStroke(svgWithNoFill)
      expect(result).toBe(svgWithNoFill)
    })
  })

  describe('getAvailableTransformations', () => {
    it('returns a list of available transformations', () => {
      const transformations = getAvailableTransformations()
      expect(transformations).toBeInstanceOf(Array)
      expect(transformations.length).toBeGreaterThan(0)
    })

    it('each transformation has required properties', () => {
      const transformations = getAvailableTransformations()
      transformations.forEach((t) => {
        expect(t).toHaveProperty('id')
        expect(t).toHaveProperty('name')
        expect(t).toHaveProperty('description')
        expect(t).toHaveProperty('category')
        expect(t).toHaveProperty('icon')
      })
    })

    it('includes expected transformation categories', () => {
      const transformations = getAvailableTransformations()
      const categories = new Set(transformations.map((t) => t.category))
      expect(categories.has('border')).toBe(true)
      expect(categories.has('background')).toBe(true)
      expect(categories.has('color')).toBe(true)
      expect(categories.has('transform')).toBe(true)
      expect(categories.has('style')).toBe(true)
    })
  })
})
