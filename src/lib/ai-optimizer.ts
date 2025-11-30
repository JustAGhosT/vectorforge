import type { ConversionSettings } from './converter'
import { parseLLMError } from './utils'
import { llm, isLLMConfigured } from './llm'

export interface AIOptimizationSuggestion {
  suggestedComplexity: number
  suggestedColorSimplification: number
  suggestedPathSmoothing: number
  reasoning: string
  imageType: 'photo' | 'logo' | 'illustration' | 'icon' | 'diagram' | 'text' | 'mixed'
  confidence: number
  estimatedQuality: 'excellent' | 'good' | 'fair' | 'poor'
  warnings?: string[]
}

export interface ImageAnalysis {
  dominantColors: string[]
  colorCount: number
  complexity: 'low' | 'medium' | 'high' | 'very-high'
  hasTransparency: boolean
  dimensions: { width: number; height: number }
  aspectRatio: number
}

export async function analyzeImageWithAI(
  imageDataUrl: string,
  currentSettings: ConversionSettings,
  imageAnalysis: ImageAnalysis
): Promise<AIOptimizationSuggestion> {
  const promptText = `You are an expert in vector graphics optimization and SVG conversion.

Analyze this image and provide optimal SVG conversion settings.

## Image Analysis Data:
- Dominant Colors: ${imageAnalysis.dominantColors.length} colors detected
- Total Unique Colors: ${imageAnalysis.colorCount}
- Complexity Level: ${imageAnalysis.complexity}
- Has Transparency: ${imageAnalysis.hasTransparency}
- Dimensions: ${imageAnalysis.dimensions.width}x${imageAnalysis.dimensions.height}px
- Aspect Ratio: ${imageAnalysis.aspectRatio.toFixed(2)}

## Current Settings (0-1 scale):
- Complexity: ${currentSettings.complexity} (controls detail level, higher = more detail)
- Color Simplification: ${currentSettings.colorSimplification} (higher = fewer colors)
- Path Smoothing: ${currentSettings.pathSmoothing} (higher = smoother curves)

## Your Task:
Classify the image type and recommend optimal settings for SVG conversion.

### Image Type Classifications:
- **photo**: Photographic images with gradients and complex detail
- **logo**: Brand logos with clean shapes and limited colors
- **illustration**: Artistic drawings with moderate detail
- **icon**: Simple symbolic graphics
- **diagram**: Charts, flowcharts, technical drawings
- **text**: Text-heavy images
- **mixed**: Combination of types

### Setting Recommendations (0-1 scale):
- **complexity**: 0.3-0.5 for icons/logos, 0.5-0.7 for illustrations, 0.7-0.9 for photos
- **colorSimplification**: 0.6-0.8 for simple graphics, 0.2-0.4 for detailed artwork
- **pathSmoothing**: 0.5-0.7 for geometric shapes, 0.3-0.5 for organic forms

### Quality Estimation:
- **excellent**: Perfect candidate for SVG (simple shapes, few colors)
- **good**: Will convert well with proper settings
- **fair**: May lose some detail but usable
- **poor**: Not ideal for SVG (too complex, better as raster)

## Response Format:
Return a JSON object with:
{
  "suggestedComplexity": 0.0-1.0,
  "suggestedColorSimplification": 0.0-1.0,
  "suggestedPathSmoothing": 0.0-1.0,
  "reasoning": "Brief explanation of why these settings were chosen",
  "imageType": "logo|icon|illustration|photo|diagram|text|mixed",
  "confidence": 0.0-1.0,
  "estimatedQuality": "excellent|good|fair|poor",
  "warnings": ["Optional array of warnings about potential issues"]
}`

  try {
    if (!isLLMConfigured()) {
      throw new Error('AI service not available')
    }

    let response: string
    try {
      response = await llm(promptText, undefined, true)
    } catch (llmError) {
      throw new Error(parseLLMError(llmError))
    }
    
    if (!response) {
      throw new Error('No response from AI service')
    }
    
    // Check if response looks like an error page (HTML)
    if (response.includes('<!DOCTYPE') || response.includes('<html')) {
      throw new Error('LLM service returned an error. Please try again later.')
    }

    const parsed = JSON.parse(response)
    
    if (!parsed.suggestedComplexity || !parsed.imageType) {
      throw new Error('Invalid AI response format')
    }
    
    return {
      suggestedComplexity: clamp(parsed.suggestedComplexity, 0, 1),
      suggestedColorSimplification: clamp(parsed.suggestedColorSimplification, 0, 1),
      suggestedPathSmoothing: clamp(parsed.suggestedPathSmoothing, 0, 1),
      reasoning: parsed.reasoning || 'AI analysis completed',
      imageType: parsed.imageType || 'mixed',
      confidence: clamp(parsed.confidence, 0, 1),
      estimatedQuality: parsed.estimatedQuality || 'good',
      warnings: parsed.warnings || [],
    }
  } catch (error) {
    console.error('AI optimization failed:', error)
    
    // Re-throw with clean error message
    const cleanMessage = parseLLMError(error)
    throw new Error(cleanMessage)
  }
}

