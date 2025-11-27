import { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Shapes,
  SquaresFour,
  PaintBrush,
  Image,
  FileArrowDown,
  CaretDown,
  Plus,
  Star,
  Trash,
} from '@phosphor-icons/react'
import { BUILT_IN_PRESETS, matchesPreset, loadCustomPresets, saveCustomPreset, deleteCustomPreset, type ConversionPreset } from '@/lib/presets'
import type { ConversionSettings } from '@/lib/converter'
import { toast } from 'sonner'

interface PresetSelectorProps {
  settings: ConversionSettings
  onApplyPreset: (preset: ConversionPreset) => void
  disabled?: boolean
}

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string; weight?: 'bold' | 'regular' | 'fill' }>> = {
  logo: Shapes,
  icon: SquaresFour,
  illustration: PaintBrush,
  photo: Image,
  minimal: FileArrowDown,
  custom: Star,
}

export function PresetSelector({ settings, onApplyPreset, disabled }: PresetSelectorProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [customPresets, setCustomPresets] = useState(loadCustomPresets)
  
  const currentPreset = matchesPreset(settings)
  const CurrentPresetIcon = currentPreset ? PRESET_ICONS[currentPreset.icon] : null

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }
    
    const newPreset = saveCustomPreset(presetName.trim(), settings)
    setCustomPresets(loadCustomPresets())
    setPresetName('')
    setShowSaveDialog(false)
    toast.success(`Preset "${newPreset.name}" saved`)
  }

  const handleDeletePreset = (preset: ConversionPreset) => {
    deleteCustomPreset(preset.id)
    setCustomPresets(loadCustomPresets())
    toast.success(`Preset "${preset.name}" deleted`)
  }

  return (
    <>
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
          
          {customPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Custom Presets
              </DropdownMenuLabel>
              {customPresets.map((preset) => {
                const isActive = currentPreset?.id === preset.id
                
                return (
                  <DropdownMenuItem
                    key={preset.id}
                    className="flex items-start gap-3 py-3 cursor-pointer group"
                  >
                    <div 
                      className="flex-1 flex items-start gap-3"
                      onClick={() => onApplyPreset(preset)}
                    >
                      <div className={`p-1.5 rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Star className="w-4 h-4" weight="bold" />
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
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePreset(preset)
                      }}
                    >
                      <Trash className="w-3 h-3 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 py-2 cursor-pointer text-primary"
          >
            <Plus className="w-4 h-4" weight="bold" />
            <span className="font-medium text-sm">Save Current as Preset</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Preset</DialogTitle>
            <DialogDescription>
              Save your current settings as a reusable preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Custom Preset"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Current settings:</p>
              <ul className="list-disc list-inside">
                <li>Complexity: {Math.round(settings.complexity * 100)}%</li>
                <li>Color Simplification: {Math.round(settings.colorSimplification * 100)}%</li>
                <li>Path Smoothing: {Math.round(settings.pathSmoothing * 100)}%</li>
                <li>Potrace: {settings.usePotrace ? 'Enabled' : 'Disabled'}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
