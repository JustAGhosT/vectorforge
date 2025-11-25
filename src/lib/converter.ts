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

export interface BatchConversionJob {
  id: string
  timestamp: number
  totalFiles: number
  completedFiles: number
  failedFiles: number
  jobs: ConversionJob[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export async function convertPngToSvg(
  file: File,
  settings: ConversionSettings
): Promise<{ svgDataUrl: string; svgSize: number }> {
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

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const svg = generateSvgFromImageData(imageData, settings)
        
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
        const svgDataUrl = URL.createObjectURL(svgBlob)
        
        resolve({
          svgDataUrl,
          svgSize: svg.length
        })
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function generateSvgFromImageData(
  imageData: ImageData,
  settings: ConversionSettings
): string {
  const { width, height, data } = imageData
  const { complexity, colorSimplification, pathSmoothing } = settings

  const threshold = 128
  const simplificationFactor = Math.floor(10 - (colorSimplification * 9))
  const smoothingFactor = pathSmoothing
  const detailLevel = Math.max(1, Math.floor(complexity * 10))

  const colors = extractColors(data, width, height, simplificationFactor)
  const paths: string[] = []

  colors.forEach(color => {
    const mask = createColorMask(data, width, height, color, threshold)
    const regions = findRegions(mask, width, height, detailLevel)
    
    regions.forEach(region => {
      const path = regionToPath(region, smoothingFactor)
      if (path) {
        paths.push(
          `<path d="${path}" fill="${color}" fill-opacity="${region.opacity}" />`
        )
      }
    })
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${paths.join('\n  ')}
</svg>`
}

function extractColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maxColors: number
): string[] {
  const colorMap = new Map<string, number>()

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a < 10) continue

    const quantizedR = Math.floor(r / 32) * 32
    const quantizedG = Math.floor(g / 32) * 32
    const quantizedB = Math.floor(b / 32) * 32

    const color = `rgb(${quantizedR},${quantizedG},${quantizedB})`
    colorMap.set(color, (colorMap.get(color) || 0) + 1)
  }

  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([color]) => color)
}

function createColorMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  targetColor: string,
  threshold: number
): boolean[] {
  const [r, g, b] = targetColor.match(/\d+/g)!.map(Number)
  const mask: boolean[] = []

  for (let i = 0; i < data.length; i += 4) {
    const pixelR = data[i]
    const pixelG = data[i + 1]
    const pixelB = data[i + 2]
    const pixelA = data[i + 3]

    if (pixelA < 10) {
      mask.push(false)
      continue
    }

    const distance = Math.sqrt(
      Math.pow(pixelR - r, 2) +
      Math.pow(pixelG - g, 2) +
      Math.pow(pixelB - b, 2)
    )

    mask.push(distance < threshold)
  }

  return mask
}

interface Region {
  points: Array<{ x: number; y: number }>
  opacity: number
}

function findRegions(
  mask: boolean[],
  width: number,
  height: number,
  detailLevel: number
): Region[] {
  const regions: Region[] = []
  const visited = new Array(mask.length).fill(false)
  const step = Math.max(1, Math.floor(11 - detailLevel))

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = y * width + x
      if (mask[idx] && !visited[idx]) {
        const region = floodFill(mask, visited, width, height, x, y, step)
        if (region.points.length > 4) {
          regions.push(region)
        }
      }
    }
  }

  return regions
}

function floodFill(
  mask: boolean[],
  visited: boolean[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  step: number
): Region {
  const points: Array<{ x: number; y: number }> = []
  const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }]

  while (stack.length > 0 && points.length < 1000) {
    const { x, y } = stack.pop()!
    const idx = y * width + x

    if (x < 0 || x >= width || y < 0 || y >= height) continue
    if (visited[idx] || !mask[idx]) continue

    visited[idx] = true
    points.push({ x, y })

    stack.push(
      { x: x + step, y },
      { x: x - step, y },
      { x, y: y + step },
      { x, y: y - step }
    )
  }

  return {
    points: convexHull(points),
    opacity: 0.95
  }
}

function convexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length < 3) return points

  points.sort((a, b) => a.x - b.x || a.y - b.y)

  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

  const lower: Array<{ x: number; y: number }> = []
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper: Array<{ x: number; y: number }> = []
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }

  lower.pop()
  upper.pop()

  return lower.concat(upper)
}

function regionToPath(region: Region, smoothing: number): string {
  if (region.points.length < 2) return ''

  const smoothedPoints = smoothing > 0.5 
    ? smoothPath(region.points, smoothing)
    : region.points

  let path = `M ${smoothedPoints[0].x} ${smoothedPoints[0].y}`

  for (let i = 1; i < smoothedPoints.length; i++) {
    const point = smoothedPoints[i]
    
    if (smoothing > 0.3) {
      const prev = smoothedPoints[i - 1]
      const cpX = (prev.x + point.x) / 2
      const cpY = (prev.y + point.y) / 2
      path += ` Q ${prev.x} ${prev.y}, ${cpX} ${cpY}`
    } else {
      path += ` L ${point.x} ${point.y}`
    }
  }

  path += ' Z'
  return path
}

function smoothPath(
  points: Array<{ x: number; y: number }>,
  factor: number
): Array<{ x: number; y: number }> {
  if (points.length < 3) return points

  const smoothed: Array<{ x: number; y: number }> = [points[0]]
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    const smoothedX = curr.x * (1 - factor) + (prev.x + next.x) / 2 * factor
    const smoothedY = curr.y * (1 - factor) + (prev.y + next.y) / 2 * factor

    smoothed.push({ x: smoothedX, y: smoothedY })
  }

  smoothed.push(points[points.length - 1])
  return smoothed
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

export async function convertMultiplePngs(
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

      const { svgDataUrl, svgSize } = await convertPngToSvg(file, settings)

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
      a.download = job.filename.replace(/\.png$/i, '.svg')
      a.click()
    }
  })
}
