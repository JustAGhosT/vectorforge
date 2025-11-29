import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  UploadSimple,
  ArrowsClockwise,
  Sparkle,
  Gear,
  DownloadSimple,
  WarningCircle,
  CheckCircle,
  Clock,
  Trash,
  ChatCircle,
  Robot,
  Info,
  MagicWand,
} from '@phosphor-icons/react'
import type { ActivityLogEntry, ActivityType } from '@/hooks/use-activity-log'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ActivityLogPanelProps {
  entries: ActivityLogEntry[]
  onClear?: () => void
  className?: string
}

const activityIcons: Record<ActivityType, typeof Activity> = {
  upload: UploadSimple,
  conversion: ArrowsClockwise,
  'ai-analysis': Sparkle,
  'ai-suggestion': Robot,
  'ai-iteration': ArrowsClockwise,
  'ai-chat': ChatCircle,
  remix: MagicWand,
  settings: Gear,
  download: DownloadSimple,
  error: WarningCircle,
  system: Info,
}

const activityColors: Record<ActivityType, string> = {
  upload: 'text-blue-500',
  conversion: 'text-cyan',
  'ai-analysis': 'text-purple-500',
  'ai-suggestion': 'text-violet-500',
  'ai-iteration': 'text-indigo-500',
  'ai-chat': 'text-green-500',
  remix: 'text-pink-500',
  settings: 'text-orange',
  download: 'text-emerald-500',
  error: 'text-destructive',
  system: 'text-muted-foreground',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 5) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function ActivityLogPanel({ entries, onClear, className }: ActivityLogPanelProps) {
  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Activity className="w-4 h-4 text-primary" weight="bold" />
            </div>
            <div>
              <CardTitle className="text-base">Activity Log</CardTitle>
              <CardDescription className="text-xs">
                Track what's happening
              </CardDescription>
            </div>
          </div>
          {entries.length > 0 && onClear && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-7 w-7"
              title="Clear activity log"
            >
              <Trash className="w-3.5 h-3.5" weight="bold" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/50 mb-2" weight="light" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start by uploading an image
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              <AnimatePresence initial={false}>
                {entries.map((entry, index) => {
                  const Icon = activityIcons[entry.type]
                  const iconColor = activityColors[entry.type]
                  
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index === 0 ? 0 : 0 }}
                      className="group relative"
                    >
                      <div className="flex gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={cn('mt-0.5', iconColor)}>
                          <Icon className="w-4 h-4" weight="fill" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">
                              {entry.title}
                            </p>
                            {entry.status && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'h-5 text-[10px] px-1.5',
                                  statusColors[entry.status]
                                )}
                              >
                                {entry.status === 'pending' && (
                                  <Clock className="w-2.5 h-2.5 mr-1 animate-pulse" />
                                )}
                                {entry.status === 'success' && (
                                  <CheckCircle className="w-2.5 h-2.5 mr-1" weight="fill" />
                                )}
                                {entry.status === 'error' && (
                                  <WarningCircle className="w-2.5 h-2.5 mr-1" weight="fill" />
                                )}
                                {entry.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {entry.description}
                          </p>
                          {entry.status === 'error' && entry.details && (
                            <div className="mt-1.5 p-2 bg-destructive/5 border border-destructive/20 rounded text-[10px] font-mono text-destructive/80 overflow-x-auto max-h-32 overflow-y-auto">
                              <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(entry.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {formatRelativeTime(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                      {index < entries.length - 1 && (
                        <div className="absolute left-[19px] top-full h-2 w-[1px] bg-border" />
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export function ActivityLogCollapsed({ 
  entries, 
  onClick 
}: { 
  entries: ActivityLogEntry[]
  onClick?: () => void 
}) {
  const latestEntry = entries[0]
  const pendingCount = entries.filter(e => e.status === 'pending').length
  const errorCount = entries.filter(e => e.status === 'error').length

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2 h-8"
    >
      <Activity className="w-4 h-4" weight="bold" />
      <span className="hidden sm:inline">Activity</span>
      {(pendingCount > 0 || errorCount > 0) && (
        <div className="flex gap-1">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-500/20 text-yellow-600">
              {pendingCount}
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive" className="h-4 px-1 text-[10px]">
              {errorCount}
            </Badge>
          )}
        </div>
      )}
    </Button>
  )
}
