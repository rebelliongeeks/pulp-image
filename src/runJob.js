import { statSync, existsSync } from 'fs';
import { resolve } from 'path';
import { processImage } from './processImage.js';
import { planTasks } from './planTasks.js';
import { Reporter } from './reporter.js';

/**
 * Orchestrates image processing job
 * Returns pure JS object with results (no terminal output)
 * 
 * @param {string} inputPath - Input file or directory path
 * @param {object} config - Processing configuration
 * @returns {Promise<object>} Results object with processed, skipped, failed arrays and totals
 */
export async function runJob(inputPath, config) {
  const resolvedInputPath = resolve(inputPath);
  
  // Validate input exists
  if (!existsSync(resolvedInputPath)) {
    throw new Error(`Input not found: ${resolvedInputPath}`);
  }
  
  const inputStats = statSync(resolvedInputPath);
  const isDirectory = inputStats.isDirectory();
  const isFile = inputStats.isFile();
  
  if (!isFile && !isDirectory) {
    throw new Error(`Input must be a file or directory: ${resolvedInputPath}`);
  }
  
  // Initialize reporter for data aggregation (not printing)
  const reporter = new Reporter();
  
  if (isFile) {
    // Single file processing
    try {
      const result = await processImage(resolvedInputPath, config, 0);
      reporter.recordProcessed(result);
    } catch (error) {
      // Check if it's a skip (file exists or same path) or a real error
      if (error.message.includes('already exists') || error.message.includes('Input and output paths are the same')) {
        reporter.recordSkipped(resolvedInputPath, error.message);
      } else {
        reporter.recordFailed(resolvedInputPath, error);
      }
    }
  } else {
    // Directory processing
    const tasks = planTasks(resolvedInputPath);
    
    if (tasks.length === 0) {
      // Return empty results for empty directory
      return {
        processed: [],
        skipped: [],
        failed: [],
        totals: {
          totalOriginal: 0,
          totalFinal: 0,
          totalSaved: 0,
          percentSaved: 0,
          processedCount: 0,
          skippedCount: 0,
          failedCount: 0
        }
      };
    }
    
    // Process each file
    for (let i = 0; i < tasks.length; i++) {
      const filePath = tasks[i];
      try {
        const result = await processImage(filePath, config, i);
        reporter.recordProcessed(result);
      } catch (error) {
        // Check if it's a skip (file exists or same path) or a real error
        if (error.message.includes('already exists') || error.message.includes('Input and output paths are the same')) {
          reporter.recordSkipped(filePath, error.message);
        } else {
          reporter.recordFailed(filePath, error);
        }
      }
    }
  }
  
  // Get totals from reporter
  const totals = reporter.getTotals();
  
  // Return pure JS object (no terminal output)
  return {
    processed: reporter.processed,
    skipped: reporter.skipped,
    failed: reporter.failed,
    totals
  };
}

