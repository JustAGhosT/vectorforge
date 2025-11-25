export type OutputFormat = 'svg' | 'png' | 'jpg' | 'webp'

export interface FormatConversionOptions {
  quality?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
}

export async function convertImageFormat(
  sourceFile: File,
  targetFormat: OutputFormat,
  options: FormatConversionOptions = {}
): Promise<{ dataUrl: string; size: number }> {
  const {
    quality = 0.92,
    width,
    height,
    maintainAspectRatio = true,
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        let targetWidth = width || img.width
        let targetHeight = height || img.height

        if (width && height && maintainAspectRatio) {
          const aspectRatio = img.width / img.height
          if (width / height > aspectRatio) {
            targetWidth = height * aspectRatio
          } else {
            targetHeight = width / aspectRatio
          }
        } else if (width && !height) {
          const aspectRatio = img.width / img.height
          targetHeight = width / aspectRatio
        } else if (height && !width) {
          const aspectRatio = img.width / img.height
          targetWidth = height * aspectRatio
        }

        canvas.width = targetWidth
        canvas.height = targetHeight

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        const mimeType = getMimeType(targetFormat)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }

            const dataUrl = URL.createObjectURL(blob)
            resolve({
              dataUrl,
              size: blob.size,
            })
          },
          mimeType,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(sourceFile)
  })
}

function getMimeType(format: OutputFormat): string {
  const mimeTypes: Record<OutputFormat, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
  }
  return mimeTypes[format]
}

export function getFileExtension(format: OutputFormat): string {
  const extensions: Record<OutputFormat, string> = {
    svg: '.svg',
    png: '.png',
    jpg: '.jpg',
    webp: '.webp',
  }
  return extensions[format]
}

export function changeFileExtension(filename: string, newFormat: OutputFormat): string {
  const baseName = filename.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
  return baseName + getFileExtension(newFormat)
}
