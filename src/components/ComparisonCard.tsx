import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sparkle,
  CheckCircle,
  WarningCircle,
  Info,
  X,
  ArrowRight,
  Palette,
  Polygon,
  MagnifyingGlass,
  BoundingBox,
  Gradient,
  Question,
  Image,
  FileSvg,
  Star,
  TrendUp,
  TrendDown,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ComparisonResult, DifferenceItem } from '@/lib/ai-comparison'
import { getSimilarityLabel, getSeverityInfo, getRatingLabel } from '@/lib/ai-comparison'

interface ComparisonCardProps {
  comparison: ComparisonResult
  onRefineWithAI: () => void
  onDismiss: () => void
  isRefining: boolean
  className?: string
}

const categoryIcons: Record<DifferenceItem['category'], React.ElementType> = {
  color: Palette,
  shape: Polygon,
  detail: MagnifyingGlass,
  edge: BoundingBox,
  texture: Gradient,
  other: Question,
}

export function ComparisonCard({
  comparison,
  onRefineWithAI,
  onDismiss,
  isRefining,
  className,
}: ComparisonCardProps) {
  const { label: similarityLabel, color: similarityColor } = getSimilarityLabel(
    comparison.similarityScore
  )
  
  const { label: originalLabel, color: originalColor } = getRatingLabel(
    comparison.originalRating.score
  )
  
  const { label: convertedLabel, color: convertedColor } = getRatingLabel(
    comparison.convertedRating.score
  )
  
  const ratingDiff = comparison.convertedRating.score - comparison.originalRating.score

  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
  }

  const bgColorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkle className="w-5 h-5 text-primary" weight="fill" />
              </div>
              <div>
                <CardTitle className="text-base">AI Comparison Analysis</CardTitle>
                <CardDescription className="text-xs">
                  Comparing original with converted SVG
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-7 w-7 -mt-1 -mr-1"
              aria-label="Dismiss comparison"
            >
              <X className="w-4 h-4" weight="bold" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Similarity Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Similarity Rating</span>
              <div className="flex items-center gap-2">
                <span className={cn('text-2xl font-bold', colorClasses[similarityColor])}>
                  {comparison.similarityScore}%
                </span>
                <Badge variant="outline" className={cn('text-xs', colorClasses[similarityColor])}>
                  {similarityLabel}
                </Badge>
              </div>
            </div>
            <Progress
              value={comparison.similarityScore}
              className="h-2"
              style={{
                ['--progress-background' as string]: `var(--${similarityColor === 'green' ? 'success' : similarityColor === 'yellow' ? 'warning' : similarityColor === 'orange' ? 'warning' : 'destructive'})`,
              }}
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="w-3 h-3" weight="fill" />
              <span>Confidence: {comparison.confidence}%</span>
            </div>
          </div>

          <Separator />

          {/* AI Quality Ratings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" weight="fill" />
              AI Quality Ratings
              {ratingDiff !== 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'ml-auto text-[10px] gap-0.5',
                    ratingDiff > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  )}
                >
                  {ratingDiff > 0 ? <TrendUp className="w-3 h-3" weight="bold" /> : <TrendDown className="w-3 h-3" weight="bold" />}
                  {ratingDiff > 0 ? '+' : ''}{ratingDiff}
                </Badge>
              )}
            </h4>
            
            {/* Original Image Rating */}
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                  <span className="text-xs font-medium">Original</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-sm font-bold', colorClasses[originalColor])}>
                    {comparison.originalRating.score}
                  </span>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5', colorClasses[originalColor])}>
                    {originalLabel}
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {comparison.originalRating.reasoning}
              </p>
            </div>
            
            {/* Converted SVG Rating */}
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileSvg className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                  <span className="text-xs font-medium">Converted SVG</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-sm font-bold', colorClasses[convertedColor])}>
                    {comparison.convertedRating.score}
                  </span>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5', colorClasses[convertedColor])}>
                    {convertedLabel}
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {comparison.convertedRating.reasoning}
              </p>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-primary" weight="fill" />
              Summary
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {comparison.summary}
            </p>
          </div>

          {/* Differences */}
          {comparison.differences.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <WarningCircle className="w-4 h-4 text-amber-500" weight="fill" />
                  Key Differences ({comparison.differences.length})
                </h4>
                <ScrollArea className="h-[180px] pr-2">
                  <div className="space-y-2">
                    {comparison.differences.map((diff, index) => {
                      const Icon = categoryIcons[diff.category] || Question
                      const severityInfo = getSeverityInfo(diff.severity)
                      
                      return (
                        <motion.div
                          key={`${diff.category}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="p-1.5 bg-background rounded">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium capitalize">
                                {diff.category}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn('text-[10px] px-1.5 py-0', severityInfo.color)}
                              >
                                {severityInfo.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {diff.description}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          <Separator />

          {/* Action Button */}
          <Button
            onClick={onRefineWithAI}
            disabled={isRefining}
            className="w-full gap-2"
            size="lg"
          >
            {isRefining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                Refining...
              </>
            ) : (
              <>
                <Sparkle className="w-4 h-4" weight="fill" />
                Refine with AI Enhancer
                <ArrowRight className="w-4 h-4" weight="bold" />
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            One-click to automatically improve conversion quality
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