export async function analyzeImageLocally(
  imageDataUrl: string
): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Image analysis timed out'))
    }, 10000)

    const img = new Image()
    
    img.onload = () => {
      try {
        if (!img.width || !img.height) {
          clearTimeout(timeoutId)
          reject(new Error('Invalid image dimensions'))
          return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        
        if (!ctx) {
          clearTimeout(timeoutId)
          reject(new Error('Failed to initialize canvas for analysis'))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const analysis = performLocalAnalysis(imageData)
        
        clearTimeout(timeoutId)
        resolve({
          ...analysis,
          dimensions: { width: img.width, height: img.height },
          aspectRatio: img.width / img.height,
        })
      } catch (error) {
        clearTimeout(timeoutId)
        reject(new Error(`Local analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    img.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error('Failed to load image for analysis'))
    }
    
    img.src = imageDataUrl
  })
}

function performLocalAnalysis(imageData: ImageData): Omit<ImageAnalysis, 'dimensions' | 'aspectRatio'> {
  const { data, width, height } = imageData
  const colorMap = new Map<string, number>()
  let hasTransparency = false
  let edgeCount = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a < 255) {
      hasTransparency = true
    }

    if (a > 10) {
      const quantizedR = Math.floor(r / 16) * 16
      const quantizedG = Math.floor(g / 16) * 16
      const quantizedB = Math.floor(b / 16) * 16
      const color = `${quantizedR},${quantizedG},${quantizedB}`
      colorMap.set(color, (colorMap.get(color) || 0) + 1)
    }

    if (i % 4 === 0 && i < data.length - width * 4) {
      const curr = data[i]
      const below = data[i + width * 4]
      if (Math.abs(curr - below) > 30) edgeCount++
    }
  }

  const uniqueColors = colorMap.size
  const topColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => `rgb(${color})`)

  const pixelCount = width * height
  const edgeDensity = edgeCount / pixelCount

  let complexity: 'low' | 'medium' | 'high' | 'very-high'
  if (edgeDensity < 0.1 && uniqueColors < 10) {
    complexity = 'low'
  } else if (edgeDensity < 0.2 && uniqueColors < 50) {
    complexity = 'medium'
  } else if (edgeDensity < 0.4 && uniqueColors < 200) {
    complexity = 'high'
  } else {
    complexity = 'very-high'
  }

  return {
    dominantColors: topColors,
    colorCount: uniqueColors,
    complexity,
    hasTransparency,
  }
}

export function getPresetForImageType(
  imageType: AIOptimizationSuggestion['imageType']
): ConversionSettings {
  const presets: Record<string, ConversionSettings> = {
    icon: {
      complexity: 0.4,
      colorSimplification: 0.7,
      pathSmoothing: 0.6,
    },
    logo: {
      complexity: 0.6,
      colorSimplification: 0.5,
      pathSmoothing: 0.6,
    },
    illustration: {
      complexity: 0.7,
      colorSimplification: 0.3,
      pathSmoothing: 0.5,
    },
    photo: {
      complexity: 0.85,
      colorSimplification: 0.15,
      pathSmoothing: 0.4,
    },
    diagram: {
      complexity: 0.5,
      colorSimplification: 0.6,
      pathSmoothing: 0.7,
    },
    text: {
      complexity: 0.3,
      colorSimplification: 0.8,
      pathSmoothing: 0.5,
    },
    mixed: {
      complexity: 0.6,
      colorSimplification: 0.4,
      pathSmoothing: 0.5,
    },
  }

  return presets[imageType] || presets.mixed
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
