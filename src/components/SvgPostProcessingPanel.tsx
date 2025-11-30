import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import {
  MagicWand,
  Path,
  Palette,
  Trash,
  Stack,
  ArrowClockwise,
  Info,
  CaretDown,
  Eraser,
  FrameCorners,
  Circle,
  RectangleDashed,
  FileCode,
  SwapCircle,
  PaintBucket,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useSvgModification, type SvgModificationOptions } from '@/hooks/use-svg-modification'
import { extractColorPalette, replaceColor, type ColorInfo } from '@/lib/remix-transformations'
import { toast } from 'sonner'

interface SvgPostProcessingPanelProps {
  currentSvg: string | null
  onApplyChange: (newSvg: string) => void
  onActivityLog?: (title: string, description: string) => void
  className?: string
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Helper to get SVG file size in bytes
function getSvgSize(svg: string): number {
  return new Blob([svg]).size
}

// Border color presets
const BORDER_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#ffffff' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Orange', value: '#f97316' },
]

export function SvgPostProcessingPanel({
  currentSvg,
  onApplyChange,
  onActivityLog,
  className,
}: SvgPostProcessingPanelProps) {
  const { getSvgInfo, modifySvg, isProcessing } = useSvgModification()

  // Border settings state
  const [borderType, setBorderType] = useState<'rounded' | 'circle'>('rounded')
  const [borderColor, setBorderColor] = useState('#000000')
  const [borderWidth, setBorderWidth] = useState(2)
  const [borderPadding, setBorderPadding] = useState(10)

  // Background settings state
  const [includeDarkBg, setIncludeDarkBg] = useState(false)

  // Color replacement state
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [replacementColor, setReplacementColor] = useState('#000000')

  const svgInfo = useMemo(() => {
    if (!currentSvg) return null
    const info = getSvgInfo(currentSvg)
    return {
      ...info,
      size: getSvgSize(currentSvg),
      colorPalette: extractColorPalette(currentSvg),
    }
  }, [currentSvg, getSvgInfo])

  // Helper to handle transformation results with proper feedback
  const applyWithFeedback = useCallback((
    modified: string,
    successTitle: string,
    successDesc: string,
    noChangeReason: string
  ) => {
    if (modified === currentSvg) {
      toast.info('No changes detected', {
        description: noChangeReason,
      })
      onActivityLog?.('No changes', noChangeReason)
    } else {
      const oldSize = getSvgSize(currentSvg!)
      const newSize = getSvgSize(modified)
      const sizeDiff = oldSize - newSize
      const sizeInfo = sizeDiff > 0
        ? ` (saved ${formatFileSize(sizeDiff)})`
        : sizeDiff < 0
          ? ` (added ${formatFileSize(Math.abs(sizeDiff))})`
          : ''

      onApplyChange(modified)
      onActivityLog?.(successTitle, `${successDesc}${sizeInfo}`)
      toast.success(successTitle, {
        description: `${successDesc}${sizeInfo}`,
      })
    }
  }, [currentSvg, onApplyChange, onActivityLog])

  // Background removal
  const handleRemoveBackground = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, {
      removeBackground: true,
      removeDarkBackground: includeDarkBg,
    })
    const bgTypes = includeDarkBg ? 'light and dark' : 'white/light'
    applyWithFeedback(
      modified,
      'Background removed',
      `${bgTypes.charAt(0).toUpperCase() + bgTypes.slice(1)} background elements removed`,
      `No ${bgTypes} background found covering the full SVG`
    )
  }, [currentSvg, modifySvg, applyWithFeedback, includeDarkBg])

  // Color replacement
  const handleReplaceColor = useCallback(() => {
    if (!currentSvg || !selectedColor) return

    const modified = replaceColor(currentSvg, selectedColor, replacementColor)
    applyWithFeedback(
      modified,
      'Color replaced',
      `${selectedColor} replaced with ${replacementColor}`,
      'Color not found in SVG'
    )
    setSelectedColor(null)
  }, [currentSvg, selectedColor, replacementColor, applyWithFeedback])

  // Add border
  const handleAddBorder = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, {
      addBorder: {
        type: borderType,
        color: borderColor,
        strokeWidth: borderWidth,
        padding: borderPadding,
      }
    })
    applyWithFeedback(
      modified,
      'Border added',
      `${borderType === 'circle' ? 'Circle' : 'Rounded'} border with ${borderWidth}px stroke`,
      'Could not add border - SVG may be missing dimensions'
    )
  }, [currentSvg, modifySvg, applyWithFeedback, borderType, borderColor, borderWidth, borderPadding])

  const handleRemoveColorBlocks = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { removePotraceBlocks: true })
    applyWithFeedback(
      modified,
      'Color blocks merged',
      'Similar adjacent color regions merged',
      'No similar color regions found to merge'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleSimplifyPaths = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { simplifyPaths: true })
    applyWithFeedback(
      modified,
      'Paths simplified',
      'Path precision reduced for smaller file size',
      'Paths already simplified or no decimal values found'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleOptimizeGroups = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { optimizeGroups: true })
    applyWithFeedback(
      modified,
      'Groups optimized',
      'Unnecessary nested groups removed',
      'No single-child groups found to optimize'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleRemoveEmptyElements = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { removeEmptyElements: true })
    applyWithFeedback(
      modified,
      'Empty elements removed',
      'SVG has been cleaned up',
      'No empty elements found in SVG'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleFullOptimization = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, {
      removeBackground: true,
      removePotraceBlocks: true,
      simplifyPaths: true,
      optimizeGroups: true,
      removeEmptyElements: true,
    })
    applyWithFeedback(
      modified,
      'SVG fully optimized',
      'All optimizations applied including background removal',
      'SVG is already fully optimized'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  if (!currentSvg) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-md">
              <MagicWand className="w-4 h-4 text-orange-500" weight="fill" />
            </div>
            <div>
              <CardTitle className="text-base">Post-Processing</CardTitle>
              <CardDescription className="text-xs">
                Optimize and modify SVG output
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Info className="w-8 h-8 text-muted-foreground/50 mb-2" weight="light" />
            <p className="text-sm text-muted-foreground">No SVG to process</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Convert an image first
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-md">
              <MagicWand className="w-4 h-4 text-orange-500" weight="fill" />
            </div>
            <div>
              <CardTitle className="text-base">Post-Processing</CardTitle>
              <CardDescription className="text-xs">
                Optimize and modify SVG output
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* SVG Stats */}
        {svgInfo && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <FileCode className="w-3 h-3" weight="bold" />
              {formatFileSize(svgInfo.size)}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Path className="w-3 h-3" weight="bold" />
              {svgInfo.pathCount} paths
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Stack className="w-3 h-3" weight="bold" />
              {svgInfo.groupCount} groups
            </Badge>
            {svgInfo.hasEmptyElements && (
              <Badge variant="outline" className="gap-1.5 text-xs text-yellow-600 border-yellow-500/30">
                <Trash className="w-3 h-3" weight="bold" />
                Has empty elements
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Background Section - Most common operation */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-sm font-semibold hover:text-primary transition-colors">
            <div className="flex items-center gap-2">
              <Eraser weight="bold" className="w-4 h-4 text-red-500" />
              Background
            </div>
            <CaretDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {/* Include dark backgrounds toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="include-dark-bg" className="text-xs cursor-pointer">
                Include dark backgrounds
              </Label>
              <Switch
                id="include-dark-bg"
                checked={includeDarkBg}
                onCheckedChange={setIncludeDarkBg}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-auto py-2.5 justify-start gap-2"
              onClick={handleRemoveBackground}
              disabled={isProcessing}
            >
              <Eraser className="w-4 h-4 text-red-500" weight="fill" />
              <div className="text-left">
                <div className="text-xs font-medium">Remove Background</div>
                <div className="text-[10px] text-muted-foreground">
                  {includeDarkBg
                    ? 'Remove light and dark backgrounds'
                    : 'Remove white/light background for transparency'}
                </div>
              </div>
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Border Section */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-sm font-semibold hover:text-primary transition-colors">
            <div className="flex items-center gap-2">
              <FrameCorners weight="bold" className="w-4 h-4 text-blue-500" />
              Add Border
            </div>
            <CaretDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {/* Border Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={borderType === 'rounded' ? 'default' : 'outline'}
                size="sm"
                className="h-auto py-2 gap-1.5"
                onClick={() => setBorderType('rounded')}
              >
                <RectangleDashed className="w-4 h-4" weight="bold" />
                <span className="text-xs">Rounded</span>
              </Button>
              <Button
                variant={borderType === 'circle' ? 'default' : 'outline'}
                size="sm"
                className="h-auto py-2 gap-1.5"
                onClick={() => setBorderType('circle')}
              >
                <Circle className="w-4 h-4" weight="bold" />
                <span className="text-xs">Circle</span>
              </Button>
            </div>

            {/* Border Color */}
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Select value={borderColor} onValueChange={setBorderColor}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm border border-border" 
                        style={{ backgroundColor: borderColor }}
                      />
                      {BORDER_COLORS.find(c => c.value === borderColor)?.label || borderColor}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BORDER_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm border border-border" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Width */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs">Stroke Width</Label>
                <span className="text-xs text-muted-foreground">{borderWidth}px</span>
              </div>
              <Slider
                value={[borderWidth]}
                onValueChange={([v]) => setBorderWidth(v)}
                min={1}
                max={10}
                step={1}
                className="cursor-pointer"
              />
            </div>

            {/* Border Padding */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs">Padding</Label>
                <span className="text-xs text-muted-foreground">{borderPadding}px</span>
              </div>
              <Slider
                value={[borderPadding]}
                onValueChange={([v]) => setBorderPadding(v)}
                min={0}
                max={50}
                step={5}
                className="cursor-pointer"
              />
            </div>

            <Button
              className="w-full gap-2"
              size="sm"
              onClick={handleAddBorder}
              disabled={isProcessing}
            >
              <FrameCorners className="w-4 h-4" weight="fill" />
              Apply Border
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Color Palette Section */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-sm font-semibold hover:text-primary transition-colors">
            <div className="flex items-center gap-2">
              <Palette weight="bold" className="w-4 h-4 text-purple-500" />
              Color Palette
              {svgInfo?.colorPalette && svgInfo.colorPalette.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {svgInfo.colorPalette.length}
                </Badge>
              )}
            </div>
            <CaretDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {svgInfo?.colorPalette && svgInfo.colorPalette.length > 0 ? (
              <>
                {/* Color swatches */}
                <div className="flex flex-wrap gap-1.5">
                  {svgInfo.colorPalette.slice(0, 12).map((colorInfo, index) => (
                    <Popover key={index}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'w-7 h-7 rounded border-2 transition-all hover:scale-110',
                            selectedColor === colorInfo.color
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50'
                          )}
                          style={{ backgroundColor: colorInfo.color }}
                          title={`${colorInfo.color} (${colorInfo.count} uses)`}
                          onClick={() => {
                            setSelectedColor(colorInfo.color)
                            setReplacementColor(colorInfo.color)
                          }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-3" align="start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-border"
                              style={{ backgroundColor: colorInfo.color }}
                            />
                            <div>
                              <p className="text-xs font-mono">{colorInfo.color}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {colorInfo.count} {colorInfo.count === 1 ? 'use' : 'uses'} ({colorInfo.type})
                              </p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>

                {/* Color replacement */}
                {selectedColor && (
                  <div className="space-y-2 p-2 bg-muted/50 rounded-md">
                    <Label className="text-xs font-medium">Replace Color</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-border shrink-0"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <SwapCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        type="color"
                        value={replacementColor}
                        onChange={(e) => setReplacementColor(e.target.value)}
                        className="w-10 h-8 p-0.5 cursor-pointer shrink-0"
                      />
                      <Input
                        type="text"
                        value={replacementColor}
                        onChange={(e) => setReplacementColor(e.target.value)}
                        className="h-8 text-xs font-mono flex-1"
                        placeholder="#000000"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={handleReplaceColor}
                        disabled={isProcessing || selectedColor === replacementColor}
                      >
                        <PaintBucket className="w-3.5 h-3.5" weight="fill" />
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedColor(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {svgInfo.colorPalette.length > 12 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    +{svgInfo.colorPalette.length - 12} more colors
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No colors found in SVG
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Optimization Section */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-sm font-semibold hover:text-primary transition-colors">
            <div className="flex items-center gap-2">
              <MagicWand weight="bold" className="w-4 h-4 text-orange-500" />
              Optimization
            </div>
            <CaretDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 flex-col items-start text-left gap-1"
                onClick={handleRemoveColorBlocks}
                disabled={isProcessing}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Palette className="w-3.5 h-3.5 text-purple-500" weight="fill" />
                  Merge Colors
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Reduce color blocks
                </p>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 flex-col items-start text-left gap-1"
                onClick={handleSimplifyPaths}
                disabled={isProcessing}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Path className="w-3.5 h-3.5 text-cyan-500" weight="fill" />
                  Simplify Paths
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Reduce precision
                </p>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 flex-col items-start text-left gap-1"
                onClick={handleOptimizeGroups}
                disabled={isProcessing}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Stack className="w-3.5 h-3.5 text-orange-500" weight="fill" />
                  Optimize Groups
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Flatten nesting
                </p>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 flex-col items-start text-left gap-1"
                onClick={handleRemoveEmptyElements}
                disabled={isProcessing || !svgInfo?.hasEmptyElements}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Trash className="w-3.5 h-3.5 text-destructive" weight="fill" />
                  Remove Empty
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Clean up SVG
                </p>
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Full Optimization Button */}
        <Button
          className="w-full gap-2"
          onClick={handleFullOptimization}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ArrowClockwise className="w-4 h-4 animate-spin" weight="bold" />
          ) : (
            <MagicWand className="w-4 h-4" weight="fill" />
          )}
          {isProcessing ? 'Processing...' : 'Full Optimization'}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Removes background and applies all optimizations
        </p>
      </CardContent>
    </Card>
  )
}
