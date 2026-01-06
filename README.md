# pulp-image

A powerful, safety-first CLI tool for processing images with resize, format conversion, and optimization.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## Features

- 🖼️ **Resize images** with aspect ratio preservation
- 🔄 **Convert formats** (PNG, JPG, WebP, AVIF)
- 📦 **Batch process** entire directories
- 🛡️ **Safety-first** defaults (no overwrites, no accidental deletions)
- 📊 **Detailed statistics** and summary reports
- 🎨 **Transparency handling** with customizable backgrounds
- ⚡ **Optimization** with quality and lossless options

## Installation

Install pulp-image globally using npm:

```bash
npm install -g pulp-image
```

This is a global CLI. Installing with `-g` makes the `pulp` command available system-wide.

### Requirements

- Node.js >= 18.0.0
- npm (comes with Node.js)

## Quick Start

```bash
# Resize an image
pulp image.png --width 800

# Convert format
pulp image.png --format webp

# Process all images in a directory
pulp ./images --format webp --out ./output
```

## Usage

```bash
pulp [input] [options]
```

### Arguments

- `[input]` - Input file or directory (required)

### Common Options

#### Resize
- `-w, --width <number>` - Output width in pixels (preserves aspect ratio if height not specified)
- `-h, --height <number>` - Output height in pixels (preserves aspect ratio if width not specified)

#### Format
- `-f, --format <format>` - Output format: `png`, `jpg`, `webp`, or `avif`

#### Output
- `-o, --out <dir>` - Output directory (default: `./pulp-image-results`)
  - **Why use --out?** This keeps your original files safe and organizes processed images in a dedicated folder. The output directory is created automatically if it doesn't exist.

#### Quality
- `--quality <number>` - Quality for lossy formats (1-100). Defaults: JPG=80, WebP=80, AVIF=50
- `--lossless` - Use lossless compression where supported (PNG, WebP, AVIF)

**Compression Behavior:**
- **PNG**: Always lossless (no quality setting available)
- **JPG**: Always lossy, default quality 80 (does not support lossless)
- **WebP**: Lossy by default (quality 80), can use `--lossless` for lossless compression
- **AVIF**: Lossy by default (quality 50), can use `--lossless` for lossless compression

**Note:** Resize operations do NOT affect compression. Resizing only changes image dimensions. Compression/quality is determined by the format and quality settings.

#### Transparency
- `--background <color>` - Background color for flattening transparency (hex format, default: `#ffffff`)
- `--alpha-mode <mode>` - Alpha handling: `flatten` (default) or `error`

#### Safety
- `--overwrite` - Overwrite existing output files (default: skip existing files)
- `--delete-original` - Delete original files after successful processing (only if paths differ)

#### Other
- `-v, --verbose` - Show detailed per-file processing information
- `--help` - Display help information
- `--version` - Show version number

## Examples

### Resize Images

```bash
# Resize by width (preserves aspect ratio)
pulp image.png --width 800

# Resize by height (preserves aspect ratio)
pulp image.png --height 600

# Resize to exact dimensions
pulp image.png --width 800 --height 600
```

### Format Conversion

```bash
# Convert PNG to WebP (preserves transparency)
pulp image.png --format webp

# Convert PNG to JPG (flattens transparency to white)
pulp image.png --format jpg

# Convert with custom background color
pulp image.png --format jpg --background "#ff0000"

# Convert to lossless WebP
pulp image.png --format webp --lossless
```

### Suffix Options

```bash
# Auto suffix (adds size to filename)
pulp image.png --width 800 --auto-suffix
# Output: image-800w.png

# Custom suffix
pulp image.png --suffix "optimized"
# Output: image-optimized.png

# Combined suffixes (auto first, custom second)
pulp image.png --width 800 --auto-suffix --suffix "thumb"
# Output: image-800w-thumb.png
```

### Batch Processing

