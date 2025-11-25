import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { ConversionSettings } from '@/lib/converter'

interface SettingsHistoryEntry {
  settings: ConversionSettings
  timestamp: number
}

export function useSettingsHistory(initialSettings: ConversionSettings) {
  const [settings, setSettings] = useState<ConversionSettings>(initialSettings)
  const [settingsHistory, setSettingsHistory] = useState<SettingsHistoryEntry[]>([])
  const [settingsHistoryIndex, setSettingsHistoryIndex] = useState(-1)

  const addToSettingsHistory = useCallback(
    (newSettings: ConversionSettings) => {
      setSettingsHistory((current) => {
        const newHistory = current.slice(0, settingsHistoryIndex + 1)
        return [...newHistory, { settings: newSettings, timestamp: Date.now() }]
      })
      setSettingsHistoryIndex((current) => current + 1)
    },
    [settingsHistoryIndex]
  )

  const handleSettingChange = useCallback(
    (key: keyof ConversionSettings, value: number) => {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      addToSettingsHistory(newSettings)
    },
    [settings, addToSettingsHistory]
  )

  const undoSettings = useCallback(() => {
    if (settingsHistoryIndex > 0) {
      const newIndex = settingsHistoryIndex - 1
      setSettingsHistoryIndex(newIndex)
      setSettings(settingsHistory[newIndex].settings)
      toast.info('Settings undone')
    }
  }, [settingsHistoryIndex, settingsHistory])

  const redoSettings = useCallback(() => {
    if (settingsHistoryIndex < settingsHistory.length - 1) {
      const newIndex = settingsHistoryIndex + 1
      setSettingsHistoryIndex(newIndex)
      setSettings(settingsHistory[newIndex].settings)
      toast.info('Settings redone')
    }
  }, [settingsHistoryIndex, settingsHistory])

  const updateSettings = useCallback((newSettings: ConversionSettings) => {
    setSettings(newSettings)
  }, [])

  return {
    settings,
    settingsHistory,
    settingsHistoryIndex,
    handleSettingChange,
    undoSettings,
    redoSettings,
    updateSettings,
  }
}
