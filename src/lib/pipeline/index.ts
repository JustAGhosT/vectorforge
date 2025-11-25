import { ConversionPipeline } from './pipeline'
import { ColorQuantizationStage } from './color-quantization-stage'
import { ColorLayerExtractionStage } from './color-layer-extraction-stage'
import { ContourTracingStage } from './contour-tracing-stage'
import { PathSmoothingStage } from './path-smoothing-stage'
import { SVGGenerationStage } from './svg-generation-stage'
import type { PipelineContext, ConversionSettings } from './types'

export { ConversionPipeline } from './pipeline'
export { ColorQuantizationStage } from './color-quantization-stage'
export { ColorLayerExtractionStage } from './color-layer-extraction-stage'
export { ContourTracingStage } from './contour-tracing-stage'
export { PathSmoothingStage } from './path-smoothing-stage'
export { SVGGenerationStage } from './svg-generation-stage'
export * from './types'

export function createDefaultPipeline(): ConversionPipeline {
  return new ConversionPipeline([
    new ColorQuantizationStage(),
    new ColorLayerExtractionStage(),
    new ContourTracingStage(),
    new PathSmoothingStage(),
    new SVGGenerationStage(),
  ])
}

export function createMinimalPipeline(): ConversionPipeline {
  return new ConversionPipeline([
    new ColorLayerExtractionStage(),
    new ContourTracingStage(),
    new SVGGenerationStage(),
  ])
}

export function createHighQualityPipeline(): ConversionPipeline {
  return new ConversionPipeline([
    new ColorQuantizationStage(),
    new ColorLayerExtractionStage(),
    new ContourTracingStage(),
    new PathSmoothingStage(),
    new SVGGenerationStage(),
  ])
}

export async function convertImageDataToSVG(
  imageData: ImageData,
  settings: ConversionSettings,
  onProgress?: (stage: string, index: number, total: number) => void
): Promise<{ svg: string; size: number; metadata: Record<string, any> }> {
  const pipeline = createDefaultPipeline()

  const context: PipelineContext = {
    imageData,
    settings,
    width: imageData.width,
    height: imageData.height,
    metadata: {},
  }

  const result = await pipeline.execute(context, onProgress)

  if (!result.paths) {
    throw new Error('SVG generation failed: no paths created')
  }

  const svg = renderSVG(result.width, result.height, result.paths)

  return {
    svg,
    size: svg.length,
    metadata: result.metadata || {},
  }
}

function renderSVG(
  width: number,
  height: number,
  paths: Array<{ d: string; fill: string; opacity?: number }>
): string {
  const pathElements = paths
    .map((path) => {
      const opacity = path.opacity !== undefined && path.opacity < 1
        ? ` opacity="${path.opacity.toFixed(2)}"`
        : ''
      return `  <path d="${path.d}" fill="${path.fill}"${opacity} />`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${pathElements}
</svg>`
}
