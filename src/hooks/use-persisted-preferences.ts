import { useState, useEffect, useCallback } from 'react'

interface UserPreferences {
  usePotrace: boolean
  enableAIIterative: boolean
  showCheckerboard: boolean
}

const STORAGE_KEY = 'vectorforge-preferences'

const DEFAULT_PREFERENCES: UserPreferences = {
  usePotrace: true,
  enableAIIterative: true,
  showCheckerboard: false,
}

function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  }
  return DEFAULT_PREFERENCES
}

function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

export function usePersistedPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)

  // Save to localStorage whenever preferences change
  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [])

  return {
    preferences,
    updatePreference,
    setPreferences,
  }
}
