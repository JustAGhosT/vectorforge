import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  X, 
  Sparkle,
  ImageSquare,
  FileImage,
  FileSvg,
} from '@phosphor-icons/react'

interface FormatFeature {
  name: string
  supported: boolean
}

interface FormatInfo {
  name: string
  icon: React.ReactNode
  description: string
  bestFor: string[]
  notIdealFor: string[]
  features: FormatFeature[]
  technicalDetails: {
    compression: string
    quality: string
    fileSize: string
    scalability: string
    browser: string
  }
}

const formats: Record<string, FormatInfo> = {
  svg: {
    name: 'SVG',
    icon: <FileSvg className="w-8 h-8" weight="duotone" />,
    description: 'Scalable Vector Graphics - XML-based vector image format that scales infinitely without quality loss',
    bestFor: [
      'Logos and icons',
      'Illustrations and graphics',
      'Responsive web design',
      'Print materials at any size',
      'Animations and interactive graphics',
    ],
    notIdealFor: [
      'Complex photographs',
      'Detailed textures',
      'Large color gradients',
    ],
    features: [
      { name: 'Infinite scalability', supported: true },
      { name: 'Small file size', supported: true },
      { name: 'Editable in code', supported: true },
      { name: 'CSS/JS animation', supported: true },
      { name: 'Photo quality', supported: false },
    ],
    technicalDetails: {
      compression: 'XML text (optionally gzipped)',
      quality: 'Lossless vector',
      fileSize: 'Very small for simple graphics',
      scalability: 'Infinite - resolution independent',
      browser: 'All modern browsers',
    },
  },
  png: {
    name: 'PNG',
    icon: <ImageSquare className="w-8 h-8" weight="duotone" />,
    description: 'Portable Network Graphics - Lossless raster format with transparency support',
    bestFor: [
      'Images with transparency',
      'Screenshots and UI elements',
      'Graphics with text',
      'Simple illustrations',
      'Images requiring precise colors',
    ],
    notIdealFor: [
      'Large photographs',
      'Images without transparency',
      'High-resolution print',
    ],
    features: [
      { name: 'Transparency support', supported: true },
      { name: 'Lossless compression', supported: true },
      { name: 'Wide compatibility', supported: true },
      { name: 'Small file size', supported: false },
      { name: 'Infinite scalability', supported: false },
    ],
    technicalDetails: {
      compression: 'Lossless (DEFLATE)',
      quality: 'Pixel-perfect preservation',
      fileSize: 'Medium to large',
      scalability: 'Fixed resolution',
      browser: 'Universal support',
    },
  },
  jpg: {
    name: 'JPG/JPEG',
    icon: <FileImage className="w-8 h-8" weight="duotone" />,
    description: 'Joint Photographic Experts Group - Lossy compression optimized for photographs',
    bestFor: [
      'Photographs',
      'Complex images with many colors',
      'Web images where file size matters',
      'Social media posts',
      'Background images',
    ],
    notIdealFor: [
      'Images with transparency',
      'Text and line art',
      'Images requiring editing',
      'Screenshots',
    ],
    features: [
      { name: 'Small file size', supported: true },
      { name: 'Good for photos', supported: true },
      { name: 'Wide compatibility', supported: true },
      { name: 'Transparency support', supported: false },
      { name: 'Lossless quality', supported: false },
    ],
    technicalDetails: {
      compression: 'Lossy (DCT-based)',
      quality: 'Adjustable (typically 60-95%)',
      fileSize: 'Small - excellent compression',
      scalability: 'Fixed resolution',
      browser: 'Universal support',
    },
  },
  webp: {
    name: 'WebP',
    icon: <Sparkle className="w-8 h-8" weight="duotone" />,
    description: 'Modern image format developed by Google offering superior compression with quality',
    bestFor: [
      'Modern web applications',
      'High-performance websites',
      'Mobile applications',
      'Progressive web apps',
      'Responsive images',
    ],
    notIdealFor: [
      'Legacy browser support',
      'Print materials',
      'Professional photography archives',
    ],
    features: [
      { name: 'Superior compression', supported: true },
      { name: 'Transparency support', supported: true },
      { name: 'Lossy & lossless modes', supported: true },
      { name: 'Animation support', supported: true },
      { name: 'Universal support', supported: false },
    ],
    technicalDetails: {
      compression: 'Lossy or lossless',
      quality: 'Better than JPG at same size',
      fileSize: '25-35% smaller than JPG',
      scalability: 'Fixed resolution',
      browser: '96%+ modern browsers',
    },
  },
}

