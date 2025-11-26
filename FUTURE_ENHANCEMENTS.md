# VectorForge Future Enhancements Roadmap

This document outlines planned improvements and features for VectorForge, organized by priority and complexity.

## ✅ Completed in This Release

### High Priority
- [x] **Code Splitting** - Implemented lazy loading with React.lazy() and Suspense
  - Reduced initial bundle from 662KB to ~327KB main bundle
  - Heavy components loaded on-demand (FormatGuide, BatchConversion, etc.)
  
- [x] **Dark Mode** - Full theme support with system preference detection
  - ThemeToggle component in header
  - Persistent theme preference via localStorage
  - Automatic system theme detection

- [x] **Potrace Integration** - Professional bitmap tracing algorithm
  - Added `esm-potrace-wasm` for WASM-accelerated tracing
  - Multi-color layer support with median-cut quantization
  - Better curve fitting than basic contour tracing
  - Located in `src/lib/potrace-converter.ts`

- [x] **WASM Acceleration** - Via Potrace WASM module
  - WebAssembly-compiled Potrace for 5-10x speedup on tracing
  - Falls back gracefully if WASM not supported

- [x] **Custom Presets** - Quick settings for different image types
  - 5 built-in presets: Logo, Icon, Illustration, Photo, Minimal
  - Dropdown selector in Settings panel
  - Auto-reconvert when preset applied with active image
  - Located in `src/lib/presets.ts` and `src/components/PresetSelector.tsx`

- [x] **Progressive Loading** - Improved perceived performance
  - Skeleton components for loading states (`src/components/Skeleton.tsx`)
  - ProgressiveImage component with lazy loading (`src/components/ProgressiveImage.tsx`)
  - Intersection Observer for on-demand image loading
  - Blur-up effect and error handling

- [x] **Undo History Visualization** - Visual timeline of settings changes
  - SettingsHistoryTimeline component (`src/components/SettingsHistoryTimeline.tsx`)
  - Shows all settings changes with timestamps
  - Click to restore any previous state
  - Displays what changed between each state

- [x] **Accessibility Improvements** - WCAG 2.1 AA compliance enhancements
  - Skip to main content link for keyboard users
  - ARIA labels and roles throughout
  - Live regions for screen reader announcements
  - Accessibility utilities (`src/lib/accessibility.ts`)
  - Focus trap hook for modals
  - Reduced motion support

---

## 🔮 Future Enhancements

### ~~Progressive Loading~~ ✅ COMPLETED

Implemented with skeleton loaders, ProgressiveImage component, and intersection observer.
See `src/components/ProgressiveImage.tsx` and `src/components/Skeleton.tsx`.

---

### ~~Custom Presets~~ ✅ COMPLETED

Built-in presets implemented with 5 image type presets (Logo, Icon, Illustration, Photo, Minimal).
See `src/lib/presets.ts` and `src/components/PresetSelector.tsx`.

**Future extensions**:
- User-defined custom presets saved to localStorage
- Import/export presets as JSON
- Preset sharing via URL parameters

---

### Export Options (Nice to Have)

**Goal**: Add additional export formats beyond SVG.

**Planned Formats**:
1. **PDF Export** - Using jsPDF or similar library
2. **EPS Export** - For professional print workflows
3. **DXF Export** - For CAD/CNC applications
4. **Optimized SVG** - SVGO integration for smaller files

**Implementation Plan**:
1. Add export format selector in download area
2. Create format conversion utilities
3. Add format-specific options (PDF page size, DXF units, etc.)

**Dependencies to add**:
- `jspdf` for PDF export
- `svgo` for SVG optimization (if not bundled)

**Files to create**:
- `src/lib/exporters/pdf-exporter.ts`
- `src/lib/exporters/eps-exporter.ts`
- `src/lib/exporters/dxf-exporter.ts`
- `src/lib/exporters/svg-optimizer.ts`
- `src/components/ExportOptions.tsx`

**Estimated effort**: 3-5 days

---

### ~~Undo History Visualization~~ ✅ COMPLETED

Visual timeline implemented showing all settings changes.
See `src/components/SettingsHistoryTimeline.tsx`.

**Features implemented**:
- Timeline of all settings changes with timestamps
- Shows what changed between each state
- Click any item to restore that state
- Current state highlighted

**Future extensions**:
- Thumbnail previews at each state
- Branching support for complex workflows

---

### ~~Accessibility Audit~~ ✅ COMPLETED

Accessibility improvements implemented across the application.

**Completed items**:
- [x] Skip to main content link for keyboard users
- [x] ARIA labels and roles throughout the app
- [x] Live regions for screen reader announcements
- [x] Focus management utilities
- [x] Reduced motion support hook
- [x] Keyboard navigation helpers

See `src/lib/accessibility.ts` and `src/components/AccessibilityComponents.tsx`.

**Future extensions**:
- [ ] Automated axe-core testing in CI
- [ ] Full WCAG 2.1 AA audit
- [ ] Color contrast verification

**Files to audit**:
- All components in `src/components/`
- Focus management in modals/dialogs
- Form controls and sliders

**Estimated effort**: 2-4 days

---

### Web Workers for All Conversions (Enhancement)

**Goal**: Move all heavy processing to background threads.

**Current State**:
- Potrace uses WASM (inherently off-main-thread for heavy work)
- Basic converter runs on main thread

**Implementation Plan**:
1. Create unified worker for all conversion types
2. Transfer ImageData using transferable objects
3. Report progress from worker to main thread
4. Handle cancellation gracefully

**Files to modify**:
- Enhance `src/lib/converter.worker.ts`
- Update `src/hooks/use-conversion.ts`
- Update `src/hooks/use-batch-conversion.ts`

**Estimated effort**: 1-2 days

---

### Image Cropping (Enhancement)

**Goal**: Allow users to crop images before conversion.

**Implementation Plan**:
1. Integrate `react-image-crop` library
2. Add crop UI after image upload
3. Apply crop before conversion
4. Save crop settings with history

**Estimated effort**: 1-2 days

---

### Comparison Slider Improvements (Enhancement)

**Goal**: Enhanced before/after comparison features.

**Features to add**:
1. Lens/magnifier mode for detail comparison
2. Side-by-side sync scroll
3. Overlay mode with opacity slider
4. Pixel diff highlighting

**Estimated effort**: 2-3 days

---

## 📊 Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Progressive Loading | High | Medium | P1 |
| Custom Presets | Medium | Medium | P2 |
| Export Options (PDF) | Medium | High | P2 |
| Accessibility Audit | High | Medium | P2 |
| Undo History Visual | Low | Medium | P3 |
| Web Workers Expansion | Medium | Low | P3 |
| Image Cropping | Medium | Low | P3 |
| Export Options (EPS/DXF) | Low | High | P4 |

---

## 🛠 Technical Debt

Items to address for long-term maintainability:

1. **Type Safety**: Add stricter TypeScript config
2. **Testing**: Add unit tests for conversion algorithms
3. **Documentation**: JSDoc comments for all public APIs
4. **Error Boundaries**: More granular error handling per feature
5. **Performance Monitoring**: Add metrics for conversion times

---

## 🚀 Getting Started with Contributions

1. Pick an item from this roadmap
2. Create an issue describing your implementation plan
3. Fork the repository and create a feature branch
4. Implement with tests
5. Submit a pull request referencing the issue

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.
