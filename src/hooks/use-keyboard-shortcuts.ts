import { useEffect } from 'react'

interface ShortcutHandlers {
  onUpload?: () => void
  onDownload?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onRetry?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      if (modKey && e.key === 'o') {
        e.preventDefault()
        handlers.onUpload?.()
      }

      if (modKey && e.key === 's') {
        e.preventDefault()
        handlers.onDownload?.()
      }

      if (modKey && e.key === '=') {
        e.preventDefault()
        handlers.onZoomIn?.()
      }

      if (modKey && e.key === '-') {
        e.preventDefault()
        handlers.onZoomOut?.()
      }

      if (modKey && e.key === '0') {
        e.preventDefault()
        handlers.onZoomReset?.()
      }

      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handlers.onUndo?.()
      }

      if (modKey && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handlers.onRedo?.()
      }

      // Cmd/Ctrl + R for retry conversion
      if (modKey && e.key === 'r') {
        e.preventDefault()
        handlers.onRetry?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, enabled])
}
