import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  convertImageToSvg,
  generateJobId,
  type ConversionJob,
  type ConversionSettings,
} from '@/lib/converter'
import type { WorkerMessage, WorkerResponse } from '@/lib/converter.worker'

export function useConversion(settings: ConversionSettings) {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const useWorker = useRef(true) // Enable worker by default

  // Initialize web worker for background processing
  useEffect(() => {
    if (typeof Worker !== 'undefined' && useWorker.current) {
      try {
        workerRef.current = new Worker(
          new URL('../lib/converter.worker.ts', import.meta.url),
          { type: 'module' }
        )
      } catch (error) {
        console.warn('Failed to create worker, using main thread:', error)
        useWorker.current = false
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  // Convert using web worker (for non-Potrace conversions, runs in background thread)
  const convertWithWorker = useCallback(
    async (imageData: ImageData, jobId: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not available'))
          return
        }

        const handleMessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.id !== jobId) return

          switch (e.data.type) {
            case 'progress':
              setProgress(e.data.progress || 0)
              break
            case 'success':
              workerRef.current?.removeEventListener('message', handleMessage)
              resolve(e.data.svg || '')
              break
            case 'error':
              workerRef.current?.removeEventListener('message', handleMessage)
              reject(new Error(e.data.error))
              break
          }
        }

        workerRef.current.addEventListener('message', handleMessage)

        const message: WorkerMessage = {
          type: 'convert',
          imageData,
          settings,
          id: jobId,
        }
        workerRef.current.postMessage(message)
      })
    },
    [settings]
  )

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
        const reader = new FileReader()
        const pngDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        let svgDataUrl: string
        let svgSize: number

        // Use worker for non-Potrace conversions (offload to background thread)
        // Potrace uses WASM which needs to run on main thread for now
        const canUseWorker = workerRef.current && !settings.usePotrace

        if (canUseWorker) {
          // Get ImageData for worker
          const imageData = await new Promise<ImageData>((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d', { willReadFrequently: true })
              if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
              }
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)
              resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = pngDataUrl
          })

          // Convert in background thread
          const jobId = generateJobId()
          const svg = await convertWithWorker(imageData, jobId)
          svgSize = svg.length
          const blob = new Blob([svg], { type: 'image/svg+xml' })
          svgDataUrl = URL.createObjectURL(blob)
        } else {
          // Use main thread for Potrace or fallback
          progressIntervalRef.current = setInterval(() => {
            setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
          }, 200)

          const result = await convertImageToSvg(file, settings)
          svgDataUrl = result.svgDataUrl
          svgSize = result.svgSize

          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
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
        const roundToOneDecimal = (n: number) => Math.round(n * 10) / 10
        const sizeRatio = file.size / svgSize
        let description: string
        if (sizeRatio > 1) {
          description = `${roundToOneDecimal(sizeRatio)}x smaller`
        } else if (sizeRatio < 1) {
          description = `SVG is ${roundToOneDecimal(svgSize / file.size)}x larger (normal for simple images)`
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
    [settings, convertWithWorker]
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
