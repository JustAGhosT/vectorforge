import { useState, useEffect, useCallback } from 'react'
import type { ConversionSettings } from '@/lib/converter'

export interface DraftState {
  settings: ConversionSettings
  filename?: string
  lastModified: number
}

const STORAGE_KEY = 'vectorforge-draft'
const AUTO_SAVE_DELAY = 2000 // 2 seconds
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function loadDraft(): DraftState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const draft = JSON.parse(stored)
      // Only return draft if it's less than 24 hours old
      if (Date.now() - draft.lastModified < DRAFT_EXPIRY_MS) {
        return draft
      }
    }
  } catch (error) {
    console.error('Failed to load draft:', error)
  }
  return null
}

function saveDraft(draft: DraftState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch (error) {
    console.error('Failed to save draft:', error)
  }
}

export function useAutoSaveDraft(settings: ConversionSettings, filename?: string) {
  const [hasDraft, setHasDraft] = useState(() => loadDraft() !== null)
  const [savedDraft, setSavedDraft] = useState<DraftState | null>(loadDraft)

  // Auto-save settings after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft: DraftState = {
        settings,
        filename,
        lastModified: Date.now(),
      }
      saveDraft(draft)
      setHasDraft(true)
      setSavedDraft(draft)
    }, AUTO_SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [settings, filename])

  const restoreDraft = useCallback((): DraftState | null => {
    return loadDraft()
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHasDraft(false)
    setSavedDraft(null)
  }, [])

  const getDraftAge = useCallback((): string | null => {
    if (!savedDraft) return null
    
    const diff = Date.now() - savedDraft.lastModified
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return null
  }, [savedDraft])

  return {
    hasDraft,
    savedDraft,
    restoreDraft,
    clearDraft,
    getDraftAge,
  }
}
