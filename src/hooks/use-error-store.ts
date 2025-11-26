import { useState, useCallback } from 'react'

export interface StoredError {
  id: string
  message: string
  timestamp: number
  source: 'ai' | 'conversion' | 'general'
  details?: string
}

export function useErrorStore() {
  const [errors, setErrors] = useState<StoredError[]>([])

  const addError = useCallback((error: Omit<StoredError, 'id' | 'timestamp'>) => {
    const newError: StoredError = {
      ...error,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    }
    setErrors((prev) => [...prev, newError])
    return newError.id
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const clearErrorsBySource = useCallback((source: StoredError['source']) => {
    setErrors((prev) => prev.filter((e) => e.source !== source))
  }, [])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    clearErrorsBySource,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
  }
}
