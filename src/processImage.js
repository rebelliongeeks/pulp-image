import sharp from 'sharp';
import { readFileSync, statSync, existsSync } from 'fs';
import { resolve } from 'path';
import { buildOutputPath } from './buildOutputPath.js';
import { 
  normalizeFormat, 
  supportsTransparency, 
  supportsLossless,
  getDefaultQuality,
  isValidOutputFormat
} from './formats.js';
import { calculateStats, formatBytes } from './stats.js';

/**
 * Processes a single image file
 * @param {string} inputPath - Input file path
 * @param {object} config - Processing configuration
 * @param {number} fileIndex - Optional 0-based index for batch processing (used in rename patterns)
 */
export async function processImage(inputPath, config, fileIndex = null) {
  const resolvedInputPath = resolve(inputPath);
  
  // Check if input file exists
  if (!existsSync(resolvedInputPath)) {
    throw new Error(`Input file not found: ${resolvedInputPath}`);
  }
  
  // Get original file size
  const originalStats = statSync(resolvedInputPath);
  const originalSize = originalStats.size;
  
  // Read image metadata
  const image = sharp(resolvedInputPath);
  const metadata = await image.metadata();
  
  // Determine output format
  const outputFormat = config.format 
    ? normalizeFormat(config.format)
    : normalizeFormat(metadata.format);
  
  // Validate output format
  if (config.format && !isValidOutputFormat(config.format)) {
    throw new Error(`Unsupported output format: ${config.format}`);
  }
  
  // Build output path
  const outputPath = buildOutputPath(resolvedInputPath, config, fileIndex);
  
  // Safety check: If input and output paths are the same, require --overwrite
  // This prevents accidental in-place overwrites
  if (resolvedInputPath === outputPath && !config.overwrite) {
    throw new Error(`Input and output paths are the same: ${outputPath}. Use --overwrite to process in-place.`);
  }
  
  // Check if output exists and overwrite is not enabled
  if (!config.overwrite && existsSync(outputPath)) {
    throw new Error(`Output file already exists: ${outputPath} (use --overwrite to overwrite)`);
  }
  
  // Prepare Sharp pipeline
  let pipeline = image.clone();
  
  // Handle resize
  if (config.width || config.height) {
    const resizeOptions = {};
    
    if (config.width && config.height) {
      // Both dimensions provided - exact resize
      resizeOptions.width = config.width;
      resizeOptions.height = config.height;
    } else if (config.width) {
      // Only width - preserve aspect ratio
      resizeOptions.width = config.width;
      resizeOptions.height = null;
    } else if (config.height) {
      // Only height - preserve aspect ratio
      resizeOptions.width = null;
      resizeOptions.height = config.height;
    }
    
    pipeline = pipeline.resize(resizeOptions);
  }
  
  // Handle format conversion and quality
  const formatOptions = {};
  
  // Check if output format supports transparency
  const outputSupportsTransparency = supportsTransparency(config.format || metadata.format);
  const inputHasAlpha = metadata.hasAlpha;
  
  // Handle transparency for formats that don't support it (JPG)
  if (inputHasAlpha && !outputSupportsTransparency) {
    if (config.alphaMode === 'error') {
      throw new Error(`Input has transparency but output format ${outputFormat} does not support it. Use --alpha-mode flatten or choose a format that supports transparency.`);
    }
    
    // Flatten onto background color
    const background = parseColor(config.background);
    pipeline = pipeline.flatten({ background });
  }
  
  // Set quality/lossless
  if (config.lossless) {
    if (supportsLossless(outputFormat)) {
      formatOptions.lossless = true;
    } else {
      console.warn(`Warning: Lossless compression not supported for ${outputFormat}, using quality settings instead.`);
    }
  }
  
  // Set quality if not lossless or if lossless not supported
  if (!formatOptions.lossless) {
    const quality = config.quality || getDefaultQuality(outputFormat);
    if (quality !== null) {
      formatOptions.quality = quality;
    }
  }
  
  // Convert to output format
  switch (outputFormat) {
    case 'png':
      pipeline = pipeline.png(formatOptions);
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg(formatOptions);
      break;
    case 'webp':
      pipeline = pipeline.webp(formatOptions);
      break;
    case 'avif':
      pipeline = pipeline.avif(formatOptions);
      break;
    default:
      // Keep original format
      break;
  }
  
  // Ensure output directory exists (only create when about to write)
  const { mkdirSync } = await import('fs');
  const { dirname } = await import('path');
  const outputDir = dirname(outputPath);
  mkdirSync(outputDir, { recursive: true });
  
  // Write output
  await pipeline.toFile(outputPath);
  
  // Get final file size
  const finalStats = statSync(outputPath);
  const finalSize = finalStats.size;
  
  // Calculate statistics
  const stats = calculateStats(originalSize, finalSize);
  
  // Handle delete original if requested
  // Safety: Only delete after successful write, and only if paths differ
  // This prevents accidental deletion of the output file or same-path scenarios
  let deleteError = null;
  if (config.deleteOriginal && resolvedInputPath !== outputPath) {
    try {
      const { unlinkSync } = await import('fs');
      // Verify file still exists before attempting deletion
      if (existsSync(resolvedInputPath)) {
        unlinkSync(resolvedInputPath);
      } else {
        console.warn(`Original file already deleted or not found: ${resolvedInputPath}`);
      }
    } catch (err) {
      // Don't fail the entire operation if deletion fails
      // Log warning but continue processing
      console.warn(`Failed to delete original file ${resolvedInputPath}:`, err.message);
      deleteError = err;
    }
  }
  
  return {
    inputPath: resolvedInputPath,
    outputPath,
    originalSize,
    finalSize,
    ...stats,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha
    },
    deleteError: deleteError ? deleteError.message : null
  };
}

/**
 * Parses a color string (hex, rgb, etc.) to RGBA object
 * Simple implementation for hex colors
 */
function parseColor(color) {
  // Handle hex colors (#ffffff, #fff)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      // Short hex (#fff -> #ffffff)
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, alpha: 1 };
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, alpha: 1 };
    }
  }
  
  // Default to white if parsing fails
  return { r: 255, g: 255, b: 255, alpha: 1 };
}

