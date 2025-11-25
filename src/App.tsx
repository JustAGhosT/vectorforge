import { useState, useCallback, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ConversionJob } from '@/lib/converter'
import { setupConnectionMonitoring } from '@/lib/connection'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useConversion } from '@/hooks/use-conversion'
import { useBatchConversion } from '@/hooks/use-batch-conversion'
import { useSettingsHistory } from '@/hooks/use-settings-history'
import { useAIOptimizer } from '@/hooks/use-ai-optimizer'
import { useIterativeConversion } from '@/hooks/use-iterative-conversion'
import { UploadZone } from '@/components/UploadZone'
import { ConversionPreview } from '@/components/ConversionPreview'
import { SettingsPanel, SettingsInfoCard } from '@/components/SettingsPanel'
import { BatchConversion } from '@/components/BatchConversion'
import { ConversionHistory } from '@/components/ConversionHistory'
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal'
import { FormatGuide } from '@/components/FormatGuide'
import { MultiFormatConverter } from '@/components/MultiFormatConverter'
import { AISuggestionCard } from '@/components/AISuggestionCard'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { IterativeConverter } from '@/components/IterativeConverter'

function App() {
  const isMobile = useIsMobile()
  const [history, setHistory] = useKV<ConversionJob[]>('conversion-history', [])
  const [isDragging, setIsDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dividerPosition, setDividerPosition] = useState(50)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [currentPage, setCurrentPage] = useState<'converter' | 'formats'>('converter')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  })

  const {
    currentFile,
    currentJob,
    isProcessing: isConversionProcessing,
    progress,
    handleFileSelect,
    handleReconvert,
    setCurrentJob,
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

  const isProcessing = isConversionProcessing || isBatchProcessing || isIterativeProcessing

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )

      if (files.length === 0) {
        toast.error('No image files found', {
          description: 'Please drop image files (PNG, JPG, WebP)',
        })
        return
      }

      if (files.length === 1) {
        handleFileSelect(files[0]).then((job) => {
          if (job) {
            setHistory((current) => [job, ...(current || [])].slice(0, 20))
          }
        })
      } else {
        handleBatchFilesSelect(files as unknown as FileList)
        setIsBatchMode(true)
      }
    },
    [handleFileSelect, handleBatchFilesSelect, setHistory]
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
    toast.success('Downloaded!', {
      description: `${a.download}`,
    })
  }, [])

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
    const job = await handleReconvert()
    if (job) {
      setHistory((current) => [job, ...(current || [])].slice(0, 20))
    }
  }, [handleReconvert, setHistory])

  const handleAIOptimize = useCallback(async () => {
    if (!currentJob) {
      toast.error('No image to analyze')
      return
    }

    try {
      clearSuggestion()
      const aiSuggestion = await analyzeImage(currentJob.pngDataUrl, settings)
      
      toast.success('AI Analysis Complete', {
        description: `Detected as ${aiSuggestion.imageType} with ${aiSuggestion.estimatedQuality} quality potential`,
      })
    } catch (error) {
      toast.error('AI Analysis Failed', {
        description: error instanceof Error ? error.message : 'Could not analyze image',
      })
    }
  }, [currentJob, settings, analyzeImage, clearSuggestion])

  const handleApplyAISuggestion = useCallback(
    async (suggestedSettings: { complexity: number; colorSimplification: number; pathSmoothing: number }) => {
      updateSettings(suggestedSettings)
      
      toast.info('Applying AI suggestions...', {
        description: 'Reconverting with optimal settings',
      })

      setTimeout(async () => {
        const job = await handleReconvert()
        if (job) {
          setHistory((current) => [job, ...(current || [])].slice(0, 20))
          toast.success('AI optimization applied successfully!')
        }
        clearSuggestion()
      }, 100)
    },
    [updateSettings, handleReconvert, setHistory, clearSuggestion]
  )

  const handleSingleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      if (files.length === 1) {
        const job = await handleFileSelect(files[0])
        if (job) {
          setHistory((current) => [job, ...(current || [])].slice(0, 20))
        }
      } else {
        handleBatchFilesSelect(files)
        setIsBatchMode(true)
      }
    },
    [handleFileSelect, handleBatchFilesSelect, setHistory]
  )

  const handleStartIterativeConversion = useCallback(async () => {
    if (!currentFile) {
      toast.error('No image selected', {
        description: 'Please upload an image first',
      })
      return
    }

    const result = await handleIterativeConversion(currentFile, settings)
    
    if (result) {
      setCurrentJob(result.job)
      updateSettings(result.settingsUsed)
      setHistory((current) => [result.job, ...(current || [])].slice(0, 20))
      
      toast.success('Iterative conversion complete!', {
        description: `Best result: ${result.likenessScore}% likeness`,
      })
    }
  }, [currentFile, settings, handleIterativeConversion, updateSettings, setHistory, setCurrentJob])

  useKeyboardShortcuts(
    {
      onUpload: () => fileInputRef.current?.click(),
      onDownload: () => currentJob && handleDownload(currentJob),
      onZoomIn: handleZoomIn,
      onZoomOut: handleZoomOut,
      onZoomReset: handleZoomReset,
      onUndo: undoSettings,
      onRedo: redoSettings,
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

  return (
    <div className="min-h-screen bg-background">
      <ConnectionStatus isOnline={isOnline} />
      
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-primary rounded-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage('converter')}
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
            
            <Button
              variant={currentPage === 'formats' ? 'default' : 'outline'}
              onClick={() => setCurrentPage(currentPage === 'converter' ? 'formats' : 'converter')}
              className="gap-2"
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
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
        {currentPage === 'formats' ? (
          <FormatGuide />
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple
              className="hidden"
              onChange={(e) => handleSingleFileSelect(e.target.files)}
            />

            <Tabs defaultValue="convert" className="w-full">
              <TabsList className="mb-4 md:mb-6 w-full md:w-auto grid grid-cols-5">
                <TabsTrigger value="convert" className="gap-2">
                  <UploadSimple weight="bold" className="w-4 h-4" />
                  <span className="hidden sm:inline">Convert</span>
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
                />
              </div>

              <div className="space-y-4 md:space-y-6">
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
                  onReconvert={handleReconvertAndSave}
                  canReconvert={!!currentFile}
                  isProcessing={isProcessing}
                  historyIndex={settingsHistoryIndex}
                  historyLength={settingsHistory.length}
                  onUndo={undoSettings}
                  onRedo={redoSettings}
                  onAIOptimize={handleAIOptimize}
                  isAIOptimizing={isAnalyzing}
                />
                <SettingsInfoCard />
              </div>
            </div>
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
                />
              </div>

              <div className="space-y-4 md:space-y-6">
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4 md:space-y-6">
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
            />
          </TabsContent>

          <TabsContent value="formats" className="space-y-4 md:space-y-6">
            <MultiFormatConverter />
          </TabsContent>

          <TabsContent value="history">
            <ConversionHistory
              history={history || []}
              onLoadItem={loadHistoryItem}
              onDownload={handleDownload}
            />
          </TabsContent>
        </Tabs>
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

      <footer className="border-t border-border mt-8 md:mt-16">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 text-xs md:text-sm text-muted-foreground">
            <p>© 2024 VectorForge. Professional-quality SVG conversion.</p>
            <div className="flex items-center gap-4">
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
    </div>
  )
}

export default App
