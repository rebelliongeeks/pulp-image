import { dirname, basename, extname, join, resolve } from 'path';
import { mkdirSync } from 'fs';

/**
 * Builds the output path for an image file
 */
export function buildOutputPath(inputPath, config) {
  const { out, format, width, height, suffix, autoSuffix } = config;
  
  // Ensure output directory exists
  const outputDir = resolve(out);
  mkdirSync(outputDir, { recursive: true });
  
  // Get base filename and extension
  const baseName = basename(inputPath);
  const inputExt = extname(baseName);
  const nameWithoutExt = baseName.slice(0, -inputExt.length);
  
  // Determine output extension
  const outputExt = format ? `.${format}` : inputExt;
  
  // Build suffix parts
  const suffixParts = [];
  
  // Auto suffix first (if enabled)
  if (autoSuffix) {
    if (width && height) {
      suffixParts.push(`${width}x${height}`);
    } else if (width) {
      suffixParts.push(`${width}w`);
    } else if (height) {
      suffixParts.push(`${height}h`);
    }
  }
  
  // Custom suffix second (if provided)
  if (suffix) {
    suffixParts.push(suffix);
  }
  
  // Combine suffix
  const finalSuffix = suffixParts.length > 0 ? `-${suffixParts.join('-')}` : '';
  
  // Build final filename
  const outputFilename = `${nameWithoutExt}${finalSuffix}${outputExt}`;
  const outputPath = join(outputDir, outputFilename);
  
  return outputPath;
}

