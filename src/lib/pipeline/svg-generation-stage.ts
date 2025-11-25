import type { PipelineContext, PathElement, Point } from './types'

export class SVGGenerationStage {
  name = 'SVGGeneration'

  execute(context: PipelineContext): PipelineContext {
    if (!context.contours) {
      throw new Error('Contours must be traced before SVG generation')
    }

    const { contours, width, height, settings } = context
    const paths: PathElement[] = []

    for (const [color, colorContours] of contours.entries()) {
      for (const contour of colorContours) {
        if (contour.points.length < 3) continue

        const pathData = this.generatePathData(
          contour.points,
          settings.pathSmoothing
        )

        if (pathData) {
          paths.push({
            d: pathData,
            fill: color,
            opacity: 1,
          })
        }
      }
    }

    return {
      ...context,
      paths,
      metadata: {
        ...context.metadata,
        pathCount: paths.length,
        svgSize: this.estimateSVGSize(paths, width, height),
      },
    }
  }

  private generatePathData(points: Point[], smoothness: number): string {
    if (points.length < 2) return ''

    let path = `M ${this.formatNumber(points[0].x)} ${this.formatNumber(points[0].y)}`

    if (smoothness > 0.5 && points.length >= 3) {
      path += this.generateCubicBezierPath(points)
    } else if (smoothness > 0.2 && points.length >= 3) {
      path += this.generateQuadraticBezierPath(points)
    } else {
      path += this.generateLinearPath(points)
    }

    path += ' Z'
    return path
  }

  private generateCubicBezierPath(points: Point[]): string {
    let path = ''

    for (let i = 1; i < points.length; i++) {
      const curr = points[i]
      const prev = points[i - 1]
      const next = points[(i + 1) % points.length]
      const nextNext = points[(i + 2) % points.length]

      const cp1x = prev.x + (curr.x - prev.x) * 0.6
      const cp1y = prev.y + (curr.y - prev.y) * 0.6
      const cp2x = curr.x - (next.x - curr.x) * 0.3
      const cp2y = curr.y - (next.y - curr.y) * 0.3

      path += ` C ${this.formatNumber(cp1x)} ${this.formatNumber(cp1y)}, ${this.formatNumber(cp2x)} ${this.formatNumber(cp2y)}, ${this.formatNumber(curr.x)} ${this.formatNumber(curr.y)}`
    }

    return path
  }

  private generateQuadraticBezierPath(points: Point[]): string {
    let path = ''

    for (let i = 1; i < points.length; i++) {
      const curr = points[i]
      const prev = points[i - 1]

      const cpx = (prev.x + curr.x) / 2
      const cpy = (prev.y + curr.y) / 2

      path += ` Q ${this.formatNumber(cpx)} ${this.formatNumber(cpy)}, ${this.formatNumber(curr.x)} ${this.formatNumber(curr.y)}`
    }

    return path
  }

  private generateLinearPath(points: Point[]): string {
    let path = ''

    for (let i = 1; i < points.length; i++) {
      path += ` L ${this.formatNumber(points[i].x)} ${this.formatNumber(points[i].y)}`
    }

    return path
  }

  private formatNumber(num: number): string {
    return num.toFixed(2)
  }

  private estimateSVGSize(
    paths: PathElement[],
    width: number,
    height: number
  ): number {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
`
    const footer = `</svg>`

    const pathsSize = paths.reduce((sum, path) => {
      return (
        sum +
        `  <path d="${path.d}" fill="${path.fill}" opacity="${path.opacity}" />\n`
          .length
      )
    }, 0)

    return header.length + pathsSize + footer.length
  }
}
