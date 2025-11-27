import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DownloadSimple,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowClockwise,
  Checks,
} from '@phosphor-icons/react'
import { ConversionJob, formatFileSize } from '@/lib/converter'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePinchZoom } from '@/hooks/use-pinch-zoom'
import { DraggableDivider } from '@/components/DraggableDivider'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ConversionPreviewProps {
  job: ConversionJob | null
  zoomLevel: number
  dividerPosition: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onDividerChange: (position: number) => void
  onDownload: (job: ConversionJob) => void
  onNewImage: () => void
  onZoomChange?: (zoom: number) => void
  onRetry?: () => void
  showCheckerboard?: boolean
  onToggleCheckerboard?: () => void
}

export function ConversionPreview({
  job,
  zoomLevel,
  dividerPosition,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDividerChange,
  onDownload,
  onNewImage,
  onZoomChange,
  onRetry,
  showCheckerboard = false,
  onToggleCheckerboard,
}: ConversionPreviewProps) {
  const isMobile = useIsMobile()
  const previewRef = useRef<HTMLDivElement>(null)

  // Checkerboard pattern styles - adapts to dark mode using CSS variables
  const checkerboardStyle = showCheckerboard ? {
    backgroundImage: `
      linear-gradient(45deg, var(--checkerboard-color, #e0e0e0) 25%, transparent 25%),
      linear-gradient(-45deg, var(--checkerboard-color, #e0e0e0) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--checkerboard-color, #e0e0e0) 75%),
      linear-gradient(-45deg, transparent 75%, var(--checkerboard-color, #e0e0e0) 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    '--checkerboard-color': 'hsl(var(--muted))',
  } as React.CSSProperties : {}

  usePinchZoom(previewRef, {
    onZoomChange: (delta) => {
      const newZoom = zoomLevel + delta
      const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
      if (onZoomChange) {
        onZoomChange(clampedZoom)
      }
    },
    enabled: isMobile && !!job,
  })

  if (!job) return null

  if (job.status === 'failed') {
    return (
      <ErrorDisplay
        error={job.error || 'An unknown error occurred during conversion'}
        title="Conversion Failed"
        onRetry={onRetry}
        onDismiss={onNewImage}
        suggestions={[
          'Ensure the image file is not corrupted',
          'Try a smaller image size',
          'Check if the file format is supported (PNG, JPG, WebP)',
          'Adjust conversion settings to less complex values',
        ]}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
            <h3 className="text-base md:text-lg font-semibold">Preview</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {formatFileSize(job.originalSize)}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="default" className="bg-cyan text-white">
                  {formatFileSize(job.svgSize)}
                </Badge>
              </div>
              <div className="flex items-center gap-1 ml-auto md:ml-0">
                {onToggleCheckerboard && (
                  <Button
                    variant={showCheckerboard ? 'default' : 'ghost'}
                    size="icon"
                    onClick={onToggleCheckerboard}
                    className="h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                    title="Toggle checkerboard background for transparency"
                  >
                    <Checks className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                  title="Zoom out (Cmd/Ctrl + -)"
                >
                  <MagnifyingGlassMinus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomReset}
                  className="text-xs text-muted-foreground min-w-[3rem] min-h-[44px] md:min-h-0 hover:text-foreground transition-colors"
                  title="Reset zoom (Cmd/Ctrl + 0)"
                >
                  {Math.round(zoomLevel * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomIn}
                  disabled={zoomLevel >= 3}
                  className="h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                  title="Zoom in (Cmd/Ctrl + +)"
                >
                  <MagnifyingGlassPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="hidden md:block">
              <div className="relative h-[500px] rounded-lg border border-border bg-muted/30 overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div
                    className="relative overflow-hidden"
                    style={{ width: `${dividerPosition}%`, ...checkerboardStyle }}
                  >
                    <div className="absolute inset-0 p-4 flex items-center justify-center">
                      <motion.img
                        src={job.pngDataUrl}
                        alt="Original"
                        className="max-w-full max-h-full object-contain"
                        style={{ transform: `scale(${zoomLevel})` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        Original PNG
                      </Badge>
                    </div>
                  </div>

                  <DraggableDivider
                    defaultPosition={dividerPosition}
                    onPositionChange={onDividerChange}
                  />

                  <div
                    className="relative overflow-hidden"
                    style={{ width: `${100 - dividerPosition}%`, ...checkerboardStyle }}
                  >
                    <div className="absolute inset-0 p-4 flex items-center justify-center">
                      <motion.img
                        src={job.svgDataUrl}
                        alt="Converted"
                        className="max-w-full max-h-full object-contain"
                        style={{ transform: `scale(${zoomLevel})` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-cyan text-white text-xs">
                        Converted SVG
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:hidden gap-3" ref={previewRef}>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Original PNG
                </p>
                <div 
                  className="aspect-square rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center overflow-hidden touch-none"
                  style={checkerboardStyle}
                >
                  <motion.img
                    src={job.pngDataUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${zoomLevel})` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Converted SVG
                </p>
                <div 
                  className="aspect-square rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center overflow-hidden touch-none"
                  style={checkerboardStyle}
                >
                  <motion.img
                    src={job.svgDataUrl}
                    alt="Converted"
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${zoomLevel})` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 mt-6">
            <Button
              className="flex-1 gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => onDownload(job)}
            >
              <DownloadSimple weight="bold" />
              Download SVG
            </Button>
            {onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                title="Retry conversion with current settings"
              >
                <ArrowClockwise weight="bold" />
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onNewImage}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              New Image
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
