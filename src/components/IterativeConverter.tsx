import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowClockwise,
  CheckCircle,
  Sparkle,
  X,
  Trophy,
  TrendUp,
  Info,
} from '@phosphor-icons/react'
import type { IterationResult } from '@/hooks/use-iterative-conversion'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface IterativeConverterProps {
  maxIterations: number
  targetLikeness: number
  onMaxIterationsChange: (value: number) => void
  onTargetLikenessChange: (value: number) => void
  isProcessing: boolean
  currentIteration: number
  progress: number
  iterations: IterationResult[]
  bestIteration: IterationResult | null
  onStart: () => void
  onCancel: () => void
  canStart: boolean
}

export function IterativeConverter({
  maxIterations,
  targetLikeness,
  onMaxIterationsChange,
  onTargetLikenessChange,
  isProcessing,
  currentIteration,
  progress,
  iterations,
  bestIteration,
  onStart,
  onCancel,
  canStart,
}: IterativeConverterProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkle className="w-5 h-5 text-primary" weight="fill" />
            </div>
            <div>
              <CardTitle>AI-Powered Iterative Conversion</CardTitle>
              <CardDescription>
                Automatically improve conversions through AI evaluation
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-iterations" className="text-sm font-medium">
                Max Iterations
              </Label>
              <Badge variant="secondary">{maxIterations}</Badge>
            </div>
            <Slider
              id="max-iterations"
              min={1}
              max={10}
              step={1}
              value={[maxIterations]}
              onValueChange={([value]) => onMaxIterationsChange(value)}
              disabled={isProcessing}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How many conversion attempts to make before stopping
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="target-likeness" className="text-sm font-medium">
                Target Likeness
              </Label>
              <Badge variant="secondary">{targetLikeness}%</Badge>
            </div>
            <Slider
              id="target-likeness"
              min={60}
              max={95}
              step={5}
              value={[targetLikeness]}
              onValueChange={([value]) => onTargetLikenessChange(value)}
              disabled={isProcessing}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Stop when conversion reaches this quality threshold
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Info className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            AI will evaluate each conversion and adjust settings automatically to improve quality
          </p>
        </div>

        <div className="flex gap-2">
          {!isProcessing ? (
            <Button
              onClick={onStart}
              disabled={!canStart}
              className="flex-1 gap-2"
            >
              <Sparkle className="w-4 h-4" weight="bold" />
              Start Iterative Conversion
            </Button>
          ) : (
            <Button
              onClick={onCancel}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" weight="bold" />
              Cancel
            </Button>
          )}
        </div>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Iteration {currentIteration} of {maxIterations}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {iterations.length > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                Current best: {iterations[iterations.length - 1]?.likenessScore || 0}% likeness
              </div>
            )}
          </motion.div>
        )}

        {bestIteration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-accent/10 border border-accent/20 rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" weight="fill" />
              <h4 className="font-semibold text-sm">Best Result</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Iteration {bestIteration.iteration}
              </span>
              <Badge className="gap-1">
                <TrendUp className="w-3 h-3" weight="bold" />
                {bestIteration.likenessScore}% likeness
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {bestIteration.analysis}
            </p>
            <Separator className="my-2" />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Complexity</span>
                <p className="font-medium">
                  {Math.round(bestIteration.settingsUsed.complexity * 100)}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Colors</span>
                <p className="font-medium">
                  {Math.round((1 - bestIteration.settingsUsed.colorSimplification) * 100)}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Smoothing</span>
                <p className="font-medium">
                  {Math.round(bestIteration.settingsUsed.pathSmoothing * 100)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {iterations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowClockwise className="w-4 h-4" weight="bold" />
              <h4 className="font-semibold text-sm">Iteration History</h4>
            </div>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {iterations.map((iteration, index) => (
                  <motion.div
                    key={iteration.job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      iteration === bestIteration
                        ? 'bg-accent/5 border-accent/30'
                        : 'bg-card border-border'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{iteration.iteration}</span>
                        {iteration === bestIteration && (
                          <Trophy className="w-4 h-4 text-accent" weight="fill" />
                        )}
                      </div>
                      <Badge
                        variant={iteration.likenessScore >= targetLikeness ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {iteration.likenessScore >= targetLikeness && (
                          <CheckCircle className="w-3 h-3" weight="fill" />
                        )}
                        {iteration.likenessScore}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {iteration.analysis}
                    </p>
                    <div className="flex gap-3 text-xs">
                      <span>
                        C: {Math.round(iteration.settingsUsed.complexity * 100)}%
                      </span>
                      <span>
                        Col: {Math.round((1 - iteration.settingsUsed.colorSimplification) * 100)}%
                      </span>
                      <span>
                        S: {Math.round(iteration.settingsUsed.pathSmoothing * 100)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
