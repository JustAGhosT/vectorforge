export interface ConversionSettings {
  complexity: number
  colorSimplification: number
  pathSmoothing: number
}

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
}

export async function convertImageToSvg(
  file: File,
  settings: ConversionSettings
): Promise<{ svgDataUrl: string; svgSize: number }> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Image conversion timed out after 30 seconds'))
    }, 30000)

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const img = new Image()
        
        img.onload = () => {
          try {
            if (!img.width || !img.height) {
              clearTimeout(timeoutId)
              reject(new Error('Invalid image dimensions'))
              return
            }

            if (img.width > 10000 || img.height > 10000) {
              clearTimeout(timeoutId)
              reject(new Error('Image dimensions too large (max 10000x10000)'))
              return
            }

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            
            if (!ctx) {
              clearTimeout(timeoutId)
              reject(new Error('Failed to initialize canvas context'))
              return
            }

            canvas.width = img.width
            canvas.height = img.height
            
            ctx.drawImage(img, 0, 0)

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const svg = generateSvgFromImageData(imageData, settings)
            
            if (!svg || svg.length === 0) {
              clearTimeout(timeoutId)
              reject(new Error('Failed to generate SVG data'))
              return
            }
            
            const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
            const svgDataUrl = URL.createObjectURL(svgBlob)
            
            clearTimeout(timeoutId)
            resolve({
              svgDataUrl,
              svgSize: svg.length
            })
          } catch (error) {
            clearTimeout(timeoutId)
            reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
          }
        }

        img.onerror = () => {
          clearTimeout(timeoutId)
          reject(new Error('Failed to load image. File may be corrupted or in an unsupported format.'))
        }
        
        img.src = e.target?.result as string
      } catch (error) {
        clearTimeout(timeoutId)
        reject(new Error(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error('Failed to read file. Please check file permissions and try again.'))
    }
    
    try {
      reader.readAsDataURL(file)
    } catch (error) {
      clearTimeout(timeoutId)
      reject(new Error(`Failed to start file reading: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  })
}

function generateSvgFromImageData(
  imageData: ImageData,
  settings: ConversionSettings
): string {
  const { width, height, data } = imageData
  const { complexity, colorSimplification, pathSmoothing } = settings

  const colorCount = Math.max(4, Math.floor(256 - (colorSimplification * 240)))
  const detailThreshold = Math.max(2, Math.floor(50 - (complexity * 45)))
  const smoothness = pathSmoothing

  const quantizedData = quantizeColors(data, colorCount)
  const colorLayers = extractColorLayers(quantizedData, width, height)
  const paths: string[] = []

  colorLayers.forEach(({ color, pixels }) => {
    const contours = traceContours(pixels, width, height, detailThreshold)
    
    contours.forEach(contour => {
      if (contour.length < 3) return
      
      const smoothedContour = smoothness > 0.3 
        ? applyCatmullRomSpline(contour, smoothness)
        : contour
      
      const pathData = contourToPath(smoothedContour, smoothness)
      if (pathData) {
        paths.push(`<path d="${pathData}" fill="${color}" />`)
      }
    })
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${paths.join('\n  ')}
</svg>`
}

function quantizeColors(data: Uint8ClampedArray, levels: number): Uint8ClampedArray {
  const quantized = new Uint8ClampedArray(data.length)
  const step = Math.max(1, Math.floor(256 / levels))

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    
    if (a < 10) {
      quantized[i] = quantized[i + 1] = quantized[i + 2] = 255
      quantized[i + 3] = 0
      continue
    }

    quantized[i] = Math.round(data[i] / step) * step
    quantized[i + 1] = Math.round(data[i + 1] / step) * step
    quantized[i + 2] = Math.round(data[i + 2] / step) * step
    quantized[i + 3] = 255
  }

  return quantized
}

interface ColorLayer {
  color: string
  pixels: boolean[]
}

function extractColorLayers(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ColorLayer[] {
  const colorMap = new Map<string, number>()

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 10) continue

    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const color = `rgb(${r},${g},${b})`
    
    colorMap.set(color, (colorMap.get(color) || 0) + 1)
  }

  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)

  return sortedColors.map(color => {
    const [r, g, b] = color.match(/\d+/g)!.map(Number)
    const pixels: boolean[] = []

    for (let i = 0; i < data.length; i += 4) {
      const pixelR = data[i]
      const pixelG = data[i + 1]
      const pixelB = data[i + 2]
      const pixelA = data[i + 3]

      pixels.push(
        pixelA >= 10 && 
        pixelR === r && 
        pixelG === g && 
        pixelB === b
      )
    }

    return { color, pixels }
  })
}

