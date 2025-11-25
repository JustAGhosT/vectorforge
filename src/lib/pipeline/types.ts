export interface Point {
  x: number
  y: number
}

export interface ColorRGB {
  r: number
  g: number
  b: number
  a: number
}

export interface ColorLayer {
  color: string
  pixels: boolean[]
  area: number
}

export interface Contour {
  points: Point[]
  closed: boolean
  area: number
}

export interface PipelineContext {
  imageData: ImageData
  settings: ConversionSettings
  width: number
  height: number
  colorLayers?: ColorLayer[]
  contours?: Map<string, Contour[]>
  paths?: PathElement[]
  metadata?: Record<string, any>
}

export interface PathElement {
  d: string
  fill: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export interface ConversionSettings {
  complexity: number
  colorSimplification: number
  pathSmoothing: number
}

export interface PipelineStage<TInput = PipelineContext, TOutput = PipelineContext> {
  name: string
  execute(input: TInput): Promise<TOutput> | TOutput
}

export interface ConversionPipeline {
  stages: PipelineStage[]
  execute(context: PipelineContext): Promise<PipelineContext>
}
