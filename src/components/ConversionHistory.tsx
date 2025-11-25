import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClockCounterClockwise, FileImage, DownloadSimple } from '@phosphor-icons/react'
import { ConversionJob, formatFileSize } from '@/lib/converter'

interface ConversionHistoryProps {
  history: ConversionJob[]
  onLoadItem: (job: ConversionJob) => void
  onDownload: (job: ConversionJob) => void
}

export function ConversionHistory({
  history,
  onLoadItem,
  onDownload,
}: ConversionHistoryProps) {
  const getSizeReduction = (job: ConversionJob) => {
    const reduction = ((job.originalSize - job.svgSize) / job.originalSize) * 100
    return Math.max(0, Math.round(reduction))
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Conversion History</h3>
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <ClockCounterClockwise
              className="w-8 h-8 text-muted-foreground"
              weight="bold"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            No conversions yet. Upload a PNG to get started!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold mb-4">Conversion History</h3>
      <ScrollArea className="h-[400px] md:h-[600px] pr-4">
        <div className="space-y-3">
          {history.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="p-3 md:p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onLoadItem(job)}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={job.pngDataUrl}
                      alt={job.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileImage
                          className="w-4 h-4 text-muted-foreground flex-shrink-0"
                          weight="bold"
                        />
                        <p className="font-medium text-sm truncate">
                          {job.filename}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDownload(job)
                        }}
                      >
                        <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {new Date(job.timestamp).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(job.originalSize)}</span>
                      <span>→</span>
                      <span>{formatFileSize(job.svgSize)}</span>
                      {getSizeReduction(job) > 0 && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="h-5 text-xs">
                            {getSizeReduction(job)}% smaller
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
