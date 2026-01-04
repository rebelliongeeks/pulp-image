# CLI Usage Log

This document tracks the development and usage of the `pulp` CLI tool.

## Step 1: Project Bootstrap

**Date:** Initial setup

**Changes:**
- Created project structure with ESM support
- Added package.json with bin mapping to `pulp`
- Added MIT license
- Created documentation skeleton

**Status:** ✅ Complete

## Step 2: Minimal CLI Entry

**Date:** CLI setup with argument parsing

**Changes:**
- Installed dependencies: commander, chalk
- Created `src/banner.js` with ASCII banner
- Created `bin/pulp.js` with commander setup
- Implemented argument parsing for input and all flags
- Added config normalization and display (no image processing yet)

**Status:** ✅ Complete

## Step 3: Single-File Processing

**Date:** Image processing implementation

**Changes:**
- Installed Sharp for image processing
- Created `src/formats.js` - format validation and defaults
- Created `src/buildOutputPath.js` - output path building with suffix logic
- Created `src/stats.js` - statistics calculation and formatting
- Created `src/processImage.js` - main image processing logic:
  - Metadata reading
  - Resize with aspect ratio preservation
  - Format conversion
  - Transparency handling (flatten or error)
  - Quality/lossless compression
  - Output writing
  - Statistics calculation
- Wired CLI to process single image files
- Added result display with file size statistics

**Status:** ✅ Complete

## Step 4: Batch Directory Processing

**Date:** Directory processing and batch operations

**Changes:**
- Created `src/planTasks.js` - directory scanning and task planning
- Created `src/reporter.js` - result tracking and summary reporting
- Updated `bin/pulp.js` to handle directory input:
  - Detects if input is file or directory
  - Scans directory for supported image formats (non-recursive)
  - Processes files sequentially
  - Continues processing even if individual files fail
  - Tracks processed, skipped, and failed files
  - Displays per-file results in verbose mode
  - Shows comprehensive summary at the end
- Summary includes:
  - Total files processed
  - Total original size, final size, bytes saved, percent saved
  - Count of skipped files (with reasons in verbose mode)
  - Count of failed files (with errors in verbose mode)

**Status:** ✅ Complete

## Step 5: Safety and Edge Cases

**Date:** Safety verification and edge case handling

**Changes:**
- Enhanced `delete-original` safety:
  - Only deletes after successful file write
  - Only deletes if input and output paths differ
  - Gracefully handles deletion errors without failing the operation
  - Warns user if deletion fails
- Verified overwrite logic:
  - Default behavior prevents overwriting existing files
  - `--overwrite` flag allows overwriting
  - Proper error messages guide users
- Verified suffix combinations:
  - Auto suffix applied first (e.g., `-800w`)
  - Custom suffix applied second (e.g., `-optimized`)
  - Combined format: `image-800w-optimized.png`
- Verified batch processing resilience:
  - Individual file failures don't stop batch processing
  - All files are attempted
  - Summary shows processed, skipped, and failed counts
- Edge case handling:
  - Empty directories handled gracefully
  - Unsupported formats skipped
  - Invalid inputs show clear error messages
  - Same input/output path prevents accidental deletion

**Status:** ✅ Complete

## Commands and Options

### Basic Usage
```bash
pulp [input] [options]
```

### Arguments
- `[input]` - Input file or directory (required for processing)

### Options

**Resize:**
- `-w, --width <number>` - Output width in pixels
- `-h, --height <number>` - Output height in pixels

**Format:**
- `-f, --format <format>` - Output format (png, jpg, webp, avif)

**Output:**
- `-o, --out <dir>` - Output directory (default: ./pulp-image-results)
- `--suffix <text>` - Custom suffix to add before extension
- `--auto-suffix` - Automatically add size-based suffix

**Quality:**
- `--quality <number>` - Quality for lossy formats (1-100)
- `--lossless` - Use lossless compression where supported

**Transparency:**
- `--background <color>` - Background color for transparency flattening (default: #ffffff)
- `--alpha-mode <mode>` - Alpha handling: flatten or error (default: flatten)

**Safety:**
- `--overwrite` - Overwrite existing output files
- `--delete-original` - Delete original files after processing

**Other:**
- `-v, --verbose` - Verbose output
- `--help` - Show help information
- `--version` - Show version number

### Examples

```bash
# Show help
pulp --help

# Resize image (preserve aspect ratio)
pulp image.png --width 800

# Resize to exact dimensions
pulp image.png --width 800 --height 600

# Convert format
pulp image.png --format webp

# Resize and convert with custom output directory
pulp image.png --width 800 --format webp --out ./output

# Process PNG with transparency to JPG (flattened)
pulp image.png --format jpg --background "#ff0000"

# Process PNG with transparency to JPG (error if alpha present)
pulp image.png --format jpg --alpha-mode error

# Use lossless compression
pulp image.png --format webp --lossless

# Custom quality
pulp image.jpg --quality 90

# Auto suffix (adds size to filename)
pulp image.png --width 800 --auto-suffix
# Output: image-800w.png

# Custom suffix
pulp image.png --suffix "optimized"
# Output: image-optimized.png

# Both auto and custom suffix
pulp image.png --width 800 --auto-suffix --suffix "optimized"
# Output: image-800w-optimized.png

# Process all images in a directory
pulp ./images --format webp --out ./output

# Process directory with resize and auto-suffix
pulp ./images --width 800 --auto-suffix --out ./output

# Process directory with verbose output
pulp ./images --format webp --out ./output --verbose

# Process directory with overwrite enabled
pulp ./images --format webp --out ./output --overwrite

# Delete original files after processing (safety: only if paths differ)
pulp image.png --format webp --delete-original --out ./pulp-image-results

# Combined auto and custom suffix
pulp image.png --width 800 --height 600 --auto-suffix --suffix "thumb" --out ./pulp-image-results
# Output: image-800x600-thumb.png
```

