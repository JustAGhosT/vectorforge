import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ClockCounterClockwise,
  Trash,
  TrendUp,
  TrendDown,
  Equals,
  X,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ComparisonHistoryEntry } from '@/hooks/use-comparison-history'

interface ComparisonHistoryPanelProps {
  history: ComparisonHistoryEntry[]
  onClear: () => void
  onRemove: (id: string) => void
  className?: string
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  
  return new Date(timestamp).toLocaleDateString()
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getScoreIcon(score: number) {
  if (score >= 80) return TrendUp
  if (score >= 60) return Equals
  return TrendDown
}

export function ComparisonHistoryPanel({
  history,
  onClear,
  onRemove,
  className,
}: ComparisonHistoryPanelProps) {
  if (history.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <ClockCounterClockwise className="w-5 h-5 text-muted-foreground" weight="bold" />
          <h3 className="font-semibold">Comparison History</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <ClockCounterClockwise className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No comparison history yet</p>
          <p className="text-xs mt-1">AI comparisons will appear here</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise className="w-5 h-5 text-muted-foreground" weight="bold" />
          <h3 className="font-semibold">Comparison History</h3>
          <Badge variant="secondary" className="text-xs">
            {history.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {history.map((entry) => {
            const ScoreIcon = getScoreIcon(entry.comparison.similarityScore)
            
            return (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ScoreIcon 
                        className={cn('w-4 h-4', getScoreColor(entry.comparison.similarityScore))} 
                        weight="bold" 
                      />
                      <span className={cn('font-semibold text-sm', getScoreColor(entry.comparison.similarityScore))}>
                        {entry.comparison.similarityScore}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.comparison.confidence}% confidence)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.filename}
                      {entry.iteration && ` • Iteration ${entry.iteration}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(entry.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                {entry.comparison.feedback && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {entry.comparison.feedback}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
