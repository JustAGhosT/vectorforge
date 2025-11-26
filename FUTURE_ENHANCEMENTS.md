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

---

## 🔮 Future Enhancements

### Progressive Loading (Medium Priority)

**Goal**: Lazy load images and implement progressive rendering for better perceived performance.

**Implementation Plan**:
1. Add blur-up placeholder technique for image previews
2. Implement intersection observer for lazy loading history items
3. Add skeleton loaders for conversion results
4. Progressive SVG rendering (show partial results during conversion)

**Files to modify**:
- `src/components/ConversionPreview.tsx`
- `src/components/ConversionHistory.tsx`
- Create `src/components/ProgressiveImage.tsx`

**Estimated effort**: 1-2 days

---

### Custom Presets (Nice to Have)

**Goal**: Allow users to save, share, and load custom conversion presets.

**Implementation Plan**:
1. Create preset data structure:
   ```typescript
   interface ConversionPreset {
     id: string
     name: string
     description?: string
     settings: ConversionSettings
     imageType?: 'logo' | 'icon' | 'illustration' | 'photo'
     createdAt: number
   }
   ```

2. Add preset management UI:
   - Save current settings as preset button
   - Preset dropdown/modal in SettingsPanel
   - Import/export presets as JSON

3. Persist presets using Spark KV or localStorage

4. Add built-in presets:
   - "Logo - High Contrast"
   - "Icon - Clean Lines"
   - "Illustration - Detailed"
   - "Photo - Maximum Detail"
   - "Minimal - Small File Size"

**Files to create**:
- `src/components/PresetManager.tsx`
- `src/hooks/use-presets.ts`
- `src/lib/presets.ts`

**Estimated effort**: 2-3 days

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

### Undo History Visualization (Nice to Have)

**Goal**: Visual timeline of settings changes with thumbnail previews.

**Implementation Plan**:
1. Capture thumbnail at each settings change
2. Create visual timeline component
3. Allow clicking on history point to restore state
4. Add branching support (undo, make changes, creates new branch)

**UI Concept**:
```
[Settings History]
├── [Thumb] Initial → Complexity: 50%, Colors: 50%, Smooth: 50%
├── [Thumb] Change 1 → Complexity: 70%
├── [Thumb] Change 2 → Colors: 30%
└── [Thumb] Current → Smooth: 80%
```

**Files to create**:
- `src/components/SettingsHistoryTimeline.tsx`
- `src/hooks/use-settings-history-enhanced.ts`

**Estimated effort**: 2-3 days

---

### Accessibility Audit (Nice to Have)

**Goal**: Ensure WCAG 2.1 AA compliance across the application.

**Checklist**:
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader compatibility
- [ ] Focus indicators and management
- [ ] Color contrast ratios
- [ ] Alternative text for images
- [ ] ARIA labels and roles
- [ ] Reduced motion support
- [ ] Error message accessibility

**Testing Tools**:
- axe-core for automated testing
- VoiceOver/NVDA manual testing
- Lighthouse accessibility audit

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
