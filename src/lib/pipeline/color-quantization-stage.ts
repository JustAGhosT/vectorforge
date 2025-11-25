import type { PipelineContext, ColorLayer, ColorRGB } from './types'

export class ColorQuantizationStage {
  name = 'ColorQuantization'

  execute(context: PipelineContext): PipelineContext {
    const { imageData, settings } = context
    const { data } = imageData

    const colorCount = this.calculateColorCount(settings.colorSimplification)
    const quantized = this.quantizeWithMedianCut(data, colorCount)

    const updatedImageData = context.imageData
    updatedImageData.data.set(quantized)

    return {
      ...context,
      imageData: updatedImageData,
      metadata: {
        ...context.metadata,
        targetColorCount: colorCount,
        quantizationMethod: 'median-cut',
      },
    }
  }

  private calculateColorCount(simplification: number): number {
    return Math.max(4, Math.floor(256 - simplification * 240))
  }

  private quantizeWithMedianCut(
    data: Uint8ClampedArray,
    targetColors: number
  ): Uint8ClampedArray {
    const pixels: ColorRGB[] = []

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 10) continue

      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a,
      })
    }

    const palette = this.medianCut(pixels, targetColors)
    const quantized = new Uint8ClampedArray(data.length)

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]

      if (a < 10) {
        quantized[i] = quantized[i + 1] = quantized[i + 2] = 255
        quantized[i + 3] = 0
        continue
      }

      const color = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a,
      }

      const nearest = this.findNearestColor(color, palette)
      quantized[i] = nearest.r
      quantized[i + 1] = nearest.g
      quantized[i + 2] = nearest.b
      quantized[i + 3] = 255
    }

    return quantized
  }

  private medianCut(pixels: ColorRGB[], depth: number): ColorRGB[] {
    if (depth === 0 || pixels.length === 0) {
      return [this.averageColor(pixels)]
    }

    const ranges = {
      r: this.getColorRange(pixels, 'r'),
      g: this.getColorRange(pixels, 'g'),
      b: this.getColorRange(pixels, 'b'),
    }

    const largestRange = Object.entries(ranges).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as 'r' | 'g' | 'b'

    pixels.sort((a, b) => a[largestRange] - b[largestRange])

    const mid = Math.floor(pixels.length / 2)
    const left = pixels.slice(0, mid)
    const right = pixels.slice(mid)

    return [
      ...this.medianCut(left, depth - 1),
      ...this.medianCut(right, depth - 1),
    ]
  }

  private getColorRange(pixels: ColorRGB[], channel: 'r' | 'g' | 'b'): number {
    if (pixels.length === 0) return 0

    const values = pixels.map((p) => p[channel])
    return Math.max(...values) - Math.min(...values)
  }

  private averageColor(pixels: ColorRGB[]): ColorRGB {
    if (pixels.length === 0) {
      return { r: 0, g: 0, b: 0, a: 255 }
    }

    const sum = pixels.reduce(
      (acc, p) => ({
        r: acc.r + p.r,
        g: acc.g + p.g,
        b: acc.b + p.b,
        a: 255,
      }),
      { r: 0, g: 0, b: 0, a: 255 }
    )

    return {
      r: Math.round(sum.r / pixels.length),
      g: Math.round(sum.g / pixels.length),
      b: Math.round(sum.b / pixels.length),
      a: 255,
    }
  }

  private findNearestColor(color: ColorRGB, palette: ColorRGB[]): ColorRGB {
    let nearest = palette[0]
    let minDistance = this.colorDistance(color, nearest)

    for (let i = 1; i < palette.length; i++) {
      const distance = this.colorDistance(color, palette[i])
      if (distance < minDistance) {
        minDistance = distance
        nearest = palette[i]
      }
    }

    return nearest
  }

  private colorDistance(a: ColorRGB, b: ColorRGB): number {
    const dr = a.r - b.r
    const dg = a.g - b.g
    const db = a.b - b.b
    return dr * dr + dg * dg + db * db
  }
}
