# Roadmap

> Full-featured image processing CLI with a browser UI. 100% local.

---

## ✅ v0.1.x (Current)

| Feature | Description |
|---------|-------------|
| ~~**Format Conversion**~~ | ~~Convert between PNG, JPG, WebP, AVIF, GIF, TIFF~~ |
| ~~**Resize**~~ | ~~Resize by width, height, or both with auto aspect ratio~~ |
| ~~**Quality Control**~~ | ~~Adjust compression quality (1-100)~~ |
| ~~**Lossless Mode**~~ | ~~Preserve full quality for WebP and AVIF~~ |
| ~~**Transparency Handling**~~ | ~~Flatten transparent areas with custom background color~~ |
| ~~**Custom Output Directory**~~ | ~~Save processed files to any folder~~ |
| ~~**Auto Suffix**~~ | ~~Add dimensions to filename automatically~~ |
| ~~**Rename Patterns**~~ | ~~Use tokens like {name}, {ext}, {index} for output names (UI)~~ |
| ~~**Batch Processing**~~ | ~~Process entire folders at once~~ |
| ~~**Delete Originals**~~ | ~~Remove source files after processing (CLI only)~~ |
| ~~**Browser-Based UI**~~ | ~~Full-featured interface, works offline, no uploads~~ |

---

## 🚧 v0.2.0

| Feature | Description |
|---------|-------------|
| **UI Redesign** | Modern tabbed interface with dark mode |
| **Rotate** | Rotate images by 90°, 180°, 270°, or custom angle |
| **Flip / Mirror** | Flip vertically or horizontally |
| **Grayscale** | Convert images to black and white |
| **Auto-Orient** | Fix photos that appear sideways or upside down |

---

## 📋 v0.3.0

| Feature | Description |
|---------|-------------|
| **Blur** | Soften images with adjustable intensity |
| **Sharpen** | Enhance detail and clarity |
| **Normalize** | Auto-adjust contrast for better exposure |
| **Brightness** | Adjust overall brightness |
| **Saturation** | Adjust color intensity |
| **Gamma Correction** | Adjust brightness curve |
| **Hue Shift** | Rotate colors on the color wheel |
| **Negate / Invert** | Invert all colors (negative effect) |
| **Tint** | Apply color overlay |

---

## 📋 v0.4.0

| Feature | Description |
|---------|-------------|
| **Trim Whitespace** | Auto-remove uniform borders from images |
| **Crop by Coordinates** | Crop to specific pixel coordinates |
| **Visual Crop Tool** | Drag-and-drop crop selection (UI) |
| **Aspect Ratio Crop** | Crop to common ratios (16:9, 4:3, 1:1) |
| **Blur Region** | Blur faces or sensitive areas for privacy |
| **Pixelate Region** | Pixelate specific areas for censoring |

---

## 📋 v0.5.0

| Feature | Description |
|---------|-------------|
| **Add Padding** | Add space around image with custom color |
| **Add Border** | Add visible frame around image |

---

## 📋 v0.6.0

| Feature | Description |
|---------|-------------|
| **Image Watermark** | Add logo or image overlay |
| **Watermark Position** | Place in corners, center, or custom coordinates |
| **Watermark Opacity** | Adjust transparency (0-100%) |
| **Watermark Scale** | Size relative to image or absolute pixels |
| **Watermark Tile** | Repeat watermark across entire image |

---

## 📋 v0.7.0

| Feature | Description |
|---------|-------------|
| **Save Preset** | Save current settings as named preset |
| **Load Preset** | Apply saved presets |
| **Built-in Presets** | Ready-to-use presets (web, thumbnail, social media) |
| **Export/Import Presets** | Share presets between devices or users |

---

## 📋 v0.8.0

| Feature | Description |
|---------|-------------|
| **Multi-Format Export** | Export same image to multiple formats at once |
| **Multi-Size Export** | Export same image at multiple sizes at once |
| **Progressive JPEG** | Enable progressive loading (blurry to sharp) |
| **PNG Compression** | Fine-tune PNG compression level |
| **WebP/AVIF Effort** | Control encoding effort for smaller files |

---

## 🎯 v1.0.0 (Stable Release)

- All features from v0.2.0 through v0.8.0 complete
- Comprehensive documentation
- Stable CLI (no breaking changes)

---

## 🔮 Future (v1.1.0+)

These features may be added after the stable release:

| Feature | Description |
|---------|-------------|
| **Preserve Metadata** | Keep original EXIF data instead of stripping |
| **Custom ICC Profile** | Embed specific color profiles |
| **Median Filter** | Reduce noise while preserving edges |
| **Pure Black & White** | Convert to only black and white pixels (stencil effect) |
| **Animated GIF/WebP** | Process animated images |
| **Extract Frame** | Get single frame from animation |

---

*No fixed release dates. Features ship when ready.*