```bash
# Process all images in a directory
pulp ./images --format webp --out ./output

# Resize all images with auto-suffix
pulp ./images --width 800 --auto-suffix --out ./output

# Verbose mode (shows per-file details)
pulp ./images --format webp --out ./output --verbose

# Overwrite existing files
pulp ./images --format webp --out ./output --overwrite
```

### Safety Features

```bash
# Safe processing (output to separate directory)
pulp image.png --format webp --out ./pulp-image-results

# Overwrite existing output files
pulp image.png --format webp --out ./pulp-image-results --overwrite

# Delete original after successful processing
pulp image.png --format webp --out ./pulp-image-results --delete-original
```

## Safety Features

pulp-image is designed with safety in mind:

- **No overwrites by default** - Existing output files are skipped unless `--overwrite` is used
- **Delete original safety** - Only deletes after successful processing and only if input/output paths differ
- **Same path protection** - Prevents accidental in-place overwrites
- **Batch resilience** - Continues processing even if individual files fail
- **Clear error messages** - Helpful guidance when something goes wrong

## Output Directory (--out)

The `--out` option specifies where processed images are saved. Here's why it's useful:

- **Keeps originals safe** - Your source files remain untouched
- **Organizes outputs** - All processed images in one place
- **Prevents accidents** - No risk of overwriting originals
- **Default location** - Uses `./pulp-image-results` if not specified
- **Auto-creation** - Creates the directory if it doesn't exist

Example:
```bash
# Process images and save to ./output directory
pulp ./images --format webp --out ./output

# Your originals in ./images remain safe
# Processed images go to ./output
```

## Supported Formats

### Input Formats
- PNG
- JPG/JPEG
- WebP
- AVIF

### Output Formats
- PNG
- JPG
- WebP
- AVIF

## Compression & Quality

### Default Compression Behavior

Each format has different default compression behavior:

- **PNG**: Always lossless (no quality setting available)
- **JPG**: Always lossy, default quality 80 (does not support lossless)
- **WebP**: Lossy by default (quality 80), supports lossless with `--lossless`
- **AVIF**: Lossy by default (quality 50), supports lossless with `--lossless`

**Important:** Resize operations do NOT affect compression. Resizing only changes image dimensions. Compression/quality is determined by the format and quality settings.

### Using Lossless Compression

```bash
# Lossless WebP
pulp image.png --format webp --lossless

# Lossless AVIF
pulp image.png --format avif --lossless

# PNG is already lossless (no flag needed)
pulp image.jpg --format png
```

### Custom Quality Settings

```bash
# High quality JPG
pulp image.png --format jpg --quality 95

# Lower quality WebP (smaller file)
pulp image.png --format webp --quality 60

# Custom AVIF quality
pulp image.png --format avif --quality 70
```

## Transparency Handling

When converting images with transparency to formats that don't support it (like JPG):

- **Default behavior**: Flattens transparency onto white background
- **Custom background**: Use `--background "#color"` to specify a color
- **Error mode**: Use `--alpha-mode error` to fail instead of flattening

Example:
```bash
# Flatten transparency to red background
pulp image.png --format jpg --background "#ff0000"

# Fail if transparency exists
pulp image.png --format jpg --alpha-mode error
```

## Statistics and Reporting

pulp-image provides detailed statistics:

- **Per-file stats**: Original size, final size, bytes saved, percent saved
- **Batch summary**: Total files processed, total sizes, overall savings
- **Skipped files**: Count and reasons (in verbose mode)
- **Failed files**: Count and errors (in verbose mode)

Example output:
```
✓ Processed: 7 file(s)
  Total original size: 10.07 MB
  Total final size:    821.78 KB
  Total saved:         9.26 MB (92.03%)
```

## Browser UI

pulp-image includes a web-based interface for easy image processing:

```bash
pulp ui
```

This starts a local web server. Open your browser and navigate to:

```
http://localhost:3000
```

The browser UI provides a user-friendly interface for processing images with all the same features available in the CLI.

## License

MIT

## Author

Rebellion Geeks
