import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  convertImageToSvg,
  generateJobId,
  type ConversionJob,
  type ConversionSettings,
} from '@/lib/converter'
import { parseLLMError } from '@/lib/utils'
import { llm } from '@/lib/llm'

export interface IterationResult {
  iteration: number
  job: ConversionJob
  likenessScore: number
  analysis: string
  settingsUsed: ConversionSettings
}

export interface IterativeConversionConfig {
  maxIterations: number
  targetLikeness: number
}

/** Default adjustment step when AI-suggested settings are unavailable */
const FALLBACK_ADJUSTMENT_STEP = 0.1

/**
 * Creates fallback settings by incrementally adjusting the current settings.
 * Used when AI suggestion fails or returns an error.
 */
function createFallbackSettings(currentSettings: ConversionSettings): ConversionSettings {
  return {
    complexity: Math.min(1, currentSettings.complexity + FALLBACK_ADJUSTMENT_STEP),
    colorSimplification: Math.max(0, currentSettings.colorSimplification - FALLBACK_ADJUSTMENT_STEP),
    pathSmoothing: Math.min(1, currentSettings.pathSmoothing + FALLBACK_ADJUSTMENT_STEP),
  }
}

export function useIterativeConversion(initialConfig: IterativeConversionConfig) {
  const [config, setConfig] = useState<IterativeConversionConfig>(initialConfig)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [iterations, setIterations] = useState<IterationResult[]>([])
  const [bestIteration, setBestIteration] = useState<IterationResult | null>(null)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef(false)

  const evaluateLikeness = useCallback(
    async (originalDataUrl: string, svgDataUrl: string): Promise<{ score: number; analysis: string }> => {
      try {
        const promptText = `You are an image quality evaluator. Compare the original image with the SVG conversion and provide a likeness score.

Original image (as data URL): ${originalDataUrl.substring(0, 200)}... (truncated)
SVG conversion (as data URL): ${svgDataUrl.substring(0, 200)}... (truncated)

Evaluate the SVG conversion based on:
1. Shape accuracy - how well shapes match the original
2. Color fidelity - how close colors are to the original
3. Detail preservation - important details retained
4. Overall visual similarity

Provide your response as a JSON object with:
- score: A number from 0-100 representing percentage likeness
- analysis: A brief explanation of the score (max 100 characters)

Example response:
{"score": 75, "analysis": "Good shape accuracy but colors slightly off, missing fine details"}

Be critical but fair. Most conversions will score between 60-85.`

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

        const result = JSON.parse(response)
        
        return {
          score: Math.min(100, Math.max(0, Number(result.score) || 0)),
          analysis: String(result.analysis || 'No analysis provided').substring(0, 150),
        }
      } catch (error) {
        console.error('AI evaluation failed:', error)
        throw new Error(parseLLMError(error))
      }
    },
    []
  )

  const suggestSettingsImprovement = useCallback(
    async (
      currentSettings: ConversionSettings,
      likenessScore: number,
      analysis: string,
      iteration: number
    ): Promise<ConversionSettings> => {
      try {
        const promptText = `You are an image conversion optimizer. Suggest better settings to improve the SVG conversion quality.

Current settings:
- complexity: ${currentSettings.complexity} (0-1, higher = more detail)
- colorSimplification: ${currentSettings.colorSimplification} (0-1, lower = more colors)
- pathSmoothing: ${currentSettings.pathSmoothing} (0-1, higher = smoother paths)

Current likeness score: ${likenessScore}%
Analysis: ${analysis}
Iteration: ${iteration}

Based on the analysis, suggest improved settings. Consider:
- If shapes are inaccurate: increase complexity
- If colors are off: decrease colorSimplification
- If edges are too jagged: increase pathSmoothing
- If too blurry/smooth: decrease pathSmoothing
- Make incremental adjustments (0.05-0.15 per iteration)

Provide your response as a JSON object with the three settings (each 0-1):
{"complexity": 0.65, "colorSimplification": 0.45, "pathSmoothing": 0.55}

Return only the JSON, no other text.`

        let response: string
        try {
          response = await llm(promptText, undefined, true)
        } catch (llmError) {
          console.error('Settings suggestion LLM call failed:', llmError)
          return createFallbackSettings(currentSettings)
        }

        // Check if response looks like an error page (HTML)
        if (response.includes('<!DOCTYPE') || response.includes('<html')) {
          console.error('Settings suggestion received HTML error page')
          return createFallbackSettings(currentSettings)
        }

        const suggested = JSON.parse(response)

        return {
          complexity: Math.min(1, Math.max(0, Number(suggested.complexity) || 0.5)),
          colorSimplification: Math.min(1, Math.max(0, Number(suggested.colorSimplification) || 0.5)),
          pathSmoothing: Math.min(1, Math.max(0, Number(suggested.pathSmoothing) || 0.5)),
        }
      } catch (error) {
        console.error('Settings suggestion failed:', error)
        return createFallbackSettings(currentSettings)
      }
    },
    []
  )

  const handleIterativeConversion = useCallback(
    async (file: File, initialSettings: ConversionSettings) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please upload an image file',
        })
        return null
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please upload a file smaller than 10MB',
        })
        return null
      }

      setIsProcessing(true)
      setCurrentIteration(0)
      setIterations([])
      setBestIteration(null)
      setProgress(0)
      abortRef.current = false

      let originalDataUrl = ''
      let currentSettings = { ...initialSettings }
      let bestResult: IterationResult | null = null
      const allIterations: IterationResult[] = []

      try {
        const reader = new FileReader()
        originalDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })

        toast.info('Starting iterative conversion...', {
          description: `Target: ${config.targetLikeness}% likeness, Max: ${config.maxIterations} iterations`,
        })

        for (let i = 0; i < config.maxIterations; i++) {
          if (abortRef.current) {
            toast.info('Conversion cancelled')
            break
          }

          setCurrentIteration(i + 1)
          setProgress(((i + 1) / config.maxIterations) * 100)

          const { svgDataUrl, svgSize } = await convertImageToSvg(file, currentSettings)

          const { score, analysis } = await evaluateLikeness(originalDataUrl, svgDataUrl)

          const job: ConversionJob = {
            id: generateJobId(),
            filename: file.name,
            timestamp: Date.now(),
            originalSize: file.size,
            svgSize,
            settings: { ...currentSettings },
            pngDataUrl: originalDataUrl,
            svgDataUrl,
            status: 'completed',
          }

          const iterationResult: IterationResult = {
            iteration: i + 1,
            job,
            likenessScore: score,
            analysis,
            settingsUsed: { ...currentSettings },
          }

          allIterations.push(iterationResult)
          setIterations([...allIterations])

          if (!bestResult || score > bestResult.likenessScore) {
            bestResult = iterationResult
            setBestIteration(bestResult)
          }

          toast.success(`Iteration ${i + 1} complete`, {
            description: `Likeness: ${score}% - ${analysis}`,
          })

          if (score >= config.targetLikeness) {
            toast.success('Target likeness achieved!', {
              description: `Reached ${score}% in ${i + 1} iterations`,
            })
            break
          }

          if (i < config.maxIterations - 1) {
            currentSettings = await suggestSettingsImprovement(
              currentSettings,
              score,
              analysis,
              i + 1
            )
          }

          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (!bestResult) {
          throw new Error('No successful conversions produced')
        }

        toast.success('Iterative conversion complete!', {
          description: `Best: ${bestResult.likenessScore}% (Iteration ${bestResult.iteration})`,
        })

        return bestResult
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed'

        toast.error('Iterative conversion failed', {
          description: errorMessage,
        })

        return null
      } finally {
        setIsProcessing(false)
        setProgress(100)
        abortRef.current = false
      }
    },
    [config, evaluateLikeness, suggestSettingsImprovement]
  )

  const cancelConversion = useCallback(() => {
    abortRef.current = true
    setIsProcessing(false)
    toast.info('Cancelling conversion...')
  }, [])

  const updateConfig = useCallback((newConfig: Partial<IterativeConversionConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
  }, [])

  return {
    config,
    updateConfig,
    isProcessing,
    currentIteration,
    progress,
    iterations,
    bestIteration,
    handleIterativeConversion,
    cancelConversion,
  }
}
