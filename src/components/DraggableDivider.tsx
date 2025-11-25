import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowsLeftRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DraggableDividerProps {
  defaultPosition?: number
  onPositionChange?: (position: number) => void
  className?: string
}

export function DraggableDivider({
  defaultPosition = 50,
  onPositionChange,
  className,
}: DraggableDividerProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100
      const clampedPosition = Math.max(20, Math.min(80, newPosition))
      
      setPosition(clampedPosition)
      onPositionChange?.(clampedPosition)
    },
    [isDragging, onPositionChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return

      const touch = e.touches[0]
      const rect = containerRef.current.getBoundingClientRect()
      const newPosition = ((touch.clientX - rect.left) / rect.width) * 100
      const clampedPosition = Math.max(20, Math.min(80, newPosition))
      
      setPosition(clampedPosition)
      onPositionChange?.(clampedPosition)
    },
    [isDragging, onPositionChange]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className={cn('relative h-full', className)}>
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 w-1 bg-border hover:bg-primary transition-colors cursor-col-resize z-10',
          isDragging && 'bg-primary'
        )}
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        initial={false}
        animate={{
          left: `${position}%`,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-background border border-border rounded-lg flex items-center justify-center shadow-md">
          <ArrowsLeftRight className="w-4 h-4 text-muted-foreground" weight="bold" />
        </div>
      </motion.div>
    </div>
  )
}
