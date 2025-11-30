import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useSvgModification, type SvgModificationOptions } from '@/hooks/use-svg-modification'
import { toast } from 'sonner'

interface SvgPostProcessingPanelProps {
  currentSvg: string | null
  onApplyChange: (newSvg: string) => void
  onActivityLog?: (title: string, description: string) => void
  className?: string
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
  
  const svgInfo = useMemo(() => {
    if (!currentSvg) return null
    return getSvgInfo(currentSvg)
  }, [currentSvg, getSvgInfo])

  // Helper to handle transformation results with proper feedback
  const applyWithFeedback = useCallback((
    modified: string,
    successTitle: string,
    successDesc: string,
    noChangeTitle: string
  ) => {
    if (modified === currentSvg) {
      toast.info('No changes detected', {
        description: `${noChangeTitle} - SVG unchanged`,
      })
      onActivityLog?.(noChangeTitle, 'No changes - SVG unchanged')
    } else {
      onApplyChange(modified)
      onActivityLog?.(successTitle, successDesc)
      toast.success(successTitle, {
        description: successDesc,
      })
    }
  }, [currentSvg, onApplyChange, onActivityLog])

  // Background removal
  const handleRemoveBackground = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { removeBackground: true })
    applyWithFeedback(
      modified,
      'Background removed',
      'White/light background elements removed',
      'Remove Background'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

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
      'Add Border'
    )
  }, [currentSvg, modifySvg, applyWithFeedback, borderType, borderColor, borderWidth, borderPadding])

  const handleRemoveColorBlocks = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { removePotraceBlocks: true })
    applyWithFeedback(
      modified,
      'Color blocks merged',
      'Similar adjacent color regions merged',
      'Merge Colors'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleSimplifyPaths = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { simplifyPaths: true })
    applyWithFeedback(
      modified,
      'Paths simplified',
      'Path precision reduced for smaller file size',
      'Simplify Paths'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleOptimizeGroups = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { optimizeGroups: true })
    applyWithFeedback(
      modified,
      'Groups optimized',
      'Unnecessary nested groups removed',
      'Optimize Groups'
    )
  }, [currentSvg, modifySvg, applyWithFeedback])

  const handleRemoveEmptyElements = useCallback(() => {
    if (!currentSvg) return

    const modified = modifySvg(currentSvg, { removeEmptyElements: true })
    applyWithFeedback(
      modified,
      'Empty elements removed',
      'SVG has been cleaned up',
      'Remove Empty Elements'
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
      'Full Optimization'
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
          <CollapsibleContent className="pt-2 space-y-2">
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
                  Remove white/light background for transparency
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
