import { cn } from '@/lib/utils'

interface SkipLinkProps {
  targetId: string
  children?: React.ReactNode
  className?: string
}

/**
 * Skip to main content link for keyboard users
 * Hidden by default, visible on focus
 */
export function SkipLink({ targetId, children = 'Skip to main content', className }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        'fixed top-0 left-0 z-[100] p-4 bg-primary text-primary-foreground font-medium',
        'transform -translate-y-full focus:translate-y-0 transition-transform',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Visually hidden element for screen readers only
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

/**
 * Live region for dynamic content announcements
 */
interface LiveRegionProps {
  children: React.ReactNode
  priority?: 'polite' | 'assertive'
  atomic?: boolean
}

export function LiveRegion({ children, priority = 'polite', atomic = true }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}
