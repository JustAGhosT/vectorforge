import { useState, useCallback } from 'react'

export type ActivityType =
  | 'upload'
  | 'conversion'
  | 'ai-analysis'
  | 'ai-suggestion'
  | 'ai-iteration'
  | 'ai-chat'
  | 'remix'
  | 'settings'
  | 'download'
  | 'error'
  | 'system'

export interface ActivityLogEntry {
  id: string
  timestamp: number
  type: ActivityType
  title: string
  description: string
  details?: Record<string, unknown>
  status?: 'pending' | 'success' | 'error'
}

export function useActivityLog(maxEntries = 100) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])

  const addEntry = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    }

    setEntries((prev) => [newEntry, ...prev].slice(0, maxEntries))
    return newEntry.id
  }, [maxEntries])

  const updateEntry = useCallback((id: string, updates: Partial<Omit<ActivityLogEntry, 'id'>>) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    )
  }, [])

  const clearEntries = useCallback(() => {
    setEntries([])
  }, [])

  return {
    entries,
    addEntry,
    updateEntry,
    clearEntries,
  }
}
