import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  convertImageToSvg,
  generateJobId,
  type ConversionJob,
  type ConversionSettings,
} from '@/lib/converter'

export function useConversion(settings: ConversionSettings) {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please upload an image file (PNG, JPG, WebP)',
        })
        return null
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please upload a file smaller than 10MB',
        })
        return null
      }

      setCurrentFile(file)
      setIsProcessing(true)
      setProgress(0)

      try {
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
        }, 200)

        const reader = new FileReader()
        const pngDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        const { svgDataUrl, svgSize } = await convertImageToSvg(file, settings)

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        setProgress(100)

        const job: ConversionJob = {
          id: generateJobId(),
          filename: file.name,
          timestamp: Date.now(),
          originalSize: file.size,
          svgSize,
          settings: { ...settings },
          pngDataUrl,
          svgDataUrl,
          status: 'completed',
        }

        setCurrentJob(job)

        // Provide accurate feedback about the conversion result
        const sizeRatio = file.size / svgSize
        let description: string
        if (sizeRatio > 1) {
          description = `${Math.round(sizeRatio * 10) / 10}x smaller`
        } else if (sizeRatio < 1) {
          const increase = Math.round((svgSize / file.size) * 10) / 10
          description = `SVG is ${increase}x larger (normal for simple images)`
        } else {
          description = 'Similar file size'
        }

        toast.success('Conversion complete!', {
          description,
        })

        return job
      } catch (error) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        
        const failedJob: ConversionJob = {
          id: generateJobId(),
          filename: file.name,
          timestamp: Date.now(),
          originalSize: file.size,
          svgSize: 0,
          settings: { ...settings },
          pngDataUrl: '',
          svgDataUrl: '',
          status: 'failed',
          error: errorMessage,
        }
        
        setCurrentJob(failedJob)
        
        toast.error('Conversion failed', {
          description: errorMessage,
        })
        
        return failedJob
      } finally {
        setIsProcessing(false)
      }
    },
    [settings]
  )

  const handleReconvert = useCallback(async () => {
    if (!currentFile) return
    return await handleFileSelect(currentFile)
  }, [currentFile, handleFileSelect])

  const clearJob = useCallback(() => {
    setCurrentJob(null)
    setCurrentFile(null)
    setProgress(0)
  }, [])

  return {
    currentFile,
    currentJob,
    isProcessing,
    progress,
    handleFileSelect,
    handleReconvert,
    clearJob,
    setCurrentJob,
  }
}
