import { useEffect, RefObject } from 'react'

interface UsePinchZoomOptions {
  onZoomChange: (delta: number) => void
  enabled?: boolean
}

export function usePinchZoom(
  ref: RefObject<HTMLElement | null>,
  { onZoomChange, enabled = true }: UsePinchZoomOptions
) {
  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current
    let initialDistance = 0

    const getDistance = (touches: TouchList) => {
      const touch1 = touches[0]
      const touch2 = touches[1]
      return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        initialDistance = getDistance(e.touches)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault()
        const currentDistance = getDistance(e.touches)
        const delta = (currentDistance - initialDistance) / 200
        
        if (Math.abs(delta) > 0.01) {
          onZoomChange(delta)
          initialDistance = currentDistance
        }
      }
    }

    const handleTouchEnd = () => {
      initialDistance = 0
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, onZoomChange, enabled])
}
