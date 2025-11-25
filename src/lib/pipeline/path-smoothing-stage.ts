import type { PipelineContext, Point, Contour } from './types'

export class PathSmoothingStage {
  name = 'PathSmoothing'

  execute(context: PipelineContext): PipelineContext {
    if (!context.contours) {
      throw new Error('Contours must be traced before path smoothing')
    }

    const { contours, settings } = context
    const smoothness = settings.pathSmoothing

    const smoothedContours = new Map<string, Contour[]>()

    for (const [color, colorContours] of contours.entries()) {
      const smoothed = colorContours.map((contour) => ({
        ...contour,
        points:
          smoothness > 0.3
            ? this.applyBezierSmoothing(contour.points, smoothness)
            : contour.points,
      }))
      smoothedContours.set(color, smoothed)
    }

    return {
      ...context,
      contours: smoothedContours,
      metadata: {
        ...context.metadata,
        smoothingMethod: smoothness > 0.3 ? 'bezier' : 'none',
        smoothingLevel: smoothness,
      },
    }
  }

  private applyBezierSmoothing(points: Point[], tension: number): Point[] {
    if (points.length < 4) return points

    const result: Point[] = []
    const alpha = Math.min(0.6, tension)

    for (let i = 0; i < points.length; i++) {
      const p0 = points[i > 0 ? i - 1 : points.length - 1]
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      const p3 = points[(i + 2) % points.length]

      const segments = Math.max(3, Math.floor(10 * tension))

      for (let t = 0; t < segments; t++) {
        const tt = t / segments
        const point = this.catmullRomInterpolate(p0, p1, p2, p3, tt, alpha)
        result.push(point)
      }
    }

    return this.removeDuplicatePoints(result)
  }

  private catmullRomInterpolate(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    t: number,
    alpha: number
  ): Point {
    const t2 = t * t
    const t3 = t2 * t

    const x =
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)

    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)

    return {
      x: p1.x * (1 - alpha) + x * alpha,
      y: p1.y * (1 - alpha) + y * alpha,
    }
  }

  private removeDuplicatePoints(points: Point[]): Point[] {
    if (points.length === 0) return points

    const result: Point[] = [points[0]]
    const threshold = 0.5

    for (let i = 1; i < points.length; i++) {
      const prev = result[result.length - 1]
      const curr = points[i]

      const dist = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )

      if (dist >= threshold) {
        result.push(curr)
      }
    }

    return result
  }
}
