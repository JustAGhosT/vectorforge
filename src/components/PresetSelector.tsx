import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Shapes,
  SquaresFour,
  PaintBrush,
  Image,
  FileArrowDown,
  CaretDown,
} from '@phosphor-icons/react'
import { BUILT_IN_PRESETS, matchesPreset, type ConversionPreset } from '@/lib/presets'
import type { ConversionSettings } from '@/lib/converter'

interface PresetSelectorProps {
  settings: ConversionSettings
  onApplyPreset: (preset: ConversionPreset) => void
  disabled?: boolean
}

const PRESET_ICONS = {
  logo: Shapes,
  icon: SquaresFour,
  illustration: PaintBrush,
  photo: Image,
  minimal: FileArrowDown,
}

export function PresetSelector({ settings, onApplyPreset, disabled }: PresetSelectorProps) {
  const currentPreset = matchesPreset(settings)

  const CurrentPresetIcon = currentPreset ? PRESET_ICONS[currentPreset.icon] : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between gap-2" 
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {currentPreset && CurrentPresetIcon ? (
              <>
                <CurrentPresetIcon className="w-4 h-4" weight="bold" />
                <span>{currentPreset.name}</span>
              </>
            ) : (
              <span>Quick Presets</span>
            )}
          </span>
          <CaretDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Apply preset for your image type
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BUILT_IN_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.icon]
          const isActive = currentPreset?.id === preset.id
          
          return (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className="flex items-start gap-3 py-3 cursor-pointer"
            >
              <div className={`p-1.5 rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Icon className="w-4 h-4" weight="bold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{preset.name}</span>
                  {isActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {preset.description}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
