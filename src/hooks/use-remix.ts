import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { parseLLMError } from '@/lib/utils'
import {
  addBorder,
  modifyBackground,
  addPathBorder,
  addShadow,
  applyTransform,
  convertToGrayscale,
  invertColors,
  simplifyPaths,
  convertFillToStroke,
  type BorderOptions,
  type BackgroundOptions,
  type PathBorderOptions,
  type ShadowOptions,
  type TransformOptions,
} from '@/lib/remix-transformations'

export interface RemixSuggestion {
  id: string
  title: string
  description: string
  category: 'improvement' | 'style' | 'optimization' | 'accessibility'
  priority: 'high' | 'medium' | 'low'
  transformationId?: string
}

export interface RemixAnalysis {
  overallScore: number
  suggestions: RemixSuggestion[]
  strengths: string[]
  weaknesses: string[]
  useCases: string[]
}

export interface RemixHistoryItem {
  id: string
  svgContent: string
  timestamp: number
  transformationName: string
}

export function useRemix() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<RemixAnalysis | null>(null)
  const [history, setHistory] = useState<RemixHistoryItem[]>([])
  const [currentSvg, setCurrentSvg] = useState<string | null>(null)

  /**
   * Analyze SVG with AI and get suggestions
   */
  const analyzeWithAI = useCallback(async (svgContent: string): Promise<RemixAnalysis> => {
    setIsAnalyzing(true)
    
    try {
      if (!window.spark?.llm) {
        throw new Error('AI service not available')
      }

      const prompt = `You are an expert SVG and logo design analyst. Analyze this SVG and provide improvement suggestions.

SVG Content:
\`\`\`xml
${svgContent.substring(0, 3000)}${svgContent.length > 3000 ? '...(truncated)' : ''}
\`\`\`

Analyze the SVG and provide:
1. An overall quality score (0-100)
2. Specific improvement suggestions
3. Current strengths
4. Current weaknesses
5. Recommended use cases

For suggestions, consider:
- Adding borders or strokes for better definition
- Background transparency or solid backgrounds
- Color improvements or simplification
- Path optimization
- Accessibility improvements
- Size and scaling considerations

Return a JSON object with this structure:
{
  "overallScore": 0-100,
  "suggestions": [
    {
      "id": "unique-id",
      "title": "Short title",
      "description": "Detailed description",
      "category": "improvement|style|optimization|accessibility",
      "priority": "high|medium|low",
      "transformationId": "optional-transformation-id"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "useCases": ["use case 1", "use case 2"]
}

Provide 3-6 suggestions. Return only valid JSON.`

      let response: string
      try {
        response = await window.spark.llm(prompt, 'gpt-4o-mini', false)
      } catch (error) {
        throw new Error(parseLLMError(error))
      }

      if (!response) {
        throw new Error('No response from AI service')
      }

      // Check for HTML error response
      if (response.includes('<!DOCTYPE') || response.includes('<html')) {
        throw new Error('LLM service returned an error. Please try again later.')
      }

      const parsed = JSON.parse(response)

      const result: RemixAnalysis = {
        overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore) || 70)),
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.slice(0, 10).map((s: Record<string, unknown>, i: number) => ({
              id: String(s.id || `suggestion-${i}`),
              title: String(s.title || 'Suggestion'),
              description: String(s.description || '').substring(0, 300),
              category: ['improvement', 'style', 'optimization', 'accessibility'].includes(String(s.category))
                ? String(s.category) as RemixSuggestion['category']
                : 'improvement',
              priority: ['high', 'medium', 'low'].includes(String(s.priority))
                ? String(s.priority) as RemixSuggestion['priority']
                : 'medium',
              transformationId: s.transformationId ? String(s.transformationId) : undefined,
            }))
          : [],
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.slice(0, 5).map((s: unknown) => String(s).substring(0, 200))
          : [],
        weaknesses: Array.isArray(parsed.weaknesses)
          ? parsed.weaknesses.slice(0, 5).map((s: unknown) => String(s).substring(0, 200))
          : [],
        useCases: Array.isArray(parsed.useCases)
          ? parsed.useCases.slice(0, 5).map((s: unknown) => String(s).substring(0, 200))
          : [],
      }

      setAnalysis(result)
      return result
    } catch (error) {
      console.error('AI analysis failed:', error)
      throw new Error(parseLLMError(error))
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Apply a transformation and add to history
   */
  const applyTransformation = useCallback((
    svgContent: string,
    transformationId: string,
    options?: Record<string, unknown>
  ): string => {
    let result = svgContent
    let transformationName = transformationId

    switch (transformationId) {
      case 'add-rectangle-border':
        result = addBorder(svgContent, { shape: 'rectangle', ...(options as BorderOptions) })
        transformationName = 'Rectangle Border'
        break
      case 'add-rounded-border':
        result = addBorder(svgContent, { shape: 'rounded', borderRadius: 8, ...(options as BorderOptions) })
        transformationName = 'Rounded Border'
        break
      case 'add-circle-border':
        result = addBorder(svgContent, { shape: 'circle', ...(options as BorderOptions) })
        transformationName = 'Circle Border'
        break
      case 'add-path-stroke':
        result = addPathBorder(svgContent, options as PathBorderOptions)
        transformationName = 'Path Stroke'
        break
      case 'remove-background':
        result = modifyBackground(svgContent, { remove: true })
        transformationName = 'Remove Background'
        break
      case 'add-white-background':
        result = modifyBackground(svgContent, { color: '#ffffff' })
        transformationName = 'White Background'
        break
      case 'add-shadow':
        result = addShadow(svgContent, options as ShadowOptions)
        transformationName = 'Drop Shadow'
        break
      case 'grayscale':
        result = convertToGrayscale(svgContent)
        transformationName = 'Grayscale'
        break
      case 'invert-colors':
        result = invertColors(svgContent)
        transformationName = 'Invert Colors'
        break
      case 'fill-to-stroke':
        result = convertFillToStroke(svgContent, (options as { strokeWidth?: number })?.strokeWidth || 2)
        transformationName = 'Fill to Stroke'
        break
      case 'simplify':
        result = simplifyPaths(svgContent, 1)
        transformationName = 'Simplify Paths'
        break
      case 'flip-horizontal':
        result = applyTransform(svgContent, { flipX: true })
        transformationName = 'Flip Horizontal'
        break
      case 'flip-vertical':
        result = applyTransform(svgContent, { flipY: true })
        transformationName = 'Flip Vertical'
        break
      case 'rotate-90':
        result = applyTransform(svgContent, { rotate: 90 })
        transformationName = 'Rotate 90°'
        break
      case 'scale-up':
        result = applyTransform(svgContent, { scale: 1.5 })
        transformationName = 'Scale Up 150%'
        break
      case 'scale-down':
        result = applyTransform(svgContent, { scale: 0.5 })
        transformationName = 'Scale Down 50%'
        break
      default:
        console.warn(`Unknown transformation: ${transformationId}`)
    }

    // Add to history
    const historyItem: RemixHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      svgContent: result,
      timestamp: Date.now(),
      transformationName,
    }
    setHistory(prev => [historyItem, ...prev].slice(0, 20))
    setCurrentSvg(result)

    return result
  }, [])

  /**
   * Restore from history
   */
  const restoreFromHistory = useCallback((historyItem: RemixHistoryItem): string => {
    setCurrentSvg(historyItem.svgContent)
    return historyItem.svgContent
  }, [])

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  /**
   * Clear analysis
   */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null)
  }, [])

  return {
    isAnalyzing,
    analysis,
    history,
    currentSvg,
    setCurrentSvg,
    analyzeWithAI,
    applyTransformation,
    restoreFromHistory,
    clearHistory,
    clearAnalysis,
  }
}
