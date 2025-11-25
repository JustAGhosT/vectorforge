import { convertImageDataToSVG, type ConversionSettings } from './pipeline'

export { type ConversionSettings } from './pipeline'

export interface ConversionJob {
  id: string
  filename: string
  timestamp: number
  originalSize: number
  svgSize: number
  settings: ConversionSettings
  pngDataUrl: string
  svgDataUrl: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  metadata?: Record<string, any>
}

export interface BatchConversionJob {
  id: string
  timestamp: number
  totalFiles: number
  completedFiles: number
  failedFiles: number
  jobs: ConversionJob[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export async function convertImageToSvg(
  file: File,
  settings: ConversionSettings,
  onProgress?: (stage: string, index: number, total: number) => void
): Promise<{ svgDataUrl: string; svgSize: number; metadata: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const img = new Image()
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          const { svg, size, metadata } = await convertImageDataToSVG(
            imageData,
            settings,
            onProgress
          )

          const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
          const svgDataUrl = URL.createObjectURL(svgBlob)

          resolve({
            svgDataUrl,
            svgSize: size,
            metadata,
          })
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function generateJobId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function convertMultipleImages(
  files: File[],
  settings: ConversionSettings,
  onProgress?: (completed: number, total: number) => void
): Promise<ConversionJob[]> {
  const jobs: ConversionJob[] = []
  let completed = 0

  for (const file of files) {
    try {
      const reader = new FileReader()
      const pngDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const { svgDataUrl, svgSize, metadata } = await convertImageToSvg(file, settings)

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
        metadata,
      }

      jobs.push(job)
      completed++
      onProgress?.(completed, files.length)
    } catch (error) {
      const job: ConversionJob = {
        id: generateJobId(),
        filename: file.name,
        timestamp: Date.now(),
        originalSize: file.size,
        svgSize: 0,
        settings: { ...settings },
        pngDataUrl: '',
        svgDataUrl: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Conversion failed',
      }

      jobs.push(job)
      completed++
      onProgress?.(completed, files.length)
    }
  }

  return jobs
}

export function downloadAllAsZip(jobs: ConversionJob[]): void {
  jobs.forEach((job) => {
    if (job.status === 'completed' && job.svgDataUrl) {
      const a = document.createElement('a')
      a.href = job.svgDataUrl
      a.download = job.filename.replace(/\.(png|jpg|jpeg|webp)$/i, '.svg')
      a.click()
    }
  })
}
