# pulp-image

Full-featured image processing CLI with a browser UI. 100% local.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

**[Website](https://pulp.run)** · **[CLI Docs](https://pulp.run/cli.html)** · **[UI Docs](https://pulp.run/ui.html)** · **[Roadmap](https://pulp.run/roadmap.html)** · **[Changelog](https://pulp.run/changelog.html)**

---

## Features

| | | |
|:--|:--|:--|
| 🖼️ **Resize** | 🔄 **Convert Formats** | 📦 **Batch Process** |
| 🎨 **Transparency** | ⚡ **Quality Control** | 🛡️ **Safety-First** |
| 🌐 **Browser UI** | 📁 **Custom Output** | 🏷️ **Auto Naming** |

---

## Installation

### CLI (npm)

```bash
npm install -g pulp-image
```

Requires Node.js >= 18.0.0

### Portable UI (No Install)

Download the portable UI for your platform. No Node.js or npm required:

**[Download Latest Release](https://github.com/rebelliongeeks/pulp-image/releases/latest)**

---

## Quick Start

```bash
# Resize an image
pulp image.png --width 800

# Convert to WebP
pulp image.png --format webp

# Batch process a folder
pulp ./images --format webp --out ./output

# High quality JPG
pulp image.png --format jpg --quality 95

# Lossless WebP
pulp image.png --format webp --lossless
```

For all options, run `pulp --help` or see the [CLI documentation](https://pulp.run/cli.html).

---

## Browser UI

Launch the browser-based interface:

```bash
pulp ui
```

Opens at `http://localhost:3000`. All processing happens locally, no uploads.

See the [UI documentation](https://pulp.run/ui.html) for details.

---

## Roadmap

See the full [Roadmap](https://pulp.run/roadmap.html) for upcoming features.

**Coming soon:**
- UI Redesign with dark mode
- Rotate, Flip, Grayscale
- Blur, Sharpen, Normalize
- Cropping & Visual Crop Tool
- Watermarks
- User Presets

---

## License

MIT

## Author

Made in Cyprus with ❤️ by [Rebellion Geeks](https://rebelliongeeks.com)

