/**
 * Calculates file size statistics
 */
export function calculateStats(originalSize, finalSize) {
  const bytesSaved = originalSize - finalSize;
  const percentSaved = originalSize > 0 
    ? ((bytesSaved / originalSize) * 100).toFixed(2)
    : '0.00';
  
  return {
    originalSize,
    finalSize,
    bytesSaved,
    percentSaved: parseFloat(percentSaved)
  };
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

