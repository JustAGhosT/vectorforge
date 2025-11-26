import { useState, useCallback, useRef, useEffect } from 'react'
import type { ConversionSettings, ConversionJob } from '@/lib/converter'
import { generateJobId } from '@/lib/converter'
import { toast } from 'sonner'

interface WorkerMessage {
  type: 'convert'
  imageData: ImageData
  settings: ConversionSettings
  id: string
}

interface WorkerResponse {
  type: 'success' | 'error' | 'progress'
  id: string
  svg?: string
  progress?: number
  error?: string
}

export function useWorkerConversion(settings: ConversionSettings) {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerRef = useRef<Worker | null>(null)

  // Initialize worker
  useEffect(() => {
    // Check if Web Workers are supported
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../lib/converter.worker.ts', import.meta.url),
          { type: 'module' }
        )
      } catch (error) {
        console.warn('Failed to create worker, falling back to main thread:', error)
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const handleFileSelect = useCallback(
    async (file: File): Promise<ConversionJob | null> => {
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
        // Read file as data URL and get image data
        const pngDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })

        // Get ImageData from image
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

        // Try to use worker, fallback to main thread
        let svg: string

        if (workerRef.current) {
          svg = await new Promise<string>((resolve, reject) => {
            const id = generateJobId()
            
            const handleMessage = (e: MessageEvent<WorkerResponse>) => {
              if (e.data.id !== id) return

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

            workerRef.current!.addEventListener('message', handleMessage)

            const message: WorkerMessage = {
              type: 'convert',
              imageData,
              settings,
              id
            }
            workerRef.current!.postMessage(message)
          })
        } else {
          // Fallback to main thread (import converter dynamically)
          const { convertImageToSvg } = await import('@/lib/converter')
          const result = await convertImageToSvg(file, settings)
          svg = await fetch(result.svgDataUrl).then(r => r.text())
        }

        setProgress(100)

        const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
        const svgDataUrl = URL.createObjectURL(svgBlob)

        const job: ConversionJob = {
          id: generateJobId(),
          filename: file.name,
          timestamp: Date.now(),
          originalSize: file.size,
          svgSize: svg.length,
          settings: { ...settings },
          pngDataUrl,
          svgDataUrl,
          status: 'completed',
        }

        setCurrentJob(job)

        // Provide accurate feedback about the conversion result
        const roundToOneDecimal = (n: number) => Math.round(n * 10) / 10
        const sizeRatio = file.size / svg.length
        let description: string
        if (sizeRatio > 1) {
          description = `${roundToOneDecimal(sizeRatio)}x smaller`
        } else if (sizeRatio < 1) {
          description = `SVG is ${roundToOneDecimal(svg.length / file.size)}x larger (normal for simple images)`
        } else {
          description = 'Similar file size'
        }

        toast.success('Conversion complete!', {
          description,
        })

        return job
      } catch (error) {
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
    if (!currentFile) return null
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
    isWorkerSupported: typeof Worker !== 'undefined',
  }
}
