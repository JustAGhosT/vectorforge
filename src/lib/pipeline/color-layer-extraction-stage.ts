import type { PipelineContext, ColorLayer } from './types'

export class ColorLayerExtractionStage {
  name = 'ColorLayerExtraction'

  execute(context: PipelineContext): PipelineContext {
    const { imageData, width, height } = context
    const { data } = imageData

    const colorMap = this.buildColorMap(data)
    const colorLayers = this.extractLayers(data, colorMap, width, height)

    return {
      ...context,
      colorLayers,
      metadata: {
        ...context.metadata,
        uniqueColors: colorMap.size,
        layers: colorLayers.length,
      },
    }
  }

  private buildColorMap(data: Uint8ClampedArray): Map<string, number> {
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

    return colorMap
  }

  private extractLayers(
    data: Uint8ClampedArray,
    colorMap: Map<string, number>,
    width: number,
    height: number
  ): ColorLayer[] {
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color, count]) => ({ color, count }))

    return sortedColors.map(({ color, count }) => {
      const [r, g, b] = color.match(/\d+/g)!.map(Number)
      const pixels: boolean[] = []

      for (let i = 0; i < data.length; i += 4) {
        const pixelR = data[i]
        const pixelG = data[i + 1]
        const pixelB = data[i + 2]
        const pixelA = data[i + 3]

        pixels.push(
          pixelA >= 10 && pixelR === r && pixelG === g && pixelB === b
        )
      }

      return {
        color,
        pixels,
        area: count,
      }
    })
  }
}
