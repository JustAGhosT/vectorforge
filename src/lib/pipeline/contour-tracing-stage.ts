import type { PipelineContext, Point, Contour } from './types'

export class ContourTracingStage {
  name = 'ContourTracing'

  execute(context: PipelineContext): PipelineContext {
    if (!context.colorLayers) {
      throw new Error('Color layers must be extracted before contour tracing')
    }

    const { colorLayers, width, height, settings } = context
    const detailThreshold = this.calculateDetailThreshold(settings.complexity)

    const contours = new Map<string, Contour[]>()

    for (const layer of colorLayers) {
      const layerContours = this.traceContours(
        layer.pixels,
        width,
        height,
        detailThreshold
      )
      contours.set(layer.color, layerContours)
    }

    return {
      ...context,
      contours,
      metadata: {
        ...context.metadata,
        detailThreshold,
        totalContours: Array.from(contours.values()).reduce(
          (sum, c) => sum + c.length,
          0
        ),
      },
    }
  }

  private calculateDetailThreshold(complexity: number): number {
    return Math.max(2, Math.floor(50 - complexity * 45))
  }

  private traceContours(
    pixels: boolean[],
    width: number,
    height: number,
    minSize: number
  ): Contour[] {
    const visited = new Array(pixels.length).fill(false)
    const contours: Contour[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x

        if (pixels[idx] && !visited[idx]) {
          const points = this.improvedMarchingSquares(
            pixels,
            visited,
            width,
            height,
            x,
            y
          )

          if (points.length >= minSize) {
            const area = this.calculateContourArea(points)
            contours.push({
              points,
              closed: true,
              area,
            })
          }
        }
      }
    }

    return contours
  }

  private improvedMarchingSquares(
    pixels: boolean[],
    visited: boolean[],
    width: number,
    height: number,
    startX: number,
    startY: number
  ): Point[] {
    const edgePoints: Point[] = []
    const queue: Point[] = [{ x: startX, y: startY }]
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
    ]

    while (queue.length > 0) {
      const { x, y } = queue.shift()!
      const idx = y * width + x

      if (x < 0 || x >= width || y < 0 || y >= height) continue
      if (visited[idx] || !pixels[idx]) continue

      visited[idx] = true

      const isEdge = this.isEdgePixel(pixels, width, height, x, y)

      if (isEdge) {
        edgePoints.push({ x, y })
      }

      for (const dir of directions) {
        queue.push({ x: x + dir.x, y: y + dir.y })
      }
    }

    return this.orderEdgePoints(edgePoints)
  }

  private isEdgePixel(
    pixels: boolean[],
    width: number,
    height: number,
    x: number,
    y: number
  ): boolean {
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      return true
    }

    const idx = y * width + x
    const neighbors = [
      pixels[idx - 1],
      pixels[idx + 1],
      pixels[idx - width],
      pixels[idx + width],
      pixels[idx - width - 1],
      pixels[idx - width + 1],
      pixels[idx + width - 1],
      pixels[idx + width + 1],
    ]

    return neighbors.some((n) => !n)
  }

  private orderEdgePoints(points: Point[]): Point[] {
    if (points.length < 2) return points

    const ordered: Point[] = [points[0]]
    const remaining = new Set(points.slice(1))

    while (remaining.size > 0) {
      const last = ordered[ordered.length - 1]
      let nearest: Point | null = null
      let minDist = Infinity

      for (const point of remaining) {
        const dist = this.distance(last, point)
        if (dist < minDist) {
          minDist = dist
          nearest = point
        }
      }

      if (nearest) {
        ordered.push(nearest)
        remaining.delete(nearest)
      } else {
        break
      }
    }

    return this.simplifyDouglasPeucker(ordered, 1.5)
  }

  private simplifyDouglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length < 3) return points

    const simplify = (pts: Point[], eps: number): Point[] => {
      if (pts.length < 3) return pts

      let maxDist = 0
      let maxIndex = 0
      const first = pts[0]
      const last = pts[pts.length - 1]

      for (let i = 1; i < pts.length - 1; i++) {
        const dist = this.perpendicularDistance(pts[i], first, last)
        if (dist > maxDist) {
          maxDist = dist
          maxIndex = i
        }
      }

      if (maxDist > eps) {
        const left = simplify(pts.slice(0, maxIndex + 1), eps)
        const right = simplify(pts.slice(maxIndex), eps)
        return left.slice(0, -1).concat(right)
      }

      return [first, last]
    }

    return simplify(points, tolerance)
  }

  private perpendicularDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y

    if (dx === 0 && dy === 0) {
      return this.distance(point, lineStart)
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
          (dx * dx + dy * dy)
      )
    )

    const projX = lineStart.x + t * dx
    const projY = lineStart.y + t * dy

    return this.distance(point, { x: projX, y: projY })
  }

  private distance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }

  private calculateContourArea(points: Point[]): number {
    if (points.length < 3) return 0

    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }

    return Math.abs(area / 2)
  }
}
