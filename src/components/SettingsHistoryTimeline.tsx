import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClockCounterClockwise, Check, ArrowRight } from '@phosphor-icons/react'
import { ConversionSettings } from '@/lib/converter'
import { cn } from '@/lib/utils'

interface SettingsHistoryEntry {
  settings: ConversionSettings
  timestamp: number
}

interface SettingsHistoryTimelineProps {
  history: SettingsHistoryEntry[]
  currentIndex: number
  onRestore: (index: number) => void
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function getSettingsDiff(prev: ConversionSettings | null, current: ConversionSettings): string[] {
  if (!prev) return ['Initial settings']
  
  const changes: string[] = []
  
  if (prev.complexity !== current.complexity) {
    changes.push(`Complexity: ${formatPercent(prev.complexity)} → ${formatPercent(current.complexity)}`)
  }
  if (prev.colorSimplification !== current.colorSimplification) {
    changes.push(`Colors: ${formatPercent(prev.colorSimplification)} → ${formatPercent(current.colorSimplification)}`)
  }
  if (prev.pathSmoothing !== current.pathSmoothing) {
    changes.push(`Smoothing: ${formatPercent(prev.pathSmoothing)} → ${formatPercent(current.pathSmoothing)}`)
  }
  if (prev.usePotrace !== current.usePotrace) {
    changes.push(`Potrace: ${prev.usePotrace ? 'On' : 'Off'} → ${current.usePotrace ? 'On' : 'Off'}`)
  }
  
  return changes.length > 0 ? changes : ['No changes']
}

export function SettingsHistoryTimeline({
  history,
  currentIndex,
  onRestore,
}: SettingsHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ClockCounterClockwise className="w-4 h-4" />
          <span className="text-sm">No settings history yet</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <ClockCounterClockwise className="w-5 h-5 text-primary" weight="bold" />
        <h3 className="font-semibold text-sm">Settings History</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {history.length} change{history.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-4">
          {history.map((entry, index) => {
            const isActive = index === currentIndex
            const prevEntry = index > 0 ? history[index - 1] : null
            const changes = getSettingsDiff(prevEntry?.settings ?? null, entry.settings)
            
            return (
              <button
                key={`${entry.timestamp}-${index}`}
                onClick={() => onRestore(index)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isActive
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                )}
                aria-label={`Restore settings from ${formatTime(entry.timestamp)}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Check className="w-3 h-3" weight="bold" />
                          Current
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {changes.map((change, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs text-foreground">
                          <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
