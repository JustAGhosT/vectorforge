import { useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  MagicWand,
  Path,
  Palette,
  Trash,
  Stack,
  ArrowClockwise,
  CheckCircle,
  Info,
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

interface ProcessingOption {
  id: keyof SvgModificationOptions
  label: string
  description: string
  icon: typeof MagicWand
  enabled: boolean
}

export function SvgPostProcessingPanel({
  currentSvg,
  onApplyChange,
  onActivityLog,
  className,
}: SvgPostProcessingPanelProps) {
  const { getSvgInfo, modifySvg, isProcessing } = useSvgModification()
  
  const svgInfo = useMemo(() => {
    if (!currentSvg) return null
    return getSvgInfo(currentSvg)
  }, [currentSvg, getSvgInfo])

  const handleRemoveColorBlocks = useCallback(() => {
    if (!currentSvg) return
    
    const modified = modifySvg(currentSvg, { removePotraceBlocks: true })
    onApplyChange(modified)
    onActivityLog?.('Removed color blocks', 'Merged similar adjacent color regions')
    toast.success('Color blocks removed', {
      description: 'Similar colors have been merged',
    })
  }, [currentSvg, modifySvg, onApplyChange, onActivityLog])

  const handleSimplifyPaths = useCallback(() => {
    if (!currentSvg) return
    
    const modified = modifySvg(currentSvg, { simplifyPaths: true })
    onApplyChange(modified)
    onActivityLog?.('Simplified paths', 'Reduced path precision for smaller file size')
    toast.success('Paths simplified', {
      description: 'Path precision has been reduced',
    })
  }, [currentSvg, modifySvg, onApplyChange, onActivityLog])

  const handleOptimizeGroups = useCallback(() => {
    if (!currentSvg) return
    
    const modified = modifySvg(currentSvg, { optimizeGroups: true })
    onApplyChange(modified)
    onActivityLog?.('Optimized groups', 'Removed unnecessary nested groups')
    toast.success('Groups optimized', {
      description: 'Unnecessary groups have been removed',
    })
  }, [currentSvg, modifySvg, onApplyChange, onActivityLog])

  const handleRemoveEmptyElements = useCallback(() => {
    if (!currentSvg) return
    
    const modified = modifySvg(currentSvg, { removeEmptyElements: true })
    onApplyChange(modified)
    onActivityLog?.('Removed empty elements', 'Cleaned up empty SVG elements')
    toast.success('Empty elements removed', {
      description: 'SVG has been cleaned up',
    })
  }, [currentSvg, modifySvg, onApplyChange, onActivityLog])

  const handleFullOptimization = useCallback(() => {
    if (!currentSvg) return
    
    const modified = modifySvg(currentSvg, {
      removePotraceBlocks: true,
      simplifyPaths: true,
      optimizeGroups: true,
      removeEmptyElements: true,
    })
    onApplyChange(modified)
    onActivityLog?.('Full SVG optimization', 'Applied all optimization techniques')
    toast.success('SVG fully optimized', {
      description: 'All optimizations have been applied',
    })
  }, [currentSvg, modifySvg, onApplyChange, onActivityLog])

  if (!currentSvg) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange/10 rounded-md">
              <MagicWand className="w-4 h-4 text-orange" weight="fill" />
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
            <div className="p-1.5 bg-orange/10 rounded-md">
              <MagicWand className="w-4 h-4 text-orange" weight="fill" />
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

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
          
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
                <Path className="w-3.5 h-3.5 text-cyan" weight="fill" />
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
                <Stack className="w-3.5 h-3.5 text-orange" weight="fill" />
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
        </div>

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
          Applies all optimizations at once
        </p>
      </CardContent>
    </Card>
  )
}
