import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SlidersHorizontal, ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react'
import { ConversionSettings } from '@/lib/converter'
import { useIsMobile } from '@/hooks/use-mobile'

interface SettingsPanelProps {
  settings: ConversionSettings
  onSettingChange: (key: keyof ConversionSettings, value: number) => void
  onReconvert?: () => void
  canReconvert: boolean
  isProcessing: boolean
  historyIndex: number
  historyLength: number
  onUndo: () => void
  onRedo: () => void
  onAIOptimize?: () => void
  isAIOptimizing?: boolean
}

export function SettingsPanel({
  settings,
  onSettingChange,
  onReconvert,
  canReconvert,
  isProcessing,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  onAIOptimize,
  isAIOptimizing = false,
}: SettingsPanelProps) {
  const isMobile = useIsMobile()

  const SettingsContent = () => (
    <div className="space-y-6">
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
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Complexity</label>
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
        <p className="text-xs text-muted-foreground">
          Higher values preserve more details
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Color Simplification</label>
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
        <p className="text-xs text-muted-foreground">
          Reduce color palette for smaller files
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Path Smoothing</label>
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
        <p className="text-xs text-muted-foreground">
          Smooth edges for cleaner appearance
        </p>
      </div>

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
