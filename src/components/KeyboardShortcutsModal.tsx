import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? '⌘' : 'Ctrl'

  const shortcuts = [
    { label: 'Upload file', key: `${modKey} + O` },
    { label: 'Download SVG', key: `${modKey} + S` },
    { label: 'Retry conversion', key: `${modKey} + R` },
    { label: 'Zoom in', key: `${modKey} + =` },
    { label: 'Zoom out', key: `${modKey} + -` },
    { label: 'Reset zoom', key: `${modKey} + 0` },
    { label: 'Undo settings', key: `${modKey} + Z` },
    { label: 'Redo settings', key: `${modKey} + Shift + Z` },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index}>
                  {(index === 3 || index === 6) && <Separator className="my-3" />}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.label}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