const comparisonData = [
  { feature: 'File Size', svg: 'Smallest', png: 'Large', jpg: 'Small', webp: 'Smallest' },
  { feature: 'Quality Loss', svg: 'None', png: 'None', jpg: 'Some', webp: 'Minimal' },
  { feature: 'Transparency', svg: 'Yes', png: 'Yes', jpg: 'No', webp: 'Yes' },
  { feature: 'Scalability', svg: 'Infinite', png: 'Fixed', jpg: 'Fixed', webp: 'Fixed' },
  { feature: 'Animation', svg: 'Yes', png: 'APNG', jpg: 'No', webp: 'Yes' },
  { feature: 'Browser Support', svg: '100%', png: '100%', jpg: '100%', webp: '96%' },
  { feature: 'Best Use', svg: 'Icons/Logos', png: 'Graphics', jpg: 'Photos', webp: 'Web' },
]

export function FormatGuide() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Image Format Guide
        </h1>
        <p className="text-lg text-muted-foreground">
          Understanding the differences between SVG, PNG, JPG, and WebP formats to choose the right one for your needs
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Feature</th>
                <th className="text-left py-3 px-2 font-semibold">SVG</th>
                <th className="text-left py-3 px-2 font-semibold">PNG</th>
                <th className="text-left py-3 px-2 font-semibold">JPG</th>
                <th className="text-left py-3 px-2 font-semibold">WebP</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-3 px-2 font-medium text-muted-foreground">{row.feature}</td>
                  <td className="py-3 px-2">{row.svg}</td>
                  <td className="py-3 px-2">{row.png}</td>
                  <td className="py-3 px-2">{row.jpg}</td>
                  <td className="py-3 px-2">{row.webp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Tabs defaultValue="svg" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="svg">SVG</TabsTrigger>
          <TabsTrigger value="png">PNG</TabsTrigger>
          <TabsTrigger value="jpg">JPG</TabsTrigger>
          <TabsTrigger value="webp">WebP</TabsTrigger>
        </TabsList>

        {Object.entries(formats).map(([key, format]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  {format.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">{format.name}</h3>
                    <Badge variant="outline">{format.technicalDetails.compression}</Badge>
                  </div>
                  <p className="text-muted-foreground">{format.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5 text-cyan" weight="bold" />
                    Best For
                  </h4>
                  <ul className="space-y-2">
                    {format.bestFor.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" weight="bold" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <X className="w-5 h-5 text-destructive" weight="bold" />
                    Not Ideal For
                  </h4>
                  <ul className="space-y-2">
                    {format.notIdealFor.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" weight="bold" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Key Features</h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {format.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/30"
                  >
                    {feature.supported ? (
                      <Check className="w-5 h-5 text-cyan flex-shrink-0" weight="bold" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground flex-shrink-0" weight="bold" />
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Technical Details</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Compression</div>
                  <div className="font-medium">{format.technicalDetails.compression}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Quality</div>
                  <div className="font-medium">{format.technicalDetails.quality}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">File Size</div>
                  <div className="font-medium">{format.technicalDetails.fileSize}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Scalability</div>
                  <div className="font-medium">{format.technicalDetails.scalability}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Browser Support</div>
                  <div className="font-medium">{format.technicalDetails.browser}</div>
                </div>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
