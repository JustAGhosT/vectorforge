import { useState, useRef, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  UploadSimple,
  FileImage,
  Sparkle,
  DownloadSimple,
  SlidersHorizontal,
  ClockCounterClockwise,
  Check,
  Warning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  convertPngToSvg,
  formatFileSize,
  generateJobId,
  type ConversionJob,
  type ConversionSettings,
} from '@/lib/converter'
import { cn } from '@/lib/utils'

function App() {
  const [history, setHistory] = useKV<ConversionJob[]>('conversion-history', [])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<ConversionJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [settings, setSettings] = useState<ConversionSettings>({
    complexity: 0.5,
    colorSimplification: 0.5,
    pathSmoothing: 0.5,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + Math.random() * 15, 90))
        }, 200)

        const reader = new FileReader()
        const pngDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        const { svgDataUrl, svgSize } = await convertPngToSvg(file, settings)

        clearInterval(progressInterval)
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

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
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

  const handleSettingChange = (key: keyof ConversionSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const loadHistoryItem = useCallback((job: ConversionJob) => {
    setCurrentJob(job)
    setSettings(job.settings)
    toast.info('Loaded from history', {
      description: job.filename,
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkle className="w-6 h-6 text-primary-foreground" weight="fill" />
            </div>
            <div>
              <h1 className="text-[32px] font-bold tracking-tight leading-none">
                VectorForge
              </h1>
              <p className="text-sm text-muted-foreground">
                Smart PNG to SVG Converter
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="convert" className="gap-2">
              <UploadSimple weight="bold" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClockCounterClockwise weight="bold" />
              History ({history?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer',
                      isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30',
                      isProcessing && 'pointer-events-none opacity-60'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />

                    {!isProcessing ? (
                      <>
                        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                          <UploadSimple
                            className="w-8 h-8 text-primary"
                            weight="bold"
                          />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Drop your PNG here or click to upload
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Maximum file size: 10MB
                        </p>
                        <Button variant="outline" size="sm">
                          Select File
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-2 animate-pulse">
                          <Sparkle
                            className="w-8 h-8 text-primary"
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
                      </div>
                    )}
                  </div>
                </Card>

                {currentJob && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Preview</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {formatFileSize(currentJob.originalSize)}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="default" className="bg-[oklch(0.7_0.15_195)]">
                          {formatFileSize(currentJob.svgSize)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Original PNG
                        </p>
                        <div className="aspect-square rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center overflow-hidden">
                          <img
                            src={currentJob.pngDataUrl}
                            alt="Original"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Converted SVG
                        </p>
                        <div className="aspect-square rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center overflow-hidden">
                          <img
                            src={currentJob.svgDataUrl}
                            alt="Converted"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => handleDownload(currentJob)}
                      >
                        <DownloadSimple weight="bold" />
                        Download SVG
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        New Image
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <SlidersHorizontal className="w-5 h-5 text-primary" weight="bold" />
                    <h3 className="text-lg font-semibold">Settings</h3>
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

                <Card className="p-6 bg-primary/5 border-primary/20">
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

          <TabsContent value="history">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversion History</h3>

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
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {(history || []).map((job) => (
                      <Card
                        key={job.id}
                        className="p-4 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => loadHistoryItem(job)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                className="gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownload(job)
                                }}
                              >
                                <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {new Date(job.timestamp).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(job.originalSize)}</span>
                              <span>→</span>
                              <span>{formatFileSize(job.svgSize)}</span>
                              <span>•</span>
                              <Badge variant="secondary" className="h-5 text-xs">
                                {Math.round(
                                  ((job.originalSize - job.svgSize) /
                                    job.originalSize) *
                                    100
                                )}
                                % smaller
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2024 VectorForge. Professional-quality SVG conversion.</p>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[oklch(0.7_0.15_195)]" weight="bold" />
              <span>Ready to convert</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
