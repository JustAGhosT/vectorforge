/**
 * Accessibility Utilities
 * 
 * Helper functions and hooks for WCAG 2.1 AA compliance
 */

import { useEffect, useCallback, useState } from 'react'

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement is read
  setTimeout(() => {
    if (announcement.parentNode === document.body) {
      document.body.removeChild(announcement)
    }
  }, 1000)
}

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, isActive])
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Generate unique IDs for accessibility attributes
 */
let idCounter = 0
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Skip to main content link component props
 */
export interface SkipLinkProps {
  targetId: string
  children?: React.ReactNode
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
} as const

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false
  if ((element as HTMLButtonElement).disabled) return false
  
  const tagName = element.tagName.toLowerCase()
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea']
  
  if (focusableTags.includes(tagName)) return true
  if (element.tabIndex >= 0) return true
  
  return false
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  return Array.from(elements).filter(isFocusable)
}

/**
 * Hook to handle roving tabindex for list navigation
 */
export function useRovingTabindex(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, currentIndex: number) => {
      const prevKey = orientation === 'vertical' ? KeyboardKeys.ARROW_UP : KeyboardKeys.ARROW_LEFT
      const nextKey = orientation === 'vertical' ? KeyboardKeys.ARROW_DOWN : KeyboardKeys.ARROW_RIGHT

      let newIndex = currentIndex

      switch (e.key) {
        case prevKey:
          e.preventDefault()
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          break
        case nextKey:
          e.preventDefault()
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          break
        case KeyboardKeys.HOME:
          e.preventDefault()
          newIndex = 0
          break
        case KeyboardKeys.END:
          e.preventDefault()
          newIndex = items.length - 1
          break
        default:
          return
      }

      items[newIndex]?.focus()
    },
    [items, orientation]
  )

  return handleKeyDown
}
