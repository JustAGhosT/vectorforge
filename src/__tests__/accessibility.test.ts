import { describe, it, expect, vi } from 'vitest'
import { 
  generateA11yId,
  isFocusable,
  KeyboardKeys,
} from '../lib/accessibility'

describe('Accessibility Utilities', () => {
  describe('generateA11yId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateA11yId()
      const id2 = generateA11yId()
      expect(id1).not.toBe(id2)
    })

    it('should use custom prefix', () => {
      const id = generateA11yId('custom')
      expect(id.startsWith('custom-')).toBe(true)
    })

    it('should use default prefix', () => {
      const id = generateA11yId()
      expect(id.startsWith('a11y-')).toBe(true)
    })
  })

  describe('KeyboardKeys', () => {
    it('should have all common keyboard keys', () => {
      expect(KeyboardKeys.ENTER).toBe('Enter')
      expect(KeyboardKeys.SPACE).toBe(' ')
      expect(KeyboardKeys.ESCAPE).toBe('Escape')
      expect(KeyboardKeys.ARROW_UP).toBe('ArrowUp')
      expect(KeyboardKeys.ARROW_DOWN).toBe('ArrowDown')
      expect(KeyboardKeys.ARROW_LEFT).toBe('ArrowLeft')
      expect(KeyboardKeys.ARROW_RIGHT).toBe('ArrowRight')
      expect(KeyboardKeys.TAB).toBe('Tab')
    })
  })

  describe('isFocusable', () => {
    it('should return false for elements with negative tabindex', () => {
      const div = document.createElement('div')
      div.tabIndex = -1
      expect(isFocusable(div)).toBe(false)
    })

    it('should return true for buttons', () => {
      const button = document.createElement('button')
      expect(isFocusable(button)).toBe(true)
    })

    it('should return false for disabled buttons', () => {
      const button = document.createElement('button')
      button.disabled = true
      expect(isFocusable(button)).toBe(false)
    })

    it('should return true for links with href', () => {
      const link = document.createElement('a')
      link.href = 'https://example.com'
      expect(isFocusable(link)).toBe(true)
    })

    it('should return true for inputs', () => {
      const input = document.createElement('input')
      expect(isFocusable(input)).toBe(true)
    })

    it('should return true for elements with tabindex 0 or higher', () => {
      const div = document.createElement('div')
      div.tabIndex = 0
      expect(isFocusable(div)).toBe(true)
    })
  })
})
