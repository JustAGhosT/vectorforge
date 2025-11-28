# ✨ VectorForge

> **Smart Image Converter** — Transform images into professional-quality, infinitely scalable SVG graphics with AI-powered optimization.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-VectorForge-7c3aed?style=for-the-badge)](https://vectorforge.netlify.app)
[![Netlify Status](https://api.netlify.com/api/v1/badges/vectorforge/deploy-status)](https://app.netlify.com/sites/vectorforge/deploys)

## 🚀 Try It Now

**[Launch VectorForge →](https://vectorforge.netlify.app)**

---

## 📖 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [How It Works](#-how-it-works)
- [Conversion Settings](#-conversion-settings)
- [AI Optimization](#-ai-optimization)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Documentation](#-documentation)
- [License](#-license)

---

## ✨ Features

### Core Conversion
- **PNG to SVG Conversion** — Transform raster images into scalable vector graphics
- **Multi-Format Support** — Convert between PNG, JPG, and WebP formats
- **Batch Processing** — Convert up to 50 images simultaneously with progress tracking
- **Real-Time Preview** — Side-by-side comparison with draggable divider

### AI-Powered Optimization
- **Smart Analysis** — AI detects image type (logo, icon, photo, illustration)
- **Auto Settings** — Intelligent recommendations for optimal conversion
- **Iterative Refinement** — AI-driven multi-pass conversion for best results
- **Quality Prediction** — Estimates output quality before conversion

### User Experience
- **Drag & Drop** — Simple file upload with visual feedback
- **Keyboard Shortcuts** — Power user controls for efficiency
- **Mobile Responsive** — Full functionality on all devices with touch gestures
- **Conversion History** — Access and re-download previous conversions
- **Format Education** — Built-in guide explaining when to use each format

### Technical Excellence
- **Client-Side Processing** — Your files never leave your device
- **Modular Pipeline** — Research-based algorithms for superior quality
- **Error Recovery** — Graceful handling with helpful suggestions
- **Offline Support** — Connection monitoring with status indicators

---

## 🚀 Getting Started

### Quick Start (No Installation)

1. **[Open VectorForge](https://vectorforge.netlify.app)** in your browser
2. **Drop an image** or click to upload (PNG, JPG, WebP)
3. **Adjust settings** using the sliders or click "AI Optimize"
4. **Download** your converted SVG

### Local Development

```bash
# Clone the repository
git clone https://github.com/JustAGhosT/vectorforge.git
cd vectorforge

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔄 How It Works

VectorForge uses a sophisticated **5-stage pipeline** for image conversion:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Color Quantization  →  Median-cut algorithm for        │
│                            perceptual color grouping        │
├─────────────────────────────────────────────────────────────┤
│  2. Layer Extraction    →  Separate image into color       │
│                            layers for independent tracing   │
├─────────────────────────────────────────────────────────────┤
│  3. Contour Tracing     →  8-direction edge detection      │
│                            with Douglas-Peucker smoothing   │
├─────────────────────────────────────────────────────────────┤
│  4. Path Smoothing      →  Adaptive Bézier curves          │
│                            (linear, quadratic, cubic)       │
├─────────────────────────────────────────────────────────────┤
│  5. SVG Generation      →  Optimized path output with      │
│                            minimal file size                │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Conversion Settings

| Setting | Range | Description | Best For |
|---------|-------|-------------|----------|
| **Complexity** | 0-100% | Controls detail preservation | 30-50% for icons, 70-90% for photos |
| **Color Simplification** | 0-100% | Reduces color palette | 60-80% for logos, 20-40% for art |
| **Path Smoothing** | 0-100% | Smooths edges and curves | 50-70% for geometric, 30-50% for organic |

### Presets

| Image Type | Complexity | Colors | Smoothing |
|------------|------------|--------|-----------|
| **Icon** | 40% | 70% | 60% |
| **Logo** | 60% | 50% | 60% |
| **Illustration** | 70% | 30% | 50% |
| **Photo** | 85% | 15% | 40% |

---

## 🤖 AI Optimization

VectorForge includes AI-powered analysis to automatically optimize your conversion:

1. **Upload an image** to the converter
2. **Click "AI Optimize"** in the settings panel
3. **Review suggestions** including:
   - Image type classification
   - Recommended settings
   - Quality prediction
   - Potential warnings
4. **Apply or adjust** the suggestions

> 📝 **Note**: AI features require Azure AI or OpenAI configuration. See [Environment Setup](./docs/ENVIRONMENT_SETUP.md) for configuration.

---

## ⌨️ Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Upload file | `⌘ + O` | `Ctrl + O` |
| Download SVG | `⌘ + S` | `Ctrl + S` |
| Zoom in | `⌘ + =` | `Ctrl + =` |
| Zoom out | `⌘ + -` | `Ctrl + -` |
| Reset zoom | `⌘ + 0` | `Ctrl + 0` |
| Undo settings | `⌘ + Z` | `Ctrl + Z` |
| Redo settings | `⌘ + ⇧ + Z` | `Ctrl + Shift + Z` |
| Show shortcuts | `⌘ + ?` | `Ctrl + ?` |

---

## 📁 Project Structure

```
vectorforge/
├── src/
│   ├── App.tsx              # Main application component
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── UploadZone.tsx   # File upload interface
│   │   ├── ConversionPreview.tsx  # Preview comparison
│   │   ├── SettingsPanel.tsx      # Conversion controls
│   │   ├── BatchConversion.tsx    # Batch processing
│   │   ├── IterativeConverter.tsx # AI iterative mode
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── use-conversion.ts      # Conversion logic
│   │   ├── use-ai-optimizer.ts    # AI integration
│   │   └── ...
│   └── lib/                 # Core utilities
│       ├── converter.ts     # Main converter
│       ├── pipeline/        # Modular conversion stages
│       └── ai-optimizer.ts  # AI analysis
├── docs/                    # Documentation files
│   ├── PRD.md               # Product requirements
│   ├── CONVERSION_ANALYSIS.md   # Algorithm documentation
│   ├── PIPELINE_QUICKSTART.md   # Pipeline usage guide
│   └── ENVIRONMENT_SETUP.md     # Configuration guide
```

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

### Technology Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Icons**: Phosphor Icons
- **Build**: Vite
- **Hosting**: Netlify
- **AI**: Azure AI / OpenAI GPT-4o

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](./docs/PRD.md) | Product requirements and design specs |
| [CONVERSION_ANALYSIS.md](./docs/CONVERSION_ANALYSIS.md) | Deep dive into algorithms |
| [PIPELINE_QUICKSTART.md](./docs/PIPELINE_QUICKSTART.md) | Custom pipeline guide |
| [ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) | AI configuration |
| [ERROR_HANDLING.md](./docs/ERROR_HANDLING.md) | Error handling details |
| [SECURITY.md](./SECURITY.md) | Security policy |

---

## 🔒 Privacy

**Your files stay private.** All image processing happens locally in your browser. No images are ever uploaded to external servers.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.
