import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { motion } from 'framer-motion'
import {
  UploadSimple,
  Sparkle,
  DownloadSimple,
  ClockCounterClockwise,
  Command,
  Check,
  Files,
  BookOpen,
  ArrowLeft,
  Robot,
  WarningCircle,
  Activity,
  ChatCircle,
  SidebarSimple,
  MagicWand,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ConversionJob } from '@/lib/converter'
import type { ConversionPreset } from '@/lib/presets'
import { setupConnectionMonitoring } from '@/lib/connection'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useConversion } from '@/hooks/use-conversion'
import { useBatchConversion } from '@/hooks/use-batch-conversion'
import { useSettingsHistory } from '@/hooks/use-settings-history'
import { useAIOptimizer } from '@/hooks/use-ai-optimizer'
import { useIterativeConversion } from '@/hooks/use-iterative-conversion'
import { useErrorStore } from '@/hooks/use-error-store'
import { useActivityLog } from '@/hooks/use-activity-log'
import { useAIComparison } from '@/hooks/use-ai-comparison'
import { usePersistedPreferences } from '@/hooks/use-persisted-preferences'
import { useComparisonHistory } from '@/hooks/use-comparison-history'
import { UploadZone } from '@/components/UploadZone'
import { ConversionPreview } from '@/components/ConversionPreview'
import { SettingsPanel, SettingsInfoCard } from '@/components/SettingsPanel'
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal'
import { AISuggestionCard } from '@/components/AISuggestionCard'
import { ComparisonCard } from '@/components/ComparisonCard'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SkipLink, LiveRegion } from '@/components/AccessibilityComponents'
import { SettingsHistoryTimeline } from '@/components/SettingsHistoryTimeline'
import { ErrorLogDialog } from '@/components/ErrorLogDialog'
import { ActivityLogPanel } from '@/components/ActivityLogPanel'
import { AIChatPanel } from '@/components/AIChatPanel'
import { SvgPostProcessingPanel } from '@/components/SvgPostProcessingPanel'

// Lazy load heavy components for code splitting
const BatchConversion = lazy(() => import('@/components/BatchConversion').then(m => ({ default: m.BatchConversion })))
const ConversionHistory = lazy(() => import('@/components/ConversionHistory').then(m => ({ default: m.ConversionHistory })))
const FormatGuide = lazy(() => import('@/components/FormatGuide').then(m => ({ default: m.FormatGuide })))
const MultiFormatConverter = lazy(() => import('@/components/MultiFormatConverter').then(m => ({ default: m.MultiFormatConverter })))
const IterativeConverter = lazy(() => import('@/components/IterativeConverter').then(m => ({ default: m.IterativeConverter })))
const RemixPage = lazy(() => import('@/components/RemixPage').then(m => ({ default: m.RemixPage })))

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

