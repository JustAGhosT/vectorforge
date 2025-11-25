import { useState, useRef, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  UploadSimple,
  FileImage,
  Sparkle,
  DownloadSimple,
  SlidersHorizontal,
  ClockCounterClockwise,
  Check,
  Warning,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsLeftRight,
  ArrowCounterClockwise,
  Command,
  Files,
  X,
  Trash,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  convertPngToSvg,
  convertMultiplePngs,
  downloadAllAsZip,
  formatFileSize,
  generateJobId,
  type ConversionJob,
  type ConversionSettings,
  type BatchConversionJob,
} from '@/lib/converter'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { usePinchZoom } from '@/hooks/use-pinch-zoom'
import { DraggableDivider } from '@/components/DraggableDivider'

interface SettingsHistoryEntry {
  settings: ConversionSettings
  timestamp: number
}

function App() {
  const isMobile = useIsMobile()
  const [history, setHistory] = useKV<ConversionJob[]>('conversion-history', [])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dividerPosition, setDividerPosition] = useState(50)
  const [settings, setSettings] = useState<ConversionSettings>({
    complexity: 0.5,
    colorSimplification: 0.5,
    pathSmoothing: 0.5,
  })
  const [settingsHistory, setSettingsHistory] = useState<SettingsHistoryEntry[]>([])
  const [settingsHistoryIndex, setSettingsHistoryIndex] = useState(-1)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [hasPinchedBefore, setHasPinchedBefore] = useState(false)
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 })
  const [batchJobs, setBatchJobs] = useState<ConversionJob[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  usePinchZoom(previewRef, {
    onZoomChange: (delta) => {
      if (!hasPinchedBefore) {
        setHasPinchedBefore(true)
        toast.info('Pinch to zoom', {
          description: 'Use two fingers to zoom in and out',
        })
      }
      setZoomLevel((prev) => {
        const newZoom = prev + delta
        const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
        if (clampedZoom === prev && (delta > 0 ? clampedZoom >= 3 : clampedZoom <= 0.5)) {
          return prev
        }
        return clampedZoom
      })
    },
    enabled: isMobile && !!currentJob,
  })

  const addToSettingsHistory = useCallback((newSettings: ConversionSettings) => {
    setSettingsHistory((current) => {
      const newHistory = current.slice(0, settingsHistoryIndex + 1)
      return [...newHistory, { settings: newSettings, timestamp: Date.now() }]
    })
    setSettingsHistoryIndex((current) => current + 1)
  }, [settingsHistoryIndex])

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

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/png')) {
        toast.error('Invalid file type', {
          description: 'Please upload a PNG image file',
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please upload a file smaller than 10MB',
        })
        return
      }

      setCurrentFile(file)
      setIsProcessing(true)
      setProgress(0)

      try {
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
        }, 200)

        const reader = new FileReader()
        const pngDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        const { svgDataUrl, svgSize } = await convertPngToSvg(file, settings)

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        setProgress(100)

        const job: ConversionJob = {
          id: generateJobId(),
          filename: file.name,
          timestamp: Date.now(),
          originalSize: file.size,
          svgSize,
          settings: { ...settings },
          pngDataUrl,
          svgDataUrl,
        }

        setCurrentJob(job)
        setHistory((current) => [job, ...(current || [])].slice(0, 20))

        toast.success('Conversion complete!', {
          description: `${formatFileSize(file.size)} → ${formatFileSize(svgSize)}`,
        })
      } catch (error) {
        toast.error('Conversion failed', {
          description: error instanceof Error ? error.message : 'An error occurred',
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [settings, setHistory]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/png'))
      
      if (files.length === 0) {
        toast.error('No PNG files found', {
          description: 'Please drop PNG image files',
        })
        return
      }

      if (files.length === 1) {
        handleFileSelect(files[0])
      } else {
        setBatchFiles(files)
        setIsBatchMode(true)
      }
    },
    [handleFileSelect]
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
    a.download = job.filename.replace(/\.png$/i, '.svg')
    a.click()
    toast.success('Downloaded!', {
      description: `${a.download}`,
    })
  }, [])

  const handleReconvert = useCallback(async () => {
    if (!currentFile) return
    await handleFileSelect(currentFile)
  }, [currentFile, handleFileSelect])

  const handleSettingChange = useCallback(
    (key: keyof ConversionSettings, value: number) => {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      addToSettingsHistory(newSettings)
    },
    [settings, addToSettingsHistory]
  )

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

  const getSizeReduction = useCallback((job: ConversionJob) => {
    const reduction = ((job.originalSize - job.svgSize) / job.originalSize) * 100
    return Math.max(0, Math.round(reduction))
  }, [])

  const loadHistoryItem = useCallback((job: ConversionJob) => {
    setCurrentJob(job)
    setSettings(job.settings)
    setZoomLevel(1)
    setIsBatchMode(false)
    setBatchFiles([])
    setBatchJobs([])
    toast.info('Loaded from history', {
      description: job.filename,
    })
  }, [])

  const handleBatchFilesSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const pngFiles = Array.from(files).filter(file => file.type.startsWith('image/png'))
    
    if (pngFiles.length === 0) {
      toast.error('No PNG files found', {
        description: 'Please select PNG image files',
      })
      return
    }

    if (pngFiles.length > 50) {
      toast.error('Too many files', {
        description: 'Please select up to 50 files at a time',
      })
      return
    }

    setBatchFiles(pngFiles)
    setIsBatchMode(true)
    setCurrentJob(null)
    toast.info(`${pngFiles.length} files selected`, {
      description: 'Ready to convert',
    })
  }, [])

  const removeBatchFile = useCallback((index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleBatchConvert = useCallback(async () => {
    if (batchFiles.length === 0) return

    setIsProcessing(true)
    setBatchProgress({ completed: 0, total: batchFiles.length })
    setBatchJobs([])

    try {
      const jobs = await convertMultiplePngs(
        batchFiles,
        settings,
        (completed, total) => {
          setBatchProgress({ completed, total })
        }
      )

      setBatchJobs(jobs)
      setHistory((current) => [...jobs.filter(j => j.status === 'completed'), ...(current || [])].slice(0, 100))

      const successCount = jobs.filter(j => j.status === 'completed').length
      const failCount = jobs.filter(j => j.status === 'failed').length

      if (failCount === 0) {
        toast.success('Batch conversion complete!', {
          description: `${successCount} files converted successfully`,
        })
      } else {
        toast.warning('Batch conversion finished', {
          description: `${successCount} succeeded, ${failCount} failed`,
        })
      }
    } catch (error) {
      toast.error('Batch conversion failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [batchFiles, settings, setHistory])

  const handleDownloadAllBatch = useCallback(() => {
    if (batchJobs.length === 0) return
    
    const successJobs = batchJobs.filter(j => j.status === 'completed')
    downloadAllAsZip(successJobs)
    
    toast.success('Downloading all files', {
      description: `${successJobs.length} SVG files`,
    })
  }, [batchJobs])

  const clearBatch = useCallback(() => {
    setBatchFiles([])
    setBatchJobs([])
    setIsBatchMode(false)
    setBatchProgress({ completed: 0, total: 0 })
  }, [])

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 bg-primary rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkle className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" weight="fill" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-[32px] font-bold tracking-tight leading-none">
                VectorForge
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Smart PNG to SVG Converter
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="mb-4 md:mb-6 w-full md:w-auto grid grid-cols-3">
            <TabsTrigger value="convert" className="gap-2">
              <UploadSimple weight="bold" />
              <span className="hidden sm:inline">Convert</span>
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Files weight="bold" />
              <span className="hidden sm:inline">Batch</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClockCounterClockwise weight="bold" />
              <span className="hidden sm:inline">History ({history?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="space-y-4 md:space-y-6">
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <Card className="p-4 md:p-6">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-all duration-300 cursor-pointer',
                      isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30',
                      isProcessing && 'pointer-events-none opacity-60'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      id="png-file-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          if (files.length === 1) {
                            handleFileSelect(files[0])
                          } else {
                            handleBatchFilesSelect(files)
                          }
                        }
                      }}
                    />

                    {!isProcessing ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-3 md:mb-4">
                          <UploadSimple
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            weight="bold"
                          />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
                          Drop your PNG here or click to upload
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                          Maximum file size: 10MB
                        </p>
                        <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0">
                          Select File
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-2 animate-pulse">
                          <Sparkle
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            weight="fill"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Processing your image...
                          </p>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-2">
                            {Math.round(progress)}%
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>

                <AnimatePresence mode="wait">
                  {currentJob && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                          <h3 className="text-base md:text-lg font-semibold">Preview</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {formatFileSize(currentJob.originalSize)}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="default" className="bg-cyan text-white">
                                {formatFileSize(currentJob.svgSize)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 ml-auto md:ml-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 0.5}
                                className="h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                                title="Zoom out (Cmd/Ctrl + -)"
                              >
                                <MagnifyingGlassMinus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleZoomReset}
                                className="text-xs text-muted-foreground min-w-[3rem] min-h-[44px] md:min-h-0 hover:text-foreground transition-colors"
                                title="Reset zoom (Cmd/Ctrl + 0)"
                              >
                                {Math.round(zoomLevel * 100)}%
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 3}
                                className="h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                                title="Zoom in (Cmd/Ctrl + +)"
                              >
                                <MagnifyingGlassPlus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="hidden md:block">
                            <div className="relative h-[500px] rounded-lg border border-border bg-muted/30 overflow-hidden">
                              <div className="absolute inset-0 flex">
                                <div
                                  className="relative overflow-hidden"
                                  style={{ width: `${dividerPosition}%` }}
                                >
                                  <div className="absolute inset-0 p-4 flex items-center justify-center">
                                    <motion.img
                                      src={currentJob.pngDataUrl}
                                      alt="Original"
                                      className="max-w-full max-h-full object-contain"
                                      style={{ transform: `scale(${zoomLevel})` }}
                                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                  </div>
                                  <div className="absolute top-2 left-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Original PNG
                                    </Badge>
                                  </div>
                                </div>

                                <DraggableDivider
                                  defaultPosition={dividerPosition}
                                  onPositionChange={setDividerPosition}
                                />

                                <div
                                  className="relative overflow-hidden"
                                  style={{ width: `${100 - dividerPosition}%` }}
                                >
                                  <div className="absolute inset-0 p-4 flex items-center justify-center">
                                    <motion.img
                                      src={currentJob.svgDataUrl}
                                      alt="Converted"
                                      className="max-w-full max-h-full object-contain"
                                      style={{ transform: `scale(${zoomLevel})` }}
                                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="default" className="bg-cyan text-white text-xs">
                                      Converted SVG
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:hidden gap-3" ref={previewRef}>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Original PNG
                              </p>
                              <div className="aspect-square rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center overflow-hidden touch-none">
                                <motion.img
                                  src={currentJob.pngDataUrl}
                                  alt="Original"
                                  className="max-w-full max-h-full object-contain"
                                  style={{ transform: `scale(${zoomLevel})` }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Converted SVG
                              </p>
                              <div className="aspect-square rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center overflow-hidden touch-none">
                                <motion.img
                                  src={currentJob.svgDataUrl}
                                  alt="Converted"
                                  className="max-w-full max-h-full object-contain"
                                  style={{ transform: `scale(${zoomLevel})` }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center gap-3 mt-6">
                          <Button
                            className="flex-1 gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => handleDownload(currentJob)}
                          >
                            <DownloadSimple weight="bold" />
                            Download SVG
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            New Image
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4 md:space-y-6">
                {isMobile ? (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full min-h-[44px] gap-2">
                        <SlidersHorizontal weight="bold" />
                        Conversion Settings
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh]">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <SlidersHorizontal className="w-5 h-5 text-primary" weight="bold" />
                          Settings
                        </SheetTitle>
                        <SheetDescription>
                          Adjust conversion quality and optimization
                        </SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100%-5rem)] mt-6">
                        <div className="space-y-6 pr-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Complexity</label>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(settings.complexity * 100)}%
                              </span>
                            </div>
                            <Slider
                              value={[settings.complexity]}
                              onValueChange={([value]) =>
                                handleSettingChange('complexity', value)
                              }
                              min={0}
                              max={1}
                              step={0.1}
                              className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                              Higher values preserve more details
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">
                                Color Simplification
                              </label>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(settings.colorSimplification * 100)}%
                              </span>
                            </div>
                            <Slider
                              value={[settings.colorSimplification]}
                              onValueChange={([value]) =>
                                handleSettingChange('colorSimplification', value)
                              }
                              min={0}
                              max={1}
                              step={0.1}
                              className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                              Reduce color palette for smaller files
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">
                                Path Smoothing
                              </label>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(settings.pathSmoothing * 100)}%
                              </span>
                            </div>
                            <Slider
                              value={[settings.pathSmoothing]}
                              onValueChange={([value]) =>
                                handleSettingChange('pathSmoothing', value)
                              }
                              min={0}
                              max={1}
                              step={0.1}
                              className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                              Smooth edges for cleaner appearance
                            </p>
                          </div>

                          {currentFile && (
                            <>
                              <Separator />
                              <Button
                                variant="outline"
                                className="w-full min-h-[44px]"
                                onClick={handleReconvert}
                                disabled={isProcessing}
                              >
                                Apply Settings
                              </Button>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-primary" weight="bold" />
                        <h3 className="text-lg font-semibold">Settings</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={undoSettings}
                          disabled={settingsHistoryIndex <= 0}
                          title="Undo settings (Cmd/Ctrl + Z)"
                          className="h-8 w-8"
                        >
                          <ArrowCounterClockwise className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={redoSettings}
                          disabled={settingsHistoryIndex >= settingsHistory.length - 1}
                          title="Redo settings (Cmd/Ctrl + Shift + Z)"
                          className="h-8 w-8"
                        >
                          <ArrowCounterClockwise className="w-4 h-4" style={{ transform: 'scaleX(-1)' }} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Complexity</label>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(settings.complexity * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[settings.complexity]}
                          onValueChange={([value]) =>
                            handleSettingChange('complexity', value)
                          }
                          min={0}
                          max={1}
                          step={0.1}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher values preserve more details
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Color Simplification
                          </label>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(settings.colorSimplification * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[settings.colorSimplification]}
                          onValueChange={([value]) =>
                            handleSettingChange('colorSimplification', value)
                          }
                          min={0}
                          max={1}
                          step={0.1}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          Reduce color palette for smaller files
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Path Smoothing
                          </label>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(settings.pathSmoothing * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[settings.pathSmoothing]}
                          onValueChange={([value]) =>
                            handleSettingChange('pathSmoothing', value)
                          }
                          min={0}
                          max={1}
                          step={0.1}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          Smooth edges for cleaner appearance
                        </p>
                      </div>

                      {currentFile && (
                        <>
                          <Separator />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleReconvert}
                            disabled={isProcessing}
                          >
                            Apply Settings
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                <Card className="p-4 md:p-6 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkle className="w-5 h-5 text-primary" weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">
                        AI-Powered Conversion
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Advanced algorithms analyze your image to create
                        professional-quality vectors that scale infinitely.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold">Batch Conversion</h3>
                {batchFiles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearBatch}
                    className="gap-2"
                  >
                    <Trash weight="bold" />
                    Clear All
                  </Button>
                )}
              </div>

              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-all duration-300 cursor-pointer mb-4',
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  isProcessing && 'pointer-events-none opacity-60'
                )}
                onClick={() => batchFileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={batchFileInputRef}
                  type="file"
                  accept="image/png"
                  multiple
                  className="hidden"
                  onChange={(e) => handleBatchFilesSelect(e.target.files)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-3 md:mb-4">
                    <Files className="w-6 h-6 md:w-8 md:h-8 text-primary" weight="bold" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
                    Select multiple PNG files
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                    Upload up to 50 files at once (10MB each max)
                  </p>
                  <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0">
                    Select Files
                  </Button>
                </motion.div>
              </div>

              {batchFiles.length > 0 && !isProcessing && batchJobs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {batchFiles.length} file{batchFiles.length > 1 ? 's' : ''} ready
                    </p>
                    <Button
                      onClick={handleBatchConvert}
                      className="gap-2 min-h-[44px] md:min-h-0"
                    >
                      <Sparkle weight="fill" />
                      Convert All
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] rounded-lg border border-border">
                    <div className="p-4 space-y-2">
                      {batchFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileImage className="w-5 h-5 text-muted-foreground flex-shrink-0" weight="bold" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBatchFile(index)}
                            className="flex-shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8">
                    <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4 animate-pulse">
                      <Sparkle className="w-8 h-8 text-primary" weight="fill" />
                    </div>
                    <p className="text-sm font-medium mb-2">
                      Converting files...
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {batchProgress.completed} of {batchProgress.total} complete
                    </p>
                    <Progress 
                      value={(batchProgress.completed / batchProgress.total) * 100} 
                      className="h-2 max-w-md mx-auto"
                    />
                  </div>
                </motion.div>
              )}

              {batchJobs.length > 0 && !isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" weight="bold" />
                      <div>
                        <p className="font-medium text-sm">Conversion Complete</p>
                        <p className="text-xs text-muted-foreground">
                          {batchJobs.filter(j => j.status === 'completed').length} succeeded
                          {batchJobs.filter(j => j.status === 'failed').length > 0 && 
                            `, ${batchJobs.filter(j => j.status === 'failed').length} failed`
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadAllBatch}
                      className="gap-2 min-h-[44px] md:min-h-0"
                    >
                      <DownloadSimple weight="bold" />
                      Download All
                    </Button>
                  </div>

                  <ScrollArea className="h-[400px] rounded-lg border border-border">
                    <div className="p-4 space-y-2">
                      {batchJobs.map((job, index) => (
                        <div
                          key={job.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg transition-colors',
                            job.status === 'completed' 
                              ? 'bg-muted/30 hover:bg-muted/50' 
                              : 'bg-destructive/10'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {job.status === 'completed' ? (
                              <Check className="w-5 h-5 text-primary flex-shrink-0" weight="bold" />
                            ) : (
                              <Warning className="w-5 h-5 text-destructive flex-shrink-0" weight="bold" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{job.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {job.status === 'completed' 
                                  ? `${formatFileSize(job.originalSize)} → ${formatFileSize(job.svgSize)}`
                                  : job.error || 'Failed to convert'
                                }
                              </p>
                            </div>
                          </div>
                          {job.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(job)}
                              className="flex-shrink-0 gap-2 min-h-[44px] md:min-h-0"
                            >
                              <DownloadSimple weight="bold" className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-4">Conversion History</h3>

              {!history || history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                    <ClockCounterClockwise
                      className="w-8 h-8 text-muted-foreground"
                      weight="bold"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No conversions yet. Upload a PNG to get started!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] md:h-[600px] pr-4">
                  <div className="space-y-3">
                    {(history || []).map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className="p-3 md:p-4 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => loadHistoryItem(job)}
                        >
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={job.pngDataUrl}
                                alt={job.filename}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileImage
                                    className="w-4 h-4 text-muted-foreground flex-shrink-0"
                                    weight="bold"
                                  />
                                  <p className="font-medium text-sm truncate">
                                    {job.filename}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(job)
                                  }}
                                >
                                  <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                <span>
                                  {new Date(job.timestamp).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>{formatFileSize(job.originalSize)}</span>
                                <span>→</span>
                                <span>{formatFileSize(job.svgSize)}</span>
                                {getSizeReduction(job) > 0 && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="h-5 text-xs">
                                      {getSizeReduction(job)}% smaller
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </TabsContent>
        </Tabs>
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

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShortcuts(false)}
                  className="h-8 w-8"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Upload file</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + O
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Download SVG</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + S
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom in</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + =
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom out</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + -
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reset zoom</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + 0
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Undo settings</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + Z
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Redo settings</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'} + Shift + Z
                  </Badge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
