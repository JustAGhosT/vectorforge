import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  convertMultipleImages,
  downloadAllAsZip,
  type ConversionJob,
  type ConversionSettings,
} from '@/lib/converter'

export function useBatchConversion(settings: ConversionSettings) {
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchJobs, setBatchJobs] = useState<ConversionJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })

  const handleBatchFilesSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      toast.error('No image files found', {
        description: 'Please select image files (PNG, JPG, WebP)',
      })
      return
    }

    if (imageFiles.length > 50) {
      toast.error('Too many files', {
        description: 'Please select up to 50 files at a time',
      })
      return
    }

    setBatchFiles(imageFiles)
    setBatchJobs([])
    toast.info(`${imageFiles.length} files selected`, {
      description: 'Ready to convert',
    })
  }, [])

  const removeBatchFile = useCallback((index: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleBatchConvert = useCallback(async () => {
    if (batchFiles.length === 0) return []

    setIsProcessing(true)
    setProgress({ completed: 0, total: batchFiles.length })
    setBatchJobs([])

    try {
      const jobs = await convertMultipleImages(
        batchFiles,
        settings,
        (completed, total) => {
          setProgress({ completed, total })
        }
      )

      setBatchJobs(jobs)

      const successCount = jobs.filter((j) => j.status === 'completed').length
      const failCount = jobs.filter((j) => j.status === 'failed').length

      if (failCount === 0) {
        toast.success('Batch conversion complete!', {
          description: `${successCount} files converted successfully`,
        })
      } else {
        toast.warning('Batch conversion finished', {
          description: `${successCount} succeeded, ${failCount} failed`,
        })
      }

      return jobs
    } catch (error) {
      toast.error('Batch conversion failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
      return []
    } finally {
      setIsProcessing(false)
    }
  }, [batchFiles, settings])

  const handleDownloadAllBatch = useCallback(() => {
    if (batchJobs.length === 0) return

    const successJobs = batchJobs.filter((j) => j.status === 'completed')
    downloadAllAsZip(successJobs)

    toast.success('Downloading all files', {
      description: `${successJobs.length} SVG files`,
    })
  }, [batchJobs])

  const clearBatch = useCallback(() => {
    setBatchFiles([])
    setBatchJobs([])
    setProgress({ completed: 0, total: 0 })
  }, [])

  const retryFailedJob = useCallback(async (failedJob: ConversionJob) => {
    // Find the original file from batchFiles
    const fileToRetry = batchFiles.find(f => f.name === failedJob.filename)
    if (!fileToRetry) {
      toast.error('Cannot retry', {
        description: 'Original file not found',
      })
      return
    }

    try {
      const jobs = await convertMultipleImages(
        [fileToRetry],
        settings,
        () => {}
      )

      if (jobs.length > 0 && jobs[0].status === 'completed') {
        // Replace the failed job with the successful one
        setBatchJobs(prev => prev.map(j => 
          j.id === failedJob.id ? jobs[0] : j
        ))
        toast.success('Retry successful', {
          description: `${failedJob.filename} converted successfully`,
        })
      } else {
        toast.error('Retry failed', {
          description: jobs[0]?.error || 'Conversion failed again',
        })
      }
    } catch (error) {
      toast.error('Retry failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }, [batchFiles, settings])

  return {
    batchFiles,
    batchJobs,
    isProcessing,
    progress,
    handleBatchFilesSelect,
    removeBatchFile,
    handleBatchConvert,
    handleDownloadAllBatch,
    clearBatch,
    retryFailedJob,
  }
}
