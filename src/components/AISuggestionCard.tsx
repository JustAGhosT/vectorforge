import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Sparkle, Info, CheckCircle, WarningCircle, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AIOptimizationSuggestion, ImageAnalysis } from '@/lib/ai-optimizer'

interface AISuggestionCardProps {
  suggestion: AIOptimizationSuggestion
  analysis: ImageAnalysis | null
  onApply: (settings: {
    complexity: number
    colorSimplification: number
    pathSmoothing: number
  }) => void
  onDismiss: () => void
  isApplying?: boolean
}

export function AISuggestionCard({
  suggestion,
  analysis,
  onApply,
  onDismiss,
  isApplying = false,
}: AISuggestionCardProps) {
  const getQualityColor = (quality: AIOptimizationSuggestion['estimatedQuality']) => {
    const colors = {
      excellent: 'bg-green-500/10 text-green-700 border-green-500/20',
      good: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      fair: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      poor: 'bg-red-500/10 text-red-700 border-red-500/20',
    }
    return colors[quality]
  }

  const getTypeIcon = (type: AIOptimizationSuggestion['imageType']) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary rounded-lg">
                  <Sparkle className="w-5 h-5 text-primary-foreground" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">AI Optimization Suggestion</h3>
                  <p className="text-xs text-muted-foreground">
                    Analyzed as {getTypeIcon(suggestion.imageType)} •{' '}
                    {Math.round(suggestion.confidence * 100)}% confident
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="font-medium">
                {getTypeIcon(suggestion.imageType)}
              </Badge>
              <Badge className={getQualityColor(suggestion.estimatedQuality)}>
                {suggestion.estimatedQuality.toUpperCase()} Quality
              </Badge>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">
              {suggestion.reasoning}
            </p>

            {analysis && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">
                    {analysis.dimensions.width} × {analysis.dimensions.height}px
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Colors</p>
                  <p className="font-medium">{analysis.colorCount} unique</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Complexity</p>
                  <p className="font-medium capitalize">{analysis.complexity}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Transparency</p>
                  <p className="font-medium">{analysis.hasTransparency ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Suggested Settings
              </p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complexity:</span>
                  <span className="font-medium">
                    {Math.round(suggestion.suggestedComplexity * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color Simplification:</span>
                  <span className="font-medium">
                    {Math.round(suggestion.suggestedColorSimplification * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Path Smoothing:</span>
                  <span className="font-medium">
                    {Math.round(suggestion.suggestedPathSmoothing * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {suggestion.warnings && suggestion.warnings.length > 0 && (
              <Alert variant="default" className="border-yellow-500/20 bg-yellow-500/5">
                <WarningCircle className="w-4 h-4 text-yellow-600" weight="fill" />
                <AlertDescription className="text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    {suggestion.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() =>
                onApply({
                  complexity: suggestion.suggestedComplexity,
                  colorSimplification: suggestion.suggestedColorSimplification,
                  pathSmoothing: suggestion.suggestedPathSmoothing,
                })
              }
              disabled={isApplying}
              className="w-full gap-2"
            >
              <CheckCircle weight="fill" className="w-4 h-4" />
              {isApplying ? 'Applying...' : 'Apply AI Suggestions'}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info weight="fill" className="w-3 h-3" />
              <span>You can manually adjust settings after applying</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
