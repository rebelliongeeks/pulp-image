import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { SUPPORTED_INPUT_FORMATS } from './formats.js';

/**
 * Plans tasks for processing images in a directory
 * Returns array of file paths to process
 */
export function planTasks(directoryPath) {
  const resolvedPath = resolve(directoryPath);
  const tasks = [];
  
  try {
    const entries = readdirSync(resolvedPath);
    
    for (const entry of entries) {
      const entryPath = join(resolvedPath, entry);
      
      try {
        const stats = statSync(entryPath);
        
        // Only process files (not directories)
        if (stats.isFile()) {
          // Check if file has supported extension
          const ext = entry.split('.').pop()?.toLowerCase();
          
          if (ext && SUPPORTED_INPUT_FORMATS.includes(ext)) {
            tasks.push(entryPath);
          }
        }
      } catch (err) {
        // Skip entries we can't stat (permissions, etc.)
        continue;
      }
    }
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
  
  return tasks;
}

