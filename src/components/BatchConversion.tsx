import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Files,
  FileImage,
  Sparkle,
  X,
  Trash,
  Check,
  Warning,
  DownloadSimple,
} from '@phosphor-icons/react'
import { ConversionJob, formatFileSize } from '@/lib/converter'
import { cn } from '@/lib/utils'

interface BatchConversionProps {
  batchFiles: File[]
  batchJobs: ConversionJob[]
  isProcessing: boolean
  progress: { completed: number; total: number }
  isDragging: boolean
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onFileSelect: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onConvert: () => void
  onDownload: (job: ConversionJob) => void
  onDownloadAll: () => void
  onClear: () => void
}

export function BatchConversion({
  batchFiles,
  batchJobs,
  isProcessing,
  progress,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onRemoveFile,
  onConvert,
  onDownload,
  onDownloadAll,
  onClear,
}: BatchConversionProps) {
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold">Batch Conversion</h3>
        {batchFiles.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-2">
            <Trash weight="bold" />
            Clear All
          </Button>
        )}
      </div>

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-all duration-300 cursor-pointer mb-4',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isProcessing && 'pointer-events-none opacity-60'
        )}
        onClick={() => batchFileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={batchFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          multiple
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files)}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-3 md:mb-4">
            <Files className="w-6 h-6 md:w-8 md:h-8 text-primary" weight="bold" />
          </div>
          <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
            Select multiple image files
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
            Upload up to 50 files at once (10MB each max)
          </p>
          <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0">
            Select Files
          </Button>
        </motion.div>
      </div>

      {batchFiles.length > 0 && !isProcessing && batchJobs.length === 0 && (
        <BatchFileList
          files={batchFiles}
          onRemove={onRemoveFile}
          onConvert={onConvert}
        />
      )}

      {isProcessing && (
        <BatchProgress completed={progress.completed} total={progress.total} />
      )}

      {batchJobs.length > 0 && !isProcessing && (
        <BatchResults
          jobs={batchJobs}
          onDownload={onDownload}
          onDownloadAll={onDownloadAll}
        />
      )}
    </Card>
  )
}

function BatchFileList({
  files,
  onRemove,
  onConvert,
}: {
  files: File[]
  onRemove: (index: number) => void
  onConvert: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {files.length} file{files.length > 1 ? 's' : ''} ready
        </p>
        <Button onClick={onConvert} className="gap-2 min-h-[44px] md:min-h-0">
          <Sparkle weight="fill" />
          Convert All
        </Button>
      </div>

      <ScrollArea className="h-[300px] rounded-lg border border-border">
        <div className="p-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileImage
                  className="w-5 h-5 text-muted-foreground flex-shrink-0"
                  weight="bold"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="flex-shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  )
}

function BatchProgress({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="text-center py-8">
        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4 animate-pulse">
          <Sparkle className="w-8 h-8 text-primary" weight="fill" />
        </div>
        <p className="text-sm font-medium mb-2">Converting files...</p>
        <p className="text-xs text-muted-foreground mb-4">
          {completed} of {total} complete
        </p>
        <Progress
          value={(completed / total) * 100}
          className="h-2 max-w-md mx-auto"
        />
      </div>
    </motion.div>
  )
}

function BatchResults({
  jobs,
  onDownload,
  onDownloadAll,
}: {
  jobs: ConversionJob[]
  onDownload: (job: ConversionJob) => void
  onDownloadAll: () => void
}) {
  const successCount = jobs.filter((j) => j.status === 'completed').length
  const failCount = jobs.filter((j) => j.status === 'failed').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-primary" weight="bold" />
          <div>
            <p className="font-medium text-sm">Conversion Complete</p>
            <p className="text-xs text-muted-foreground">
              {successCount} succeeded
              {failCount > 0 && `, ${failCount} failed`}
            </p>
          </div>
        </div>
        <Button
          onClick={onDownloadAll}
          className="gap-2 min-h-[44px] md:min-h-0"
        >
          <DownloadSimple weight="bold" />
          Download All
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-lg border border-border">
        <div className="p-4 space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                job.status === 'completed'
                  ? 'bg-muted/30 hover:bg-muted/50'
                  : 'bg-destructive/10'
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {job.status === 'completed' ? (
                  <Check
                    className="w-5 h-5 text-primary flex-shrink-0"
                    weight="bold"
                  />
                ) : (
                  <Warning
                    className="w-5 h-5 text-destructive flex-shrink-0"
                    weight="bold"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{job.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.status === 'completed'
                      ? `${formatFileSize(job.originalSize)} → ${formatFileSize(job.svgSize)}`
                      : job.error || 'Failed to convert'}
                  </p>
                </div>
              </div>
              {job.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(job)}
                  className="flex-shrink-0 gap-2 min-h-[44px] md:min-h-0"
                >
                  <DownloadSimple weight="bold" className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  )
}
