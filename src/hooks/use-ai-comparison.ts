import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { analyzeConversionComparison, type ComparisonResult } from '@/lib/ai-comparison'
import { parseLLMError } from '@/lib/utils'

interface UseAIComparisonState {
  comparison: ComparisonResult | null
  isAnalyzing: boolean
  error: string | null
}

export function useAIComparison() {
  const [state, setState] = useState<UseAIComparisonState>({
    comparison: null,
    isAnalyzing: false,
    error: null,
  })

  const analyzeComparison = useCallback(
    async (originalDataUrl: string, svgDataUrl: string): Promise<ComparisonResult | null> => {
      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }))

      try {
        const result = await analyzeConversionComparison(originalDataUrl, svgDataUrl)

        setState({
          comparison: result,
          isAnalyzing: false,
          error: null,
        })

        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : parseLLMError(error)

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

  const clearComparison = useCallback(() => {
    setState({
      comparison: null,
      isAnalyzing: false,
      error: null,
    })
  }, [])

  return {
    comparison: state.comparison,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    analyzeComparison,
    clearComparison,
  }
}
