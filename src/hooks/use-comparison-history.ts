import { useState, useCallback } from 'react'
import type { ComparisonResult } from '@/lib/ai-comparison'

export interface ComparisonHistoryEntry {
  id: string
  comparison: ComparisonResult
  filename: string
  iteration?: number
}

const MAX_HISTORY_ITEMS = 20

export function useComparisonHistory() {
  const [history, setHistory] = useState<ComparisonHistoryEntry[]>([])

  const addComparison = useCallback((
    comparison: ComparisonResult,
    filename: string,
    iteration?: number
  ) => {
    const entry: ComparisonHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      comparison,
      filename,
      iteration,
    }

    setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY_ITEMS))
    return entry
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id))
  }, [])

  return {
    history,
    addComparison,
    clearHistory,
    removeEntry,
  }
}
