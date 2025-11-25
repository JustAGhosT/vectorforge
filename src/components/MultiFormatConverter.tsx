import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileImage, DownloadSimple, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { convertImageFormat, changeFileExtension, type OutputFormat } from '@/lib/format-converter'
import { formatFileSize } from '@/lib/converter'

interface ConversionResult {
  originalFile: File
  outputFormat: OutputFormat
  dataUrl: string
  size: number
  quality: number
}

export function MultiFormatConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webp')
  const [quality, setQuality] = useState(92)
  const [isConverting, setIsConverting] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file',
      })
      return
    }

    setSelectedFile(file)
    setResult(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    toast.success('File loaded', {
      description: file.name,
    })
  }, [])

  const handleConvert = useCallback(async () => {
    if (!selectedFile) return

    setIsConverting(true)
    
    try {
      const conversionResult = await convertImageFormat(
        selectedFile,
        outputFormat,
        { quality: quality / 100 }
      )

      const newResult: ConversionResult = {
        originalFile: selectedFile,
        outputFormat,
        dataUrl: conversionResult.dataUrl,
        size: conversionResult.size,
        quality,
      }

      setResult(newResult)
      
      const reduction = ((selectedFile.size - conversionResult.size) / selectedFile.size) * 100
      
      toast.success('Conversion complete!', {
        description: reduction > 0 
          ? `Reduced by ${Math.round(reduction)}%`
          : `Output: ${formatFileSize(conversionResult.size)}`,
      })
    } catch (error) {
      toast.error('Conversion failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsConverting(false)
    }
  }, [selectedFile, outputFormat, quality])

  const handleDownload = useCallback(() => {
    if (!result) return

    const a = document.createElement('a')
    a.href = result.dataUrl
    a.download = changeFileExtension(result.originalFile.name, result.outputFormat)
    a.click()

    toast.success('Downloaded!', {
      description: a.download,
    })
  }, [result])

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileImage className="w-5 h-5" weight="duotone" />
          Source Image
        </h3>
        
        <div className="space-y-4">
          <div>
            <input
              id="multi-format-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('multi-format-input')?.click()}
              variant="outline"
              className="w-full"
            >
              {selectedFile ? 'Change Image' : 'Select Image'}
            </Button>
          </div>

          {selectedFile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium truncate flex-1">
                  {selectedFile.name}
                </span>
                <Badge variant="secondary">{formatFileSize(selectedFile.size)}</Badge>
              </div>
              
              {previewUrl && (
                <div className="border rounded-lg overflow-hidden bg-muted/10">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {selectedFile && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkle className="w-5 h-5" weight="duotone" />
            Conversion Settings
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(value) => setOutputFormat(value as OutputFormat)}
              >
                <SelectTrigger id="output-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (Modern, best compression)</SelectItem>
                  <SelectItem value="jpg">JPG (Universal, photos)</SelectItem>
                  <SelectItem value="png">PNG (Lossless, transparency)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {outputFormat !== 'png' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quality-slider">Quality</Label>
                  <span className="text-sm font-medium">{quality}%</span>
                </div>
                <Slider
                  id="quality-slider"
                  value={[quality]}
                  onValueChange={([value]) => setQuality(value)}
                  min={60}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Higher quality = larger file size
                </p>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full"
            >
              {isConverting ? 'Converting...' : 'Convert Image'}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DownloadSimple className="w-5 h-5" weight="duotone" />
            Result
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Original</div>
                <div className="font-medium">{formatFileSize(result.originalFile.size)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Converted</div>
                <div className="font-medium">{formatFileSize(result.size)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Format</div>
                <div className="font-medium uppercase">{result.outputFormat}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Quality</div>
                <div className="font-medium">{result.quality}%</div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-muted/10">
              <img
                src={result.dataUrl}
                alt="Converted"
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>

            <Button onClick={handleDownload} className="w-full">
              <DownloadSimple className="mr-2" weight="bold" />
              Download {result.outputFormat.toUpperCase()}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
