import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { UploadSimple, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  isProcessing: boolean
  progress: number
  isDragging: boolean
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onFileSelect: (files: FileList | null) => void
  acceptMultiple?: boolean
}

export function UploadZone({
  isProcessing,
  progress,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  acceptMultiple = false,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="p-4 md:p-6">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-all duration-300 cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isProcessing && 'pointer-events-none opacity-60'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          id="png-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/png"
          multiple={acceptMultiple}
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files)}
        />

        {!isProcessing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-3 md:mb-4">
              <UploadSimple
                className="w-6 h-6 md:w-8 md:h-8 text-primary"
                weight="bold"
              />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
              Drop your PNG here or click to upload
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              Maximum file size: 10MB
            </p>
            <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0">
              Select File
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-2 animate-pulse">
              <Sparkle
                className="w-6 h-6 md:w-8 md:h-8 text-primary"
                weight="fill"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Processing your image...
              </p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(progress)}%
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
