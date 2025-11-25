import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  WarningCircle,
  XCircle,
  ArrowClockwise,
  Question,
} from '@phosphor-icons/react'

interface ErrorDisplayProps {
  error: string
  title?: string
  onRetry?: () => void
  onDismiss?: () => void
  type?: 'error' | 'warning'
  suggestions?: string[]
}

export function ErrorDisplay({
  error,
  title = 'Conversion Failed',
  onRetry,
  onDismiss,
  type = 'error',
  suggestions = [],
}: ErrorDisplayProps) {
  const Icon = type === 'error' ? XCircle : WarningCircle
  const colorClass = type === 'error' ? 'text-destructive' : 'text-orange'

  const defaultSuggestions = [
    'Check your internet connection',
    'Try a different image file',
    'Reduce image size if very large',
    'Adjust conversion settings',
  ]

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 md:p-6 border-2 border-destructive/20">
        <Alert variant="destructive" className="border-none bg-transparent p-0">
          <div className="flex items-start gap-4">
            <Icon className={`w-6 h-6 ${colorClass} flex-shrink-0 mt-0.5`} weight="fill" />
            <div className="flex-1 space-y-3">
              <div>
                <AlertTitle className="text-base font-semibold mb-1">
                  {title}
                </AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground">
                  {error}
                </AlertDescription>
              </div>

              {displaySuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Question className="w-4 h-4" weight="bold" />
                    <span>Try these solutions:</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    {displaySuggestions.map((suggestion, index) => (
                      <li key={index} className="list-disc">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    variant="default"
                    className="gap-2"
                    size="sm"
                  >
                    <ArrowClockwise className="w-4 h-4" weight="bold" />
                    Try Again
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    onClick={onDismiss}
                    variant="outline"
                    size="sm"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Alert>
      </Card>
    </motion.div>
  )
}

interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={className}
    >
      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" weight="fill" />
        <p className="text-sm text-destructive">{message}</p>
      </div>
    </motion.div>
  )
}
