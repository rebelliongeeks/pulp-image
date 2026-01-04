import { dirname, basename, extname, join, resolve } from 'path';
import { mkdirSync } from 'fs';

/**
 * Builds the output path for an image file
 */
export function buildOutputPath(inputPath, config, fileIndex = null) {
  const { out, format, width, height, suffix, autoSuffix, renamePattern } = config;
  
  // Resolve output directory (but don't create it yet - will be created when writing)
  const outputDir = resolve(out);
  
  // Get base filename and extension
  const baseName = basename(inputPath);
  const inputExt = extname(baseName);
  const nameWithoutExt = baseName.slice(0, -inputExt.length);
  
  // Determine output extension
  const outputExt = format ? `.${format}` : inputExt;
  const outputExtNoDot = outputExt.slice(1); // Remove leading dot
  
  // If rename pattern is provided, use it
  if (renamePattern) {
    let outputFilename = renamePattern
      .replace(/{name}/g, nameWithoutExt)
      .replace(/{ext}/g, outputExtNoDot)
      .replace(/{index}/g, fileIndex !== null ? String(fileIndex + 1) : '1');
    
    // Ensure we have an extension
    if (!outputFilename.includes('.')) {
      outputFilename += outputExt;
    }
    
    const outputPath = join(outputDir, outputFilename);
    return outputPath;
  }
  
  // Original logic (suffix-based naming)
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

