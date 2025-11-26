import { useState, useCallback, useEffect, useRef } from 'react'
import { ImageSkeleton } from './Skeleton'
import { cn } from '@/lib/utils'

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholderClassName?: string
  onLoad?: () => void
  onError?: () => void
  lazy?: boolean
}

/**
 * Progressive Image component with:
 * - Skeleton loading state
 * - Blur-up effect on load
 * - Intersection observer for lazy loading
 * - Error handling
 */
export function ProgressiveImage({
  src,
  alt,
  className,
  placeholderClassName,
  onLoad,
  onError,
  lazy = true,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || shouldLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.1,
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, shouldLoad])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setIsError(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsError(true)
    setIsLoaded(false)
    onError?.()
  }, [onError])

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false)
    setIsError(false)
  }, [src])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      aria-label={alt}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && !isError && (
        <ImageSkeleton
          className={cn(
            'absolute inset-0 w-full h-full',
            placeholderClassName
          )}
        />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center p-4">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-contain transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}
    </div>
  )
}
