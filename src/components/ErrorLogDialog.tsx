import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { XCircle, Trash, Clock, Info } from '@phosphor-icons/react'
import type { StoredError } from '@/hooks/use-error-store'

interface ErrorLogDialogProps {
  errors: StoredError[]
  isOpen: boolean
  onClose: () => void
  onRemoveError: (id: string) => void
  onClearAll: () => void
}

export function ErrorLogDialog({
  errors,
  isOpen,
  onClose,
  onRemoveError,
  onClearAll,
}: ErrorLogDialogProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getSourceColor = (source: StoredError['source']) => {
    switch (source) {
      case 'ai':
        return 'bg-purple-500'
      case 'conversion':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSourceLabel = (source: StoredError['source']) => {
    switch (source) {
      case 'ai':
        return 'AI'
      case 'conversion':
        return 'Conversion'
      default:
        return 'General'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" weight="fill" />
            Error Log ({errors.length})
          </DialogTitle>
          <DialogDescription>
            Errors from the current session. These will be cleared when you refresh the page.
          </DialogDescription>
        </DialogHeader>

        {errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Info className="w-8 h-8 mb-2" />
            <p className="text-sm">No errors in this session</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className="p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getSourceColor(error.source)} text-white text-xs`}>
                          {getSourceLabel(error.source)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(error.timestamp)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRemoveError(error.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-destructive mb-1">
                      {error.message}
                    </p>
                    {error.details && (
                      <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        {error.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={onClearAll}
              >
                <Trash className="w-4 h-4" />
                Clear All Errors
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
