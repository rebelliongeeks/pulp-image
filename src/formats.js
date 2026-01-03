export const SUPPORTED_INPUT_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif'];
export const SUPPORTED_OUTPUT_FORMATS = ['png', 'jpg', 'webp', 'avif'];

export const FORMATS_WITH_TRANSPARENCY = ['png', 'webp', 'avif'];

export const DEFAULT_QUALITY = {
  jpg: 80,
  webp: 80,
  avif: 50,
  png: null // PNG is lossless by default
};

export const FORMATS_SUPPORTING_LOSSLESS = ['png', 'webp', 'avif'];

/**
 * Validates if a format is supported for output
 */
export function isValidOutputFormat(format) {
  return format && SUPPORTED_OUTPUT_FORMATS.includes(format.toLowerCase());
}

/**
 * Gets the default quality for a format
 */
export function getDefaultQuality(format) {
  if (!format) return null;
  return DEFAULT_QUALITY[format.toLowerCase()] || null;
}

/**
 * Checks if a format supports transparency
 */
export function supportsTransparency(format) {
  if (!format) return false;
  return FORMATS_WITH_TRANSPARENCY.includes(format.toLowerCase());
}

/**
 * Checks if a format supports lossless compression
 */
export function supportsLossless(format) {
  if (!format) return false;
  return FORMATS_SUPPORTING_LOSSLESS.includes(format.toLowerCase());
}

/**
 * Normalizes format name (jpg -> jpeg for Sharp compatibility)
 */
export function normalizeFormat(format) {
  if (!format) return null;
  const normalized = format.toLowerCase();
  return normalized === 'jpg' ? 'jpeg' : normalized;
}

