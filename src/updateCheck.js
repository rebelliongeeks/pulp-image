/**
 * Update checker for Pulp Image
 * Checks npm registry for newer versions and caches results
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PACKAGE_NAME = 'pulp-image';
const NPM_REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cache directory path
 * @returns {string} Path to cache directory
 */
function getCacheDir() {
  return join(homedir(), '.config', 'pulp-image');
}

/**
 * Get cache file path
 * @returns {string} Path to cache file
 */
function getCacheFile() {
  return join(getCacheDir(), 'update-cache.json');
}

/**
 * Read cached update check result
 * @returns {object|null} Cached result or null if expired/missing
 */
function readCache() {
  try {
    const cacheFile = getCacheFile();
    if (!existsSync(cacheFile)) {
      return null;
    }
    
    const cache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    const now = Date.now();
    
    // Check if cache is still valid
    if (cache.timestamp && (now - cache.timestamp) < CACHE_DURATION_MS) {
      return cache;
    }
    
    return null; // Cache expired
  } catch {
    return null;
  }
}

/**
 * Write update check result to cache
 * @param {object} data - Data to cache
 */
function writeCache(data) {
  try {
    const cacheDir = getCacheDir();
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    
    const cache = {
      ...data,
      timestamp: Date.now()
    };
    
    writeFileSync(getCacheFile(), JSON.stringify(cache, null, 2));
  } catch {
    // Silently fail - caching is optional
  }
}

/**
 * Compare two semantic version strings
 * @param {string} current - Current version (e.g., "0.1.8")
 * @param {string} latest - Latest version (e.g., "0.2.0")
 * @returns {boolean} True if latest is newer than current
 */
function isNewerVersion(current, latest) {
  const parseVersion = (v) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  
  for (let i = 0; i < 3; i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;
    
    if (lat > curr) return true;
    if (lat < curr) return false;
  }
  
  return false; // Versions are equal
}

/**
 * Fetch latest version from npm registry
 * @param {number} timeoutMs - Request timeout in milliseconds
 * @returns {Promise<string|null>} Latest version or null on error
 */
async function fetchLatestVersion(timeoutMs = 3000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.version || null;
  } catch {
    // Network error, timeout, or offline - silently fail
    return null;
  }
}

/**
 * Check for updates (with caching)
 * @param {string} currentVersion - Current installed version
 * @param {object} options - Options
 * @param {boolean} options.force - Force check, ignore cache
 * @returns {Promise<object>} Update check result
 */
export async function checkForUpdate(currentVersion, options = {}) {
  const { force = false } = options;
  
  // Check cache first (unless forced)
  if (!force) {
    const cached = readCache();
    if (cached && cached.currentVersion === currentVersion) {
      return {
        updateAvailable: cached.updateAvailable,
        currentVersion: cached.currentVersion,
        latestVersion: cached.latestVersion,
        cached: true
      };
    }
  }
  
  // Fetch latest version from npm
  const latestVersion = await fetchLatestVersion();
  
  if (!latestVersion) {
    // Couldn't fetch - return no update (fail silently)
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: null,
      error: true
    };
  }
  
  const updateAvailable = isNewerVersion(currentVersion, latestVersion);
  
  // Cache the result
  const result = {
    updateAvailable,
    currentVersion,
    latestVersion
  };
  
  writeCache(result);
  
  return {
    ...result,
    cached: false
  };
}

/**
 * Format update notification message for CLI
 * @param {object} updateInfo - Result from checkForUpdate
 * @returns {string|null} Formatted message or null if no update
 */
export function formatUpdateMessage(updateInfo) {
  if (!updateInfo.updateAvailable || !updateInfo.latestVersion) {
    return null;
  }
  
  return `Update available: ${updateInfo.currentVersion} → ${updateInfo.latestVersion}\nRun: npm update -g pulp-image`;
}
