import { useState, useCallback, useEffect } from 'react'
import type { ComparisonResult } from '@/lib/ai-comparison'

export interface ComparisonHistoryEntry {
  id: string
  comparison: ComparisonResult
  filename: string
  iteration?: number
  timestamp: number
}

const MAX_HISTORY_ITEMS = 20
const STORAGE_KEY = 'vectorforge-comparison-history'

function loadHistoryFromStorage(): ComparisonHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load comparison history:', error)
  }
  return []
}

function saveHistoryToStorage(history: ComparisonHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save comparison history:', error)
  }
}

export function useComparisonHistory() {
  const [history, setHistory] = useState<ComparisonHistoryEntry[]>(loadHistoryFromStorage)

  // Persist to localStorage whenever history changes
  useEffect(() => {
    saveHistoryToStorage(history)
  }, [history])

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
      timestamp: Date.now(),
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
