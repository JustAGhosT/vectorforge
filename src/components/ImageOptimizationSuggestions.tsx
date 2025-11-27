import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Lightbulb,
  ArrowRight,
  Image as ImageIcon,
  FileArrowDown,
  Palette,
  Sparkle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ImageOptimizationSuggestionsProps {
  imageWidth?: number
  imageHeight?: number
  fileSize?: number
  hasTransparency?: boolean
  colorCount?: number
  className?: string
}

interface Suggestion {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; weight?: 'bold' | 'regular' | 'fill' }>
  priority: 'high' | 'medium' | 'low'
}

function generateSuggestions({
  imageWidth,
  imageHeight,
  fileSize,
  hasTransparency,
  colorCount,
}: ImageOptimizationSuggestionsProps): Suggestion[] {
  const suggestions: Suggestion[] = []

  // Large image suggestion
  if (imageWidth && imageHeight && imageWidth * imageHeight > 4000000) {
    suggestions.push({
      title: 'Large Image Detected',
      description: 'Consider resizing to improve conversion speed and reduce SVG complexity.',
      icon: ImageIcon,
      priority: 'high',
    })
  }

  // High file size suggestion
  if (fileSize && fileSize > 5 * 1024 * 1024) {
    suggestions.push({
      title: 'Large File Size',
      description: 'The image is over 5MB. Use higher color simplification for smaller output.',
      icon: FileArrowDown,
      priority: 'high',
    })
  }

  // Many colors suggestion
  if (colorCount && colorCount > 256) {
    suggestions.push({
      title: 'Complex Color Palette',
      description: 'Many colors detected. Consider using the "Minimal" preset for simpler results.',
      icon: Palette,
      priority: 'medium',
    })
  }

  // Transparency suggestion
  if (hasTransparency) {
    suggestions.push({
      title: 'Transparency Detected',
      description: 'Enable checkerboard background to better visualize transparent areas.',
      icon: Sparkle,
      priority: 'low',
    })
  }

  // Default suggestion if no issues
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Image Ready',
      description: 'Your image looks good for conversion. Try the default settings first.',
      icon: Lightbulb,
      priority: 'low',
    })
  }

  return suggestions
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function ImageOptimizationSuggestions(props: ImageOptimizationSuggestionsProps) {
  const { className, ...analysisProps } = props
  const suggestions = generateSuggestions(analysisProps)

  if (suggestions.length === 0) return null

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-yellow-500" weight="fill" />
        <h3 className="font-semibold text-sm">Optimization Tips</h3>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
            >
              <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" weight="bold" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{suggestion.title}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-[10px] px-1.5 py-0', priorityColors[suggestion.priority])}
                  >
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {suggestion.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Stub hook to analyze image and return optimization data
// TODO: Implement actual image analysis using canvas or a library
export function useImageAnalysis(imageDataUrl: string | null) {
  // This is placeholder data - actual implementation would analyze the image
  // For now, return null to indicate no analysis available
  if (!imageDataUrl) {
    return null
  }
  
  // Return placeholder data for demonstration purposes
  // In production, this would extract actual image metadata
  return {
    imageWidth: undefined as number | undefined,
    imageHeight: undefined as number | undefined,
    fileSize: undefined as number | undefined,
    hasTransparency: undefined as boolean | undefined,
    colorCount: undefined as number | undefined,
  }
}
