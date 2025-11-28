import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SlidersHorizontal, ArrowCounterClockwise, Sparkle, Lightning, Robot, Palette, CaretDown, BezierCurve, Funnel, Info } from '@phosphor-icons/react'
import { ConversionSettings } from '@/lib/converter'
import { useIsMobile } from '@/hooks/use-mobile'
import { PresetSelector } from '@/components/PresetSelector'
import type { ConversionPreset } from '@/lib/presets'
import { useState } from 'react'

interface SettingsPanelProps {
  settings: ConversionSettings
  onSettingChange: (key: keyof ConversionSettings, value: number | boolean | string) => void
  onApplyPreset?: (preset: ConversionPreset) => void
  onReconvert?: () => void
  canReconvert: boolean
  isProcessing: boolean
  historyIndex: number
  historyLength: number
  onUndo: () => void
  onRedo: () => void
  onAIOptimize?: () => void
  isAIOptimizing?: boolean
  enableAIIterative?: boolean
  onEnableAIIterativeChange?: (enabled: boolean) => void
}

export function SettingsPanel({
  settings,
  onSettingChange,
  onApplyPreset,
  onReconvert,
  canReconvert,
  isProcessing,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  onAIOptimize,
  isAIOptimizing = false,
  enableAIIterative = false,
  onEnableAIIterativeChange,
}: SettingsPanelProps) {
  const isMobile = useIsMobile()
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Helper component for settings with tooltips
  const SettingLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <label className="text-sm font-medium">{label}</label>
            <Info className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  const SettingsContent = () => (
    <div className="space-y-6">
      {/* Quick Presets */}
      {onApplyPreset && (
        <>
          <PresetSelector
            settings={settings}
            onApplyPreset={onApplyPreset}
            disabled={isProcessing}
          />
          <Separator />
        </>
      )}
      
      {onAIOptimize && canReconvert && (
        <>
          <Button
            variant="default"
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={onAIOptimize}
            disabled={isProcessing || isAIOptimizing}
          >
            <Sparkle weight="fill" className="w-4 h-4" />
            {isAIOptimizing ? 'Analyzing...' : 'AI Optimize'}
          </Button>
          <Separator />
        </>
      )}

      {/* Image Options Section */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Palette weight="bold" className="w-4 h-4 text-primary" />
            Image Options
          </div>
          <CaretDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Color Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SettingLabel 
                label="Color Mode" 
                tooltip="Choose between full color output or black & white. B&W is ideal for logos, signatures, and line art."
              />
            </div>
            <Select
              value={settings.colorMode ?? 'colored'}
              onValueChange={(value) => onSettingChange('colorMode', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select color mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colored">Colored</SelectItem>
                <SelectItem value="blackAndWhite">Black & White</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Simplification - only show when colored mode */}
          {(settings.colorMode ?? 'colored') === 'colored' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel 
                  label="Color Simplification" 
                  tooltip="Reduces the number of colors in the output. Higher values = fewer colors, smaller files. Recommended: 60-80% for logos, 20-40% for detailed art."
                />
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.colorSimplification * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.colorSimplification]}
                onValueChange={([value]) => onSettingChange('colorSimplification', value)}
                min={0}
                max={1}
                step={0.1}
                className="cursor-pointer"
              />
            </div>
          )}

          {/* Filter Speckle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel 
                label="Filter Speckle" 
                tooltip="Removes small noise patches smaller than this size. Useful for cleaning up scanned images or photos. Higher values remove more small details."
              />
              <span className="text-xs text-muted-foreground">
                {settings.filterSpeckle ?? 0}px
              </span>
            </div>
            <Slider
              value={[settings.filterSpeckle ?? 0]}
              onValueChange={([value]) => onSettingChange('filterSpeckle', value)}
              min={0}
              max={50}
              step={1}
              className="cursor-pointer"
            />
          </div>

          {/* Complexity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel 
                label="Complexity" 
                tooltip="Controls how much detail is preserved. Higher values capture more fine details but may increase file size. Lower values create simpler, cleaner shapes."
              />
              <span className="text-xs text-muted-foreground">
                {Math.round(settings.complexity * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.complexity]}
              onValueChange={([value]) => onSettingChange('complexity', value)}
              min={0}
              max={1}
              step={0.1}
              className="cursor-pointer"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Curve Fitting Section */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <BezierCurve weight="bold" className="w-4 h-4 text-primary" />
            Curve Fitting
          </div>
          <CaretDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Curve Fitting Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SettingLabel 
                label="Curve Mode" 
                tooltip="Spline creates smooth curves (best for organic shapes). Polygon creates straight-edged shapes (best for geometric designs). Pixel preserves original pixel edges."
              />
            </div>
            <Select
              value={settings.curveFitting ?? 'spline'}
              onValueChange={(value) => onSettingChange('curveFitting', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select curve mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spline">Spline (Smooth curves)</SelectItem>
                <SelectItem value="polygon">Polygon (Straight edges)</SelectItem>
                <SelectItem value="pixel">Pixel (Preserve edges)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Path Smoothing - only relevant for spline mode */}
          {(settings.curveFitting ?? 'spline') === 'spline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel 
                  label="Path Smoothing" 
                  tooltip="Controls how smooth the curves are. Higher values create smoother, more flowing lines. Lower values stay closer to the original shape."
                />
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.pathSmoothing * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.pathSmoothing]}
                onValueChange={([value]) => onSettingChange('pathSmoothing', value)}
                min={0}
                max={1}
                step={0.1}
                className="cursor-pointer"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Advanced Section */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Funnel weight="bold" className="w-4 h-4 text-primary" />
            Advanced
          </div>
          <CaretDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Corner Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel 
                label="Corner Threshold" 
                tooltip="Angle threshold for detecting corners. Lower values detect more corners (sharper result). Higher values smooth more corners into curves."
              />
              <span className="text-xs text-muted-foreground">
                {settings.cornerThreshold ?? 90}°
              </span>
            </div>
            <Slider
              value={[settings.cornerThreshold ?? 90]}
              onValueChange={([value]) => onSettingChange('cornerThreshold', value)}
              min={0}
              max={180}
              step={5}
              className="cursor-pointer"
            />
          </div>

          {/* Potrace Engine */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <Lightning weight="fill" className="w-4 h-4 text-orange" />
                      <label className="text-sm font-medium">Potrace Engine</label>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Professional-grade tracing algorithm with WASM acceleration. Produces higher quality results for most images.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Switch
                checked={settings.usePotrace ?? false}
                onCheckedChange={(checked) => onSettingChange('usePotrace', checked)}
              />
            </div>
          </div>

          {onEnableAIIterativeChange && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Robot weight="fill" className="w-4 h-4 text-purple-500" />
                        <label className="text-sm font-medium">AI Iterative Refinement</label>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Use AI to automatically improve conversion quality through multiple iterations. Finds the optimal settings for your image.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Switch
                  checked={enableAIIterative}
                  onCheckedChange={onEnableAIIterativeChange}
                />
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {canReconvert && onReconvert && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={onReconvert}
            disabled={isProcessing}
          >
            Apply Settings
          </Button>
        </>
      )}
    </div>
  )

  if (isMobile) {
    return (
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
            <div className="pr-4">
              <SettingsContent />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
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
            onClick={onUndo}
            disabled={historyIndex <= 0}
            title="Undo settings (Cmd/Ctrl + Z)"
            className="h-8 w-8"
          >
            <ArrowCounterClockwise className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={historyIndex >= historyLength - 1}
            title="Redo settings (Cmd/Ctrl + Shift + Z)"
            className="h-8 w-8"
          >
            <ArrowCounterClockwise className="w-4 h-4" style={{ transform: 'scaleX(-1)' }} />
          </Button>
        </div>
      </div>
      <SettingsContent />
    </Card>
  )
}

export function SettingsInfoCard() {
  return (
    <Card className="p-4 md:p-6 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkle className="w-5 h-5 text-primary" weight="fill" />
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">AI-Powered Conversion</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Advanced algorithms analyze your image to create professional-quality
            vectors that scale infinitely.
          </p>
        </div>
      </div>
    </Card>
  )
}
