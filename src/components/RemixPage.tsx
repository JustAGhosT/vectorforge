import { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkle,
  MagicWand,
  ArrowClockwise,
  ArrowCounterClockwise,
  DownloadSimple,
  CheckCircle,
  WarningCircle,
  Star,
  BoundingBox,
  Circle,
  Square,
  Path,
  Eraser,
  Sun,
  Palette,
  ArrowsLeftRight,
  ArrowsDownUp,
  ArrowsOut,
  ArrowsIn,
  Lightbulb,
  Clock,
  Trash,
  Copy,
  Check,
  Eye,
  CaretUp,
  CaretDown,
  Lightning,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRemix, type RemixSuggestion, type RemixHistoryItem } from '@/hooks/use-remix'
import { getAvailableTransformations } from '@/lib/remix-transformations'
import type { ComparisonResult } from '@/lib/ai-comparison'

interface RemixPageProps {
  svgContent: string | null
  pngDataUrl: string | null
  onApplyChanges: (newSvg: string) => void
  onDownload: () => void
  comparison?: ComparisonResult | null
  className?: string
}

const categoryIcons: Record<string, React.ElementType> = {
  border: BoundingBox,
  background: Square,
  color: Palette,
  transform: ArrowsOut,
  style: MagicWand,
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const categoryColors = {
  improvement: 'text-blue-600 dark:text-blue-400',
  style: 'text-purple-600 dark:text-purple-400',
  optimization: 'text-green-600 dark:text-green-400',
  accessibility: 'text-orange-600 dark:text-orange-400',
}

export function RemixPage({
  svgContent,
  pngDataUrl,
  onApplyChanges,
  onDownload,
  comparison,
  className,
}: RemixPageProps) {
  const {
    isAnalyzing,
    analysis,
    history,
    currentSvg,
    setCurrentSvg,
    analyzeWithAI,
    applyTransformation,
    restoreFromHistory,
    clearHistory,
    clearAnalysis,
  } = useRemix()

  const [activeTab, setActiveTab] = useState('suggestions')
  const [previewSvg, setPreviewSvg] = useState<string | null>(null)
  const [copiedSvg, setCopiedSvg] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['border', 'background']))
  
  // Border options state
  const [borderOptions, setBorderOptions] = useState({
    strokeWidth: 2,
    strokeColor: '#000000',
    padding: 10,
  })

  const transformations = useMemo(() => getAvailableTransformations(), [])
  const transformationsByCategory = useMemo(() => {
    const grouped: Record<string, typeof transformations> = {}
    transformations.forEach((t) => {
      if (!grouped[t.category]) {
        grouped[t.category] = []
      }
      grouped[t.category].push(t)
    })
    return grouped
  }, [transformations])

  // Initialize with provided SVG
  useEffect(() => {
    if (svgContent && !currentSvg) {
      setCurrentSvg(svgContent)
    }
  }, [svgContent, currentSvg, setCurrentSvg])

  const displaySvg = previewSvg || currentSvg || svgContent

  const handleAnalyze = useCallback(async () => {
    if (!displaySvg) {
      toast.error('No SVG to analyze')
      return
    }

    try {
      await analyzeWithAI(displaySvg)
      toast.success('Analysis complete!', {
        description: 'AI has evaluated your SVG and provided suggestions',
      })
    } catch (error) {
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    }
  }, [displaySvg, analyzeWithAI])

  const handleApplyTransformation = useCallback((transformationId: string, options?: Record<string, unknown>) => {
    if (!displaySvg) {
      toast.error('No SVG to transform')
      return
    }

    try {
      const result = applyTransformation(displaySvg, transformationId, options)
      setPreviewSvg(null)
      toast.success('Transformation applied!', {
        description: 'Your SVG has been updated',
      })
    } catch (error) {
      toast.error('Transformation failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    }
  }, [displaySvg, applyTransformation])

  const handlePreviewTransformation = useCallback((transformationId: string, options?: Record<string, unknown>) => {
    if (!displaySvg) return
    
    try {
      const result = applyTransformation(displaySvg, transformationId, options)
      setPreviewSvg(result)
    } catch {
      // Silently fail preview
    }
  }, [displaySvg, applyTransformation])

  const handleCancelPreview = useCallback(() => {
    setPreviewSvg(null)
  }, [])

  const handleApplyPreview = useCallback(() => {
    if (previewSvg) {
      setCurrentSvg(previewSvg)
      setPreviewSvg(null)
      toast.success('Changes applied!')
    }
  }, [previewSvg, setCurrentSvg])

  const handleApplyToMain = useCallback(() => {
    if (currentSvg) {
      onApplyChanges(currentSvg)
      toast.success('Applied to main converter!', {
        description: 'Your remixed SVG is now the active conversion',
      })
    }
  }, [currentSvg, onApplyChanges])

  const handleCopySvg = useCallback(async () => {
    if (!displaySvg) return
    
    try {
      await navigator.clipboard.writeText(displaySvg)
      setCopiedSvg(true)
      setTimeout(() => setCopiedSvg(false), 2000)
      toast.success('SVG copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }, [displaySvg])

  const handleRestoreHistory = useCallback((item: RemixHistoryItem) => {
    restoreFromHistory(item)
    setPreviewSvg(null)
    toast.info('Restored from history', {
      description: item.transformationName,
    })
  }, [restoreFromHistory])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }, [])

  if (!svgContent) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MagicWand className="w-12 h-12 text-muted-foreground/50 mb-4" weight="light" />
          <h3 className="text-lg font-semibold mb-2">No SVG to Remix</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Convert an image first, then come here to remix and improve it
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
            <MagicWand className="w-6 h-6 text-white" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold">SVG Remix Studio</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered improvements and transformations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySvg}
            className="gap-2"
          >
            {copiedSvg ? (
              <>
                <Check className="w-4 h-4" weight="bold" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" weight="bold" />
                Copy SVG
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="gap-2"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleApplyToMain}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" weight="bold" />
            Apply Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" weight="bold" />
                  Preview
                  {previewSvg && (
                    <Badge variant="secondary" className="text-xs">
                      Preview Mode
                    </Badge>
                  )}
                </CardTitle>
                {previewSvg && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelPreview}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyPreview}
                      className="gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" weight="bold" />
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="relative aspect-square max-h-[500px] rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                    linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                    linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              >
                {displaySvg && (
                  <img
                    src={`data:image/svg+xml,${encodeURIComponent(displaySvg)}`}
                    alt="SVG Preview"
                    className="max-w-full max-h-full object-contain p-4"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comparison Rating Display */}
          {comparison && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" weight="fill" />
                  <CardTitle className="text-base">Quality Rating</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Similarity Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{comparison.similarityScore}%</span>
                    <Badge variant="outline" className="text-xs">
                      {comparison.similarityScore >= 90 ? 'Excellent' : 
                       comparison.similarityScore >= 75 ? 'Good' : 
                       comparison.similarityScore >= 60 ? 'Fair' : 'Needs Work'}
                    </Badge>
                  </div>
                </div>
                <Progress value={comparison.similarityScore} className="h-2" />
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="text-lg font-bold">{comparison.originalRating.score}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Converted</p>
                    <p className="text-lg font-bold">{comparison.convertedRating.score}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">{comparison.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" weight="bold" />
                    Transformation History
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="gap-1.5 text-muted-foreground"
                  >
                    <Trash className="w-3.5 h-3.5" weight="bold" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[100px]">
                  <div className="flex gap-2 pb-2">
                    {history.map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => handleRestoreHistory(item)}
                      >
                        <ArrowCounterClockwise className="w-3.5 h-3.5" weight="bold" />
                        {item.transformationName}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="suggestions" className="gap-1.5">
                <Lightbulb className="w-4 h-4" weight="bold" />
                AI Suggestions
              </TabsTrigger>
              <TabsTrigger value="transforms" className="gap-1.5">
                <MagicWand className="w-4 h-4" weight="bold" />
                Transforms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="mt-4 space-y-4">
              {/* AI Analyze Button */}
              <Button
                className="w-full gap-2"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <ArrowClockwise className="w-4 h-4 animate-spin" weight="bold" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkle className="w-4 h-4" weight="fill" />
                    Analyze with AI
                  </>
                )}
              </Button>

              {/* Analysis Results */}
              {analysis && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Score */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Score</span>
                          <span className="text-2xl font-bold">{analysis.overallScore}</span>
                        </div>
                        <Progress value={analysis.overallScore} className="h-2" />
                      </CardContent>
                    </Card>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-xs flex items-center gap-1.5 text-green-600">
                            <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <ul className="space-y-1">
                            {analysis.strengths.map((s, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground">
                                • {s}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-xs flex items-center gap-1.5 text-amber-600">
                            <WarningCircle className="w-3.5 h-3.5" weight="fill" />
                            Weaknesses
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <ul className="space-y-1">
                            {analysis.weaknesses.map((w, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground">
                                • {w}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Suggestions */}
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <Lightning className="w-4 h-4 text-primary" weight="fill" />
                          Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <ScrollArea className="h-[200px] pr-2">
                          <div className="space-y-2">
                            {analysis.suggestions.map((suggestion) => (
                              <motion.div
                                key={suggestion.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-2.5 rounded-lg bg-muted/50 border border-border space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className={cn('text-xs font-medium', categoryColors[suggestion.category])}>
                                    {suggestion.title}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className={cn('text-[10px] px-1.5', priorityColors[suggestion.priority])}
                                  >
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  {suggestion.description}
                                </p>
                                {suggestion.transformationId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[10px] mt-1"
                                    onClick={() => handleApplyTransformation(suggestion.transformationId!)}
                                  >
                                    Apply
                                  </Button>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Use Cases */}
                    {analysis.useCases.length > 0 && (
                      <Card>
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-xs flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" weight="fill" />
                            Recommended Use Cases
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.useCases.map((useCase, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {useCase}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {!analysis && !isAnalyzing && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkle className="w-8 h-8 mx-auto mb-2 opacity-50" weight="light" />
                  <p className="text-sm">Click "Analyze with AI" to get suggestions</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transforms" className="mt-4 space-y-3">
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-3">
                  {Object.entries(transformationsByCategory).map(([category, transforms]) => {
                    const Icon = categoryIcons[category] || MagicWand
                    const isExpanded = expandedCategories.has(category)
                    
                    return (
                      <Card key={category}>
                        <CardHeader 
                          className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xs flex items-center gap-1.5 capitalize">
                              <Icon className="w-3.5 h-3.5" weight="bold" />
                              {category}
                              <Badge variant="secondary" className="text-[10px] ml-1">
                                {transforms.length}
                              </Badge>
                            </CardTitle>
                            {isExpanded ? (
                              <CaretUp className="w-4 h-4 text-muted-foreground" weight="bold" />
                            ) : (
                              <CaretDown className="w-4 h-4 text-muted-foreground" weight="bold" />
                            )}
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CardContent className="py-2 px-3 space-y-2">
                                {/* Border options for border category */}
                                {category === 'border' && (
                                  <div className="space-y-3 p-2 rounded-lg bg-muted/30 mb-3">
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Stroke Width: {borderOptions.strokeWidth}px</Label>
                                      <Slider
                                        value={[borderOptions.strokeWidth]}
                                        onValueChange={([v]) => setBorderOptions(prev => ({ ...prev, strokeWidth: v }))}
                                        min={1}
                                        max={10}
                                        step={1}
                                        className="h-4"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Padding: {borderOptions.padding}px</Label>
                                      <Slider
                                        value={[borderOptions.padding]}
                                        onValueChange={([v]) => setBorderOptions(prev => ({ ...prev, padding: v }))}
                                        min={0}
                                        max={50}
                                        step={5}
                                        className="h-4"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Color</Label>
                                      <Input
                                        type="color"
                                        value={borderOptions.strokeColor}
                                        onChange={(e) => setBorderOptions(prev => ({ ...prev, strokeColor: e.target.value }))}
                                        className="h-6 p-0.5 w-full"
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                {transforms.map((transform) => (
                                  <div key={transform.id} className="flex items-center justify-between py-1">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{transform.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {transform.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onMouseEnter={() => handlePreviewTransformation(
                                          transform.id,
                                          category === 'border' ? borderOptions : undefined
                                        )}
                                        onMouseLeave={handleCancelPreview}
                                        title="Preview"
                                      >
                                        <Eye className="w-3 h-3" weight="bold" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[10px]"
                                        onClick={() => handleApplyTransformation(
                                          transform.id,
                                          category === 'border' ? borderOptions : undefined
                                        )}
                                      >
                                        Apply
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