interface Point {
  x: number
  y: number
}

function traceContours(
  pixels: boolean[],
  width: number,
  height: number,
  minSize: number
): Point[][] {
  const visited = new Array(pixels.length).fill(false)
  const contours: Point[][] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      
      if (pixels[idx] && !visited[idx]) {
        const contour = marchingSquares(pixels, visited, width, height, x, y)
        
        if (contour.length >= minSize) {
          contours.push(contour)
        }
      }
    }
  }

  return contours
}

function marchingSquares(
  pixels: boolean[],
  visited: boolean[],
  width: number,
  height: number,
  startX: number,
  startY: number
): Point[] {
  const contour: Point[] = []
  const queue: Point[] = [{ x: startX, y: startY }]

  while (queue.length > 0) {
    const { x, y } = queue.shift()!
    const idx = y * width + x

    if (x < 0 || x >= width || y < 0 || y >= height) continue
    if (visited[idx] || !pixels[idx]) continue

    visited[idx] = true

    const isEdge = 
      x === 0 || x === width - 1 || 
      y === 0 || y === height - 1 ||
      !pixels[idx - 1] ||
      !pixels[idx + 1] ||
      !pixels[idx - width] ||
      !pixels[idx + width]

    if (isEdge) {
      contour.push({ x, y })
    }

    queue.push(
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    )
  }

  return simplifyContour(contour, 1.5)
}

function simplifyContour(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points

  const douglasPeucker = (pts: Point[], eps: number): Point[] => {
    if (pts.length < 3) return pts

    let maxDist = 0
    let maxIndex = 0
    const first = pts[0]
    const last = pts[pts.length - 1]

    for (let i = 1; i < pts.length - 1; i++) {
      const dist = perpendicularDistance(pts[i], first, last)
      if (dist > maxDist) {
        maxDist = dist
        maxIndex = i
      }
    }

    if (maxDist > eps) {
      const left = douglasPeucker(pts.slice(0, maxIndex + 1), eps)
      const right = douglasPeucker(pts.slice(maxIndex), eps)
      return left.slice(0, -1).concat(right)
    }

    return [first, last]
  }

  return douglasPeucker(points, tolerance)
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + 
      Math.pow(point.y - lineStart.y, 2)
    )
  }

  const t = Math.max(0, Math.min(1,
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
  ))

  const projX = lineStart.x + t * dx
  const projY = lineStart.y + t * dy

  return Math.sqrt(
    Math.pow(point.x - projX, 2) + 
    Math.pow(point.y - projY, 2)
  )
}

function applyCatmullRomSpline(points: Point[], tension: number): Point[] {
  if (points.length < 4) return points

  const result: Point[] = []
  const alpha = Math.min(0.5, tension)

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const segments = 5
    for (let t = 0; t < segments; t++) {
      const tt = t / segments

      const t2 = tt * tt
      const t3 = t2 * tt

      const x = 0.5 * (
        2 * p1.x +
        (-p0.x + p2.x) * tt +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      )

      const y = 0.5 * (
        2 * p1.y +
        (-p0.y + p2.y) * tt +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      )

      result.push({ 
        x: p1.x * (1 - alpha) + x * alpha, 
        y: p1.y * (1 - alpha) + y * alpha 
      })
    }
  }

  result.push(points[points.length - 1])
  return result
}

function contourToPath(points: Point[], smoothness: number): string {
  if (points.length < 2) return ''

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  if (smoothness > 0.5 && points.length >= 3) {
    for (let i = 1; i < points.length; i++) {
      const curr = points[i]
      const prev = points[i - 1]
      const next = points[(i + 1) % points.length]

      const cp1x = prev.x + (curr.x - prev.x) * 0.5
      const cp1y = prev.y + (curr.y - prev.y) * 0.5
      const cp2x = curr.x - (next.x - curr.x) * 0.25
      const cp2y = curr.y - (next.y - curr.y) * 0.25

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`
    }
  }

  path += ' Z'
  return path
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

      const { svgDataUrl, svgSize } = await convertImageToSvg(file, settings)

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

