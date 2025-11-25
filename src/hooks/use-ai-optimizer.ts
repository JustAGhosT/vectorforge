import { useState, useCallback } from 'react'
import type { ConversionSettings } from '@/lib/converter'
import {
  analyzeImageWithAI,
  analyzeImageLocally,
  getPresetForImageType,
  type AIOptimizationSuggestion,
  type ImageAnalysis,
} from '@/lib/ai-optimizer'

interface UseAIOptimizerState {
  suggestion: AIOptimizationSuggestion | null
  analysis: ImageAnalysis | null
  isAnalyzing: boolean
  error: string | null
}

export function useAIOptimizer() {
  const [state, setState] = useState<UseAIOptimizerState>({
    suggestion: null,
    analysis: null,
    isAnalyzing: false,
    error: null,
  })

  const analyzeImage = useCallback(
    async (imageDataUrl: string, currentSettings: ConversionSettings) => {
      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }))

      try {
        const localAnalysis = await analyzeImageLocally(imageDataUrl)
        
        setState((prev) => ({ ...prev, analysis: localAnalysis }))

        const aiSuggestion = await analyzeImageWithAI(
          imageDataUrl,
          currentSettings,
          localAnalysis
        )

        setState({
          suggestion: aiSuggestion,
          analysis: localAnalysis,
          isAnalyzing: false,
          error: null,
        })

        return aiSuggestion
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to analyze image'
        
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMessage,
        }))

        throw error
      }
    },
    []
  )

  const getQuickPreset = useCallback((imageType: AIOptimizationSuggestion['imageType']) => {
    return getPresetForImageType(imageType)
  }, [])

  const clearSuggestion = useCallback(() => {
    setState({
      suggestion: null,
      analysis: null,
      isAnalyzing: false,
      error: null,
    })
  }, [])

  return {
    suggestion: state.suggestion,
    analysis: state.analysis,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    analyzeImage,
    getQuickPreset,
    clearSuggestion,
  }
}
