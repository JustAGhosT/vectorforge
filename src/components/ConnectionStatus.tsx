import { motion, AnimatePresence } from 'framer-motion'
import { WifiSlash, WifiHigh } from '@phosphor-icons/react'

interface ConnectionStatusProps {
  isOnline: boolean
}

export function ConnectionStatus({ isOnline }: ConnectionStatusProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 shadow-lg"
        >
          <div className="container mx-auto flex items-center justify-center gap-2">
            <WifiSlash className="w-5 h-5" weight="bold" />
            <p className="text-sm font-medium">
              No internet connection. Some features may not work.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConnectionIndicator({ isOnline }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          <WifiHigh className="w-4 h-4 text-primary" weight="bold" />
          <span className="text-xs text-muted-foreground hidden md:inline">
            Connected
          </span>
        </>
      ) : (
        <>
          <WifiSlash className="w-4 h-4 text-destructive" weight="bold" />
          <span className="text-xs text-destructive hidden md:inline">
            Offline
          </span>
        </>
      )}
    </div>
  )
}