function App() {
  const isMobile = useIsMobile()
  const [history, setHistory] = useKV<ConversionJob[]>('conversion-history', [])
  const [isDragging, setIsDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dividerPosition, setDividerPosition] = useState(50)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [showSettingsHistory, setShowSettingsHistory] = useState(false)
  const [currentPage, setCurrentPage] = useState<'converter' | 'formats'>('converter')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showErrorLog, setShowErrorLog] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState<'activity' | 'chat' | 'postprocess'>('activity')
  const [activeMainTab, setActiveMainTab] = useState('convert')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentSvgContent, setCurrentSvgContent] = useState<string | null>(null)

  // Persisted user preferences
  const { preferences, updatePreference } = usePersistedPreferences()
  const { history: comparisonHistory, addComparison } = useComparisonHistory()

  const { errors, addError, removeError, clearErrors, hasErrors, errorCount } = useErrorStore()
  const { entries: activityEntries, addEntry: addActivityEntry, updateEntry: updateActivityEntry, clearEntries: clearActivityEntries } = useActivityLog()

  // Helper function to add activity log entries
  const logActivity = useCallback((title: string, description: string, type: 'upload' | 'conversion' | 'ai-analysis' | 'ai-suggestion' | 'ai-iteration' | 'ai-chat' | 'settings' | 'download' | 'error' | 'system' = 'system', status?: 'pending' | 'success' | 'error', details?: Record<string, unknown>) => {
    return addActivityEntry({ title, description, type, status, details })
  }, [addActivityEntry])

  // Helper function to update an existing activity log entry
  const updateActivity = useCallback((id: string, title: string, description: string, status: 'pending' | 'success' | 'error', details?: Record<string, unknown>) => {
    updateActivityEntry(id, { title, description, status, details })
  }, [updateActivityEntry])

  const {
    settings,
    settingsHistory,
    settingsHistoryIndex,
    handleSettingChange,
    undoSettings,
    redoSettings,
    updateSettings,
  } = useSettingsHistory({
    complexity: 0.5,
    colorSimplification: 0.5,
    pathSmoothing: 0.5,
    usePotrace: preferences.usePotrace,
  })

  const {
    currentFile,
    currentJob,
    isProcessing: isConversionProcessing,
    progress,
    handleFileSelect,
    handleReconvert,
    setCurrentJob,
    clearJob,
  } = useConversion(settings)

  const {
    batchFiles,
    batchJobs,
    isProcessing: isBatchProcessing,
    progress: batchProgress,
    handleBatchFilesSelect,
    removeBatchFile,
    handleBatchConvert,
    handleDownloadAllBatch,
    clearBatch,
    retryFailedJob,
  } = useBatchConversion(settings)

  const {
    suggestion,
    analysis,
    isAnalyzing,
    error: aiError,
    analyzeImage,
    clearSuggestion,
  } = useAIOptimizer()

  const {
    config: iterativeConfig,
    updateConfig: updateIterativeConfig,
    isProcessing: isIterativeProcessing,
    currentIteration,
    progress: iterativeProgress,
    iterations,
    bestIteration,
    handleIterativeConversion,
    cancelConversion: cancelIterative,
  } = useIterativeConversion({
    maxIterations: 5,
    targetLikeness: 80,
  })

  const {
    comparison,
    isAnalyzing: isComparingImages,
    analyzeComparison,
    clearComparison,
  } = useAIComparison()

  const isProcessing = isConversionProcessing || isBatchProcessing || isIterativeProcessing || isComparingImages

  // Helper function to run AI comparison after conversion
  const runAIComparison = useCallback(async (pngDataUrl: string, svgDataUrl: string, filename?: string, iteration?: number) => {
    const comparisonActivityId = logActivity('AI Comparison started', 'Analyzing conversion quality...', 'ai-analysis', 'pending')
    try {
      const comparisonResult = await analyzeComparison(pngDataUrl, svgDataUrl)
      if (comparisonResult) {
        // Add to comparison history
        addComparison(comparisonResult, filename || 'Unknown', iteration)
        
        updateActivity(
          comparisonActivityId,
          'AI Comparison complete',
          `Similarity: ${comparisonResult.similarityScore}% (${comparisonResult.confidence}% confidence)`,
          'success'
        )
        toast.success('AI Comparison Complete', {
          description: `${comparisonResult.similarityScore}% similar with ${comparisonResult.confidence}% confidence`,
        })
      } else {
        updateActivity(comparisonActivityId, 'AI Comparison complete', 'No comparison data available', 'success')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI comparison failed'
      updateActivity(comparisonActivityId, 'AI Comparison failed', errorMessage, 'error', { stack: error instanceof Error ? error.stack : undefined })
      // Don't show error toast for comparison - it's an optional feature
      console.error('AI comparison error:', errorMessage)
    }
  }, [logActivity, updateActivity, analyzeComparison, addComparison])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )

      if (files.length === 0) {
        toast.error('No image files found', {
          description: 'Please drop image files (PNG, JPG, WebP)',
        })
        logActivity('Invalid file drop', 'No valid image files were found', 'error', 'error', { reason: 'No valid image files in drop' })
        return
      }

      if (files.length === 1) {
        // Clear previous job before processing new file
        clearJob()
        clearComparison()
        const uploadActivityId = logActivity('Image uploaded', `Processing ${files[0].name}`, 'upload', 'pending')
        const job = await handleFileSelect(files[0])
        if (job) {
          updateActivity(uploadActivityId, 'Image uploaded', `${files[0].name} processed successfully`, 'success')
          logActivity('Conversion complete', `${files[0].name} converted successfully`, 'conversion', 'success')
          setHistory((current) => [job, ...(current || [])].slice(0, 20))
          
          // If AI Iterative is enabled, run iterative conversion after initial conversion
          if (preferences.enableAIIterative && job.status === 'completed') {
            toast.info('Starting AI Iterative Refinement...', {
              description: 'Automatically improving conversion quality',
            })
            const iterativeActivityId = logActivity('AI Iterative started', 'Running automatic quality improvement', 'ai-iteration', 'pending')
            
            try {
              const result = await handleIterativeConversion(files[0], settings)
              if (result) {
                setCurrentJob(result.job)
                updateSettings(result.settingsUsed)
                setHistory((current) => [result.job, ...(current || [])].slice(0, 20))
                updateActivity(iterativeActivityId, 'AI Iterative complete', `Best result: ${result.likenessScore}% likeness`, 'success')
                
                toast.success('AI Iterative Refinement Complete!', {
                  description: `Best result: ${result.likenessScore}% likeness`,
                })
              } else {
                updateActivity(iterativeActivityId, 'AI Iterative complete', 'No improvement found', 'success')
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'AI Iterative conversion failed'
              updateActivity(iterativeActivityId, 'AI Iterative failed', errorMessage, 'error', { stack: error instanceof Error ? error.stack : undefined })
              addError({
                message: 'AI Iterative Refinement Failed',
                source: 'ai',
                details: errorMessage,
              })
              toast.error('AI Iterative Refinement Failed', {
                description: errorMessage,
                duration: Infinity,
                action: {
                  label: 'View Details',
                  onClick: () => setShowErrorLog(true),
                },
              })
            }
          } else if (job.status === 'completed') {
            // Auto-run AI comparison after successful conversion
            await runAIComparison(job.pngDataUrl, job.svgDataUrl, files[0].name)
          }
        } else {
          updateActivity(uploadActivityId, 'Image upload failed', `Failed to process ${files[0].name}`, 'error')
        }
      } else {
        logActivity('Batch upload', `${files.length} files selected for batch processing`, 'upload', 'success')
        handleBatchFilesSelect(files as unknown as FileList)
        setIsBatchMode(true)
      }
    },
    [handleFileSelect, handleBatchFilesSelect, setHistory, clearJob, clearComparison, preferences.enableAIIterative, handleIterativeConversion, settings, updateSettings, setCurrentJob, addError, logActivity, updateActivity, runAIComparison]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDownload = useCallback((job: ConversionJob) => {
    const a = document.createElement('a')
    a.href = job.svgDataUrl
    a.download = job.filename.replace(/\.(png|jpg|jpeg|webp)$/i, '.svg')
    a.click()
    logActivity('Downloaded SVG', `${a.download}`, 'download', 'success')
    toast.success('Downloaded!', {
      description: `${a.download}`,
    })
  }, [logActivity])

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1)
    toast.info('Zoom reset to 100%')
  }, [])

  const loadHistoryItem = useCallback(
    (job: ConversionJob) => {
      setCurrentJob(job)
      updateSettings(job.settings)
      setZoomLevel(1)
      setIsBatchMode(false)
      clearBatch()
      toast.info('Loaded from history', {
        description: job.filename,
      })
    },
    [setCurrentJob, updateSettings, clearBatch]
  )

  const handleConvertAndSave = useCallback(async () => {
    const jobs = await handleBatchConvert()
    if (jobs.length > 0) {
      setHistory((current) =>
        [...jobs.filter((j) => j.status === 'completed'), ...(current || [])].slice(0, 100)
      )
    }
  }, [handleBatchConvert, setHistory])

  const handleReconvertAndSave = useCallback(async () => {
    const reconvertActivityId = logActivity('Reconverting', 'Applying new settings', 'conversion', 'pending')
    const job = await handleReconvert()
    if (job) {
      updateActivity(reconvertActivityId, 'Reconversion complete', 'Settings applied successfully', 'success')
      setHistory((current) => [job, ...(current || [])].slice(0, 20))
    } else {
      updateActivity(reconvertActivityId, 'Reconversion failed', 'Could not apply settings', 'error')
    }
  }, [handleReconvert, setHistory, logActivity, updateActivity])

  const handleAIOptimize = useCallback(async () => {
    if (!currentJob) {
      toast.error('No image to analyze')
      return
    }

    try {
      clearSuggestion()
      const analyzeActivityId = logActivity('AI Analysis started', 'Analyzing image characteristics...', 'ai-analysis', 'pending')
      const aiSuggestion = await analyzeImage(currentJob.pngDataUrl, settings)
      updateActivity(analyzeActivityId, 'AI Analysis complete', `Detected as ${aiSuggestion.imageType} with ${aiSuggestion.estimatedQuality} quality potential`, 'success')
      
      toast.success('AI Analysis Complete', {
        description: `Detected as ${aiSuggestion.imageType} with ${aiSuggestion.estimatedQuality} quality potential`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not analyze image'
      logActivity('AI Analysis failed', errorMessage, 'ai-analysis', 'error', { stack: error instanceof Error ? error.stack : undefined })
      
      // Add to error store for persistent tracking
      addError({
        message: 'AI Analysis Failed',
        source: 'ai',
        details: errorMessage,
      })
      
      // Show persistent toast with option to view details
      toast.error('AI Analysis Failed', {
        description: errorMessage,
        duration: Infinity,
        action: {
          label: 'View Details',
          onClick: () => setShowErrorLog(true),
        },
      })
    }
  }, [currentJob, settings, analyzeImage, clearSuggestion, addError, logActivity, updateActivity])

  const handleApplyAISuggestion = useCallback(
    async (suggestedSettings: { complexity: number; colorSimplification: number; pathSmoothing: number }) => {
      updateSettings(suggestedSettings)
      const suggestionActivityId = logActivity('AI suggestion applied', 'Applying recommended settings', 'ai-suggestion', 'pending')
      
      toast.info('Applying AI suggestions...', {
        description: 'Reconverting with optimal settings',
      })

      setTimeout(async () => {
        const job = await handleReconvert()
        if (job) {
          setHistory((current) => [job, ...(current || [])].slice(0, 20))
          updateActivity(suggestionActivityId, 'AI optimization complete', 'Conversion updated with AI settings', 'success')
          toast.success('AI optimization applied successfully!')
        } else {
          updateActivity(suggestionActivityId, 'AI optimization failed', 'Could not apply AI settings', 'error')
        }
        clearSuggestion()
      }, 100)
    },
    [updateSettings, handleReconvert, setHistory, clearSuggestion, logActivity, updateActivity]
  )

  // Handle SVG modifications from AI Chat
  const handleApplySvgChange = useCallback((newSvg: string) => {
    if (!currentJob) return
    
    // Create a blob and URL from the new SVG
    const svgBlob = new Blob([newSvg], { type: 'image/svg+xml' })
    const svgDataUrl = URL.createObjectURL(svgBlob)
    
    // Update the current job with the modified SVG
    const updatedJob: ConversionJob = {
      ...currentJob,
      svgDataUrl,
      svgSize: newSvg.length,
    }
    
    setCurrentJob(updatedJob)
    logActivity('SVG modified', 'Applied AI-generated modification', 'ai-chat', 'success')
  }, [currentJob, setCurrentJob, logActivity])

  const handleApplyPreset = useCallback(
    async (preset: ConversionPreset) => {
      updateSettings(preset.settings)
      logActivity('Preset applied', `Using "${preset.name}" preset`, 'settings', 'success')
      
      toast.success(`Applied "${preset.name}" preset`, {
        description: preset.description,
      })

      // Auto-reconvert if we have a file
      if (currentFile) {
        setTimeout(() => {
          handleReconvert()
            .then((job) => {
              if (job) {
                setHistory((current) => [job, ...(current || [])].slice(0, 20))
              }
            })
            .catch((error) => {
              console.error('Failed to reconvert after preset:', error)
            })
        }, 100)
      }
    },
    [updateSettings, currentFile, handleReconvert, setHistory, logActivity]
  )

  const handleSingleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      if (files.length === 1) {
        // Clear previous job before processing new file
        clearJob()
        clearComparison()
        const uploadActivityId = logActivity('Image uploaded', `Processing ${files[0].name}`, 'upload', 'pending')
        const job = await handleFileSelect(files[0])
        if (job) {
          updateActivity(uploadActivityId, 'Image uploaded', `${files[0].name} processed successfully`, 'success')
          logActivity('Conversion complete', `${files[0].name} converted successfully`, 'conversion', 'success')
          setHistory((current) => [job, ...(current || [])].slice(0, 20))
          
          // If AI Iterative is enabled, run iterative conversion after initial conversion
          if (preferences.enableAIIterative && job.status === 'completed') {
            toast.info('Starting AI Iterative Refinement...', {
              description: 'Automatically improving conversion quality',
            })
            const iterativeActivityId = logActivity('AI Iterative started', 'Running automatic quality improvement', 'ai-iteration', 'pending')
            
            try {
              const result = await handleIterativeConversion(files[0], settings)
              if (result) {
                setCurrentJob(result.job)
                updateSettings(result.settingsUsed)
                setHistory((current) => [result.job, ...(current || [])].slice(0, 20))
                updateActivity(iterativeActivityId, 'AI Iterative complete', `Best result: ${result.likenessScore}% likeness`, 'success')
                
                toast.success('AI Iterative Refinement Complete!', {
                  description: `Best result: ${result.likenessScore}% likeness`,
                })
              } else {
                updateActivity(iterativeActivityId, 'AI Iterative complete', 'No improvement found', 'success')
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'AI Iterative conversion failed'
              updateActivity(iterativeActivityId, 'AI Iterative failed', errorMessage, 'error', { stack: error instanceof Error ? error.stack : undefined })
              addError({
                message: 'AI Iterative Refinement Failed',
                source: 'ai',
                details: errorMessage,
              })
              toast.error('AI Iterative Refinement Failed', {
                description: errorMessage,
                duration: Infinity,
                action: {
                  label: 'View Details',
                  onClick: () => setShowErrorLog(true),
                },
              })
            }
          } else if (job.status === 'completed') {
            // Auto-run AI comparison after successful conversion
            await runAIComparison(job.pngDataUrl, job.svgDataUrl, files[0].name)
          }
        } else {
          updateActivity(uploadActivityId, 'Image upload failed', `Failed to process ${files[0].name}`, 'error')
        }
      } else {
        logActivity('Batch upload', `${files.length} files selected for batch processing`, 'upload', 'success')
        handleBatchFilesSelect(files)
        setIsBatchMode(true)
      }
    },
    [handleFileSelect, handleBatchFilesSelect, setHistory, clearJob, clearComparison, preferences.enableAIIterative, handleIterativeConversion, settings, updateSettings, setCurrentJob, addError, logActivity, updateActivity, runAIComparison]
  )

  const handleStartIterativeConversion = useCallback(async () => {
    if (!currentFile) {
      toast.error('No image selected', {
        description: 'Please upload an image first',
      })
      return
    }

    clearComparison()
    const iterativeActivityId = logActivity('AI Iterative started', 'Running automatic quality improvement', 'ai-iteration', 'pending')
    
    const result = await handleIterativeConversion(currentFile, settings)
    
    if (result) {
      setCurrentJob(result.job)
      updateSettings(result.settingsUsed)
      setHistory((current) => [result.job, ...(current || [])].slice(0, 20))
      updateActivity(iterativeActivityId, 'AI Iterative complete', `Best result: ${result.likenessScore}% likeness`, 'success')
      
      toast.success('Iterative conversion complete!', {
        description: `Best result: ${result.likenessScore}% likeness`,
      })
    } else {
      updateActivity(iterativeActivityId, 'AI Iterative complete', 'No improvement found', 'success')
    }
  }, [currentFile, settings, handleIterativeConversion, updateSettings, setHistory, setCurrentJob, clearComparison, logActivity, updateActivity])

  // Handler for one-click AI refinement from comparison card
  const handleRefineWithAI = useCallback(async () => {
    if (!currentFile) {
      toast.error('No image selected', {
        description: 'Please upload an image first',
      })
      return
    }

    clearComparison()
    toast.info('Starting AI Refinement...', {
      description: 'Automatically improving conversion quality based on comparison',
    })
    const refinementActivityId = logActivity('AI Refinement started', 'Using comparison feedback to improve conversion', 'ai-iteration', 'pending')
    
    const result = await handleIterativeConversion(currentFile, settings)
    
    if (result) {
      setCurrentJob(result.job)
      updateSettings(result.settingsUsed)
      setHistory((current) => [result.job, ...(current || [])].slice(0, 20))
      updateActivity(refinementActivityId, 'AI Refinement complete', `Improved to ${result.likenessScore}% likeness`, 'success')
      
      toast.success('AI Refinement Complete!', {
        description: `Best result: ${result.likenessScore}% likeness`,
      })
    } else {
      updateActivity(refinementActivityId, 'AI Refinement complete', 'No improvement found', 'success')
    }
  }, [currentFile, settings, handleIterativeConversion, updateSettings, setHistory, setCurrentJob, clearComparison, logActivity, updateActivity])

  useKeyboardShortcuts(
    {
      onUpload: () => fileInputRef.current?.click(),
      onDownload: () => currentJob && handleDownload(currentJob),
      onZoomIn: handleZoomIn,
      onZoomOut: handleZoomOut,
      onZoomReset: handleZoomReset,
      onUndo: undoSettings,
      onRedo: redoSettings,
      onRetry: handleReconvertAndSave,
    },
    !isProcessing
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const cleanup = setupConnectionMonitoring((online) => {
      setIsOnline(online)
      if (!online) {
        toast.error('Connection lost', {
          description: 'Check your internet connection',
        })
      } else {
        toast.success('Connection restored', {
          description: 'You are back online',
        })
      }
    })

    return cleanup
  }, [])

  // Extract SVG content from blob URL when job changes
  useEffect(() => {
    const extractSvgContent = async () => {
      if (!currentJob?.svgDataUrl) {
        setCurrentSvgContent(null)
        return
      }
      
      try {
        const response = await fetch(currentJob.svgDataUrl)
        const text = await response.text()
        setCurrentSvgContent(text)
      } catch (error) {
        console.error('Failed to extract SVG content:', error)
        setCurrentSvgContent(null)
      }
    }
    
    extractSvgContent()
  }, [currentJob?.svgDataUrl])

  // Handle restoring settings from history
  const handleRestoreSettings = useCallback((index: number) => {
    if (settingsHistory[index]) {
      updateSettings(settingsHistory[index].settings)
      toast.info('Settings restored', {
        description: `Restored settings from ${new Date(settingsHistory[index].timestamp).toLocaleTimeString()}`,
      })
    }
  }, [settingsHistory, updateSettings])

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for keyboard users */}
      <SkipLink targetId="main-content" />
      
      {/* Live region for screen reader announcements */}
      <LiveRegion>
        {isProcessing ? 'Converting image...' : ''}
        {currentJob?.status === 'completed' ? 'Conversion complete' : ''}
      </LiveRegion>
      
      <ConnectionStatus isOnline={isOnline} />
      
      <header className="border-b border-border bg-card" role="banner">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-primary rounded-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage('converter')}
                role="button"
                tabIndex={0}
                aria-label="Go to home"
                onKeyDown={(e) => e.key === 'Enter' && setCurrentPage('converter')}
              >
                <Sparkle className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" weight="fill" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-[32px] font-bold tracking-tight leading-none">
                  VectorForge
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Smart Image Converter
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Right Panel Toggle */}
              {!isMobile && currentPage === 'converter' && (
                <Button
                  variant={showRightPanel ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  aria-label={showRightPanel ? 'Hide activity panel' : 'Show activity panel'}
                  title={showRightPanel ? 'Hide activity panel' : 'Show activity panel'}
                >
                  <SidebarSimple className="w-4 h-4" weight="bold" />
                </Button>
              )}
              <ThemeToggle />
              <Button
                variant={currentPage === 'formats' ? 'default' : 'outline'}
                onClick={() => setCurrentPage(currentPage === 'converter' ? 'formats' : 'converter')}
                className="gap-2"
                aria-label={currentPage === 'formats' ? 'Go back to converter' : 'Open format guide'}
              >
                {currentPage === 'formats' ? (
                  <>
                    <ArrowLeft className="w-4 h-4" weight="bold" />
                    <span className="hidden sm:inline">Back</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" weight="bold" />
                    <span className="hidden sm:inline">Format Guide</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8" role="main" tabIndex={-1}>
        {currentPage === 'formats' ? (
          <Suspense fallback={<LoadingFallback />}>
            <FormatGuide />
          </Suspense>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple
              className="hidden"
              onChange={(e) => handleSingleFileSelect(e.target.files)}
              aria-label="Select image file to convert"
            />

            <div className="flex gap-6">
              {/* Main content area */}
              <div className={showRightPanel && !isMobile ? 'flex-1' : 'w-full'}>
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              {/* Note: grid-cols-6 matches the 6 tabs: Convert, Remix, AI Iterative, Batch, Formats, History */}
              <TabsList className="mb-4 md:mb-6 w-full md:w-auto grid grid-cols-6">
                <TabsTrigger value="convert" className="gap-2">
                  <UploadSimple weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">Convert</span>
                </TabsTrigger>
                <TabsTrigger value="remix" className="gap-2">
                  <MagicWand weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">Remix</span>
                </TabsTrigger>
                <TabsTrigger value="iterative" className="gap-2">
                  <Robot weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Iterative</span>
                </TabsTrigger>
                <TabsTrigger value="batch" className="gap-2">
                  <Files weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">Batch</span>
                </TabsTrigger>
                <TabsTrigger value="formats" className="gap-2">
                  <Sparkle weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">Formats</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <ClockCounterClockwise weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>

          <TabsContent value="convert" className="space-y-4 md:space-y-6">
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <UploadZone
                  isProcessing={isConversionProcessing}
                  progress={progress}
                  isDragging={isDragging}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onFileSelect={handleSingleFileSelect}
                />

                <ConversionPreview
                  job={currentJob}
                  zoomLevel={zoomLevel}
                  dividerPosition={dividerPosition}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                  onDividerChange={setDividerPosition}
                  onDownload={handleDownload}
                  onNewImage={() => fileInputRef.current?.click()}
                  onZoomChange={setZoomLevel}
                  onRetry={handleReconvertAndSave}
                  showCheckerboard={preferences.showCheckerboard}
                  onToggleCheckerboard={() => updatePreference('showCheckerboard', !preferences.showCheckerboard)}
                  onRemix={() => setActiveMainTab('remix')}
                />
              </div>

              <div className="space-y-4 md:space-y-6">
                {comparison && (
                  <ComparisonCard
                    comparison={comparison}
                    onRefineWithAI={handleRefineWithAI}
                    onDismiss={clearComparison}
                    isRefining={isIterativeProcessing}
                  />
                )}
                {suggestion && (
                  <AISuggestionCard
                    suggestion={suggestion}
                    analysis={analysis}
                    onApply={handleApplyAISuggestion}
                    onDismiss={clearSuggestion}
                    isApplying={isProcessing}
                  />
                )}
                <SettingsPanel
                  settings={settings}
                  onSettingChange={handleSettingChange}
                  onApplyPreset={handleApplyPreset}
                  onReconvert={handleReconvertAndSave}
                  canReconvert={!!currentFile}
                  isProcessing={isProcessing}
                  historyIndex={settingsHistoryIndex}
                  historyLength={settingsHistory.length}
                  onUndo={undoSettings}
                  onRedo={redoSettings}
                  onAIOptimize={handleAIOptimize}
                  isAIOptimizing={isAnalyzing}
                  enableAIIterative={preferences.enableAIIterative}
                  onEnableAIIterativeChange={(enabled) => updatePreference('enableAIIterative', enabled)}
                />
                <SettingsInfoCard />
                
                {/* Settings History Timeline */}
                {settingsHistory.length > 0 && (
                  <SettingsHistoryTimeline
                    history={settingsHistory}
                    currentIndex={settingsHistoryIndex}
                    onRestore={handleRestoreSettings}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="remix" className="space-y-4 md:space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <RemixPage
                svgContent={currentSvgContent}
                pngDataUrl={currentJob?.pngDataUrl || null}
                onApplyChanges={handleApplySvgChange}
                onDownload={() => currentJob && handleDownload(currentJob)}
                comparison={comparison}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="iterative" className="space-y-4 md:space-y-6">
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <UploadZone
                  isProcessing={isIterativeProcessing}
                  progress={iterativeProgress}
                  isDragging={isDragging}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onFileSelect={handleSingleFileSelect}
                />

                <ConversionPreview
                  job={bestIteration?.job || currentJob}
                  zoomLevel={zoomLevel}
                  dividerPosition={dividerPosition}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                  onDividerChange={setDividerPosition}
                  onDownload={handleDownload}
                  onNewImage={() => fileInputRef.current?.click()}
                  onZoomChange={setZoomLevel}
                  onRetry={handleStartIterativeConversion}
                  showCheckerboard={preferences.showCheckerboard}
                  onToggleCheckerboard={() => updatePreference('showCheckerboard', !preferences.showCheckerboard)}
                />
              </div>

              <div className="space-y-4 md:space-y-6">
                <Suspense fallback={<LoadingFallback />}>
                  <IterativeConverter
                    maxIterations={iterativeConfig.maxIterations}
                    targetLikeness={iterativeConfig.targetLikeness}
                    onMaxIterationsChange={(value) =>
                      updateIterativeConfig({ maxIterations: value })
                    }
                    onTargetLikenessChange={(value) =>
                      updateIterativeConfig({ targetLikeness: value })
                    }
                    isProcessing={isIterativeProcessing}
                    currentIteration={currentIteration}
                    progress={iterativeProgress}
                    iterations={iterations}
                    bestIteration={bestIteration}
                    onStart={handleStartIterativeConversion}
                    onCancel={cancelIterative}
                    canStart={!!currentFile}
                  />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4 md:space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <BatchConversion
                batchFiles={batchFiles}
                batchJobs={batchJobs}
                isProcessing={isBatchProcessing}
                progress={batchProgress}
                isDragging={isDragging}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onFileSelect={handleBatchFilesSelect}
                onRemoveFile={removeBatchFile}
                onConvert={handleConvertAndSave}
                onDownload={handleDownload}
                onDownloadAll={handleDownloadAllBatch}
                onClear={clearBatch}
                onRetryFailed={retryFailedJob}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="formats" className="space-y-4 md:space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <MultiFormatConverter />
            </Suspense>
          </TabsContent>

          <TabsContent value="history">
            <Suspense fallback={<LoadingFallback />}>
              <ConversionHistory
                history={history || []}
                onLoadItem={loadHistoryItem}
                onDownload={handleDownload}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
              </div>
              
              {/* Right Panel - Activity Log, AI Chat, Post-Processing */}
              {showRightPanel && !isMobile && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-80 shrink-0 space-y-4"
                >
                  {/* Panel Tabs */}
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={rightPanelTab === 'activity' ? 'default' : 'ghost'}
                      size="sm"
                      className="flex-1 gap-1.5 h-8"
                      onClick={() => setRightPanelTab('activity')}
                    >
                      <Activity className="w-3.5 h-3.5" weight="bold" />
                      Activity
                    </Button>
                    <Button
                      variant={rightPanelTab === 'chat' ? 'default' : 'ghost'}
                      size="sm"
                      className="flex-1 gap-1.5 h-8"
                      onClick={() => setRightPanelTab('chat')}
                    >
                      <ChatCircle className="w-3.5 h-3.5" weight="bold" />
                      AI Edit
                    </Button>
                    <Button
                      variant={rightPanelTab === 'postprocess' ? 'default' : 'ghost'}
                      size="sm"
                      className="flex-1 gap-1.5 h-8"
                      onClick={() => setRightPanelTab('postprocess')}
                    >
                      <Sparkle className="w-3.5 h-3.5" weight="bold" />
                      Process
                    </Button>
                  </div>
                  
                  {/* Panel Content */}
                  <div className="h-[calc(100vh-280px)] min-h-[400px]">
                    {rightPanelTab === 'activity' && (
                      <ActivityLogPanel
                        entries={activityEntries}
                        onClear={clearActivityEntries}
                        className="h-full"
                      />
                    )}
                    {rightPanelTab === 'chat' && (
                      <AIChatPanel
                        currentSvg={currentSvgContent}
                        onApplySvgChange={handleApplySvgChange}
                        onActivityLog={(title, desc) => logActivity(title, desc, 'ai-chat')}
                        className="h-full"
                      />
                    )}
                    {rightPanelTab === 'postprocess' && (
                      <SvgPostProcessingPanel
                        currentSvg={currentSvgContent}
                        onApplyChange={handleApplySvgChange}
                        onActivityLog={(title, desc) => logActivity(title, desc, 'settings', 'success')}
                        className="h-full"
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </div>
        </>
        )}
      </main>

      {isMobile && currentJob && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-lg z-50"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2 min-h-[44px]"
              onClick={() => currentJob && handleDownload(currentJob)}
            >
              <DownloadSimple weight="bold" />
              Download SVG
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px]"
            >
              New Image
            </Button>
          </div>
        </motion.div>
      )}

      {/* Mobile Activity Panel Sheet */}
      {isMobile && currentPage === 'converter' && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg z-40"
              aria-label="Open activity panel"
            >
              <Activity className="w-5 h-5" weight="bold" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] p-0">
            <div className="flex flex-col h-full">
              {/* Panel Tabs */}
              <div className="flex gap-1 p-3 bg-muted/50 border-b">
                <Button
                  variant={rightPanelTab === 'activity' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5 h-9"
                  onClick={() => setRightPanelTab('activity')}
                >
                  <Activity className="w-3.5 h-3.5" weight="bold" />
                  Activity
                </Button>
                <Button
                  variant={rightPanelTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5 h-9"
                  onClick={() => setRightPanelTab('chat')}
                >
                  <ChatCircle className="w-3.5 h-3.5" weight="bold" />
                  AI Edit
                </Button>
                <Button
                  variant={rightPanelTab === 'postprocess' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5 h-9"
                  onClick={() => setRightPanelTab('postprocess')}
                >
                  <Sparkle className="w-3.5 h-3.5" weight="bold" />
                  Process
                </Button>
              </div>
              
              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelTab === 'activity' && (
                  <ActivityLogPanel
                    entries={activityEntries}
                    onClear={clearActivityEntries}
                    className="h-full border-0 rounded-none"
                  />
                )}
                {rightPanelTab === 'chat' && (
                  <AIChatPanel
                    currentSvg={currentSvgContent}
                    onApplySvgChange={handleApplySvgChange}
                    onActivityLog={(title, desc) => logActivity(title, desc, 'ai-chat')}
                    className="h-full border-0 rounded-none"
                  />
                )}
                {rightPanelTab === 'postprocess' && (
                  <SvgPostProcessingPanel
                    currentSvg={currentSvgContent}
                    onApplyChange={handleApplySvgChange}
                    onActivityLog={(title, desc) => logActivity(title, desc, 'settings', 'success')}
                    className="h-full border-0 rounded-none"
                  />
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <footer className="border-t border-border mt-8 md:mt-16">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 text-xs md:text-sm text-muted-foreground">
            <p>© 2024 VectorForge. Professional-quality SVG conversion.</p>
            <div className="flex items-center gap-4">
              {hasErrors && (
                <button
                  onClick={() => setShowErrorLog(true)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors"
                >
                  <WarningCircle className="w-4 h-4" weight="bold" />
                  <span>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                </button>
              )}
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Command className="w-4 h-4" weight="bold" />
                <span>Keyboard shortcuts</span>
              </button>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan" weight="bold" />
                <span>Ready to convert</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      
      <ErrorLogDialog
        errors={errors}
        isOpen={showErrorLog}
        onClose={() => setShowErrorLog(false)}
        onRemoveError={removeError}
        onClearAll={clearErrors}
      />
    </div>
  )
}

export default App
