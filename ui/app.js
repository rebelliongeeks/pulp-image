// Pulp Image UI - Main Application Logic

// Format information
const FORMAT_INFO = {
  png: { name: 'PNG', supportsLossless: true, supportsQuality: false, defaultQuality: null, supportsTransparency: true },
  jpg: { name: 'JPG', supportsLossless: false, supportsQuality: true, defaultQuality: 80, supportsTransparency: false },
  webp: { name: 'WebP', supportsLossless: true, supportsQuality: true, defaultQuality: 80, supportsTransparency: true },
  avif: { name: 'AVIF', supportsLossless: true, supportsQuality: true, defaultQuality: 50, supportsTransparency: true }
};

// State
let selectedFiles = [];
let processing = false;
let resolvedOutputPath = null; // Store resolved output path to prevent clearing

// DOM Elements
const form = document.getElementById('process-form');
const inputModeRadios = document.querySelectorAll('input[name="input-mode"]');
const inputSourceFiles = document.getElementById('input-source-files');
const inputSourceFolder = document.getElementById('input-source-folder');
const outputDir = document.getElementById('output-dir');
const useCustomOutput = document.getElementById('use-custom-output');
const openResultsFolderBtn = document.getElementById('open-results-folder');
const openResultsFolderResultsBtn = document.getElementById('open-results-folder-results');
const formatSelect = document.getElementById('format');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const losslessToggle = document.getElementById('lossless');
const alphaModeRadios = document.querySelectorAll('input[name="alpha-mode"]');
const backgroundColor = document.getElementById('background');
const backgroundText = document.getElementById('background-text');
const renamePatternInput = document.getElementById('rename-pattern');
const suffixInput = document.getElementById('suffix');
const autoSuffixToggle = document.getElementById('auto-suffix');
const overwriteCheckbox = document.getElementById('overwrite');
// Delete original checkbox removed - not available in browser UI due to security restrictions
const processButton = document.getElementById('process-button');
const resetButton = document.getElementById('reset-button');
const inputPreview = document.getElementById('input-preview');
const fileListSummary = document.getElementById('file-list-summary-text');
const toggleFileListBtn = document.getElementById('toggle-file-list');
const fileListDetail = document.getElementById('file-list-detail');
const renamePreview = document.getElementById('rename-preview');
const suffixPreview = document.getElementById('suffix-preview');
const autoSuffixPreview = document.getElementById('auto-suffix-preview');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const inputHelper = document.getElementById('input-helper');
const outputDirHelper = document.getElementById('output-dir-helper');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupForm();
  setupValidation();
  await loadVersion(); // Load version from backend
  await updateOutputDirectory(); // Initialize output directory
  await updateUI();
});

// Load version from backend (single source of truth)
async function loadVersion() {
  try {
    const response = await fetch('/api/version');
    if (response.ok) {
      const data = await response.json();
      const versionElement = document.getElementById('version');
      if (versionElement && data.version) {
        versionElement.textContent = `v${data.version}`;
      }
    } else {
      console.warn('Failed to load version from server');
    }
  } catch (error) {
    console.warn('Error loading version:', error);
    // Keep default version display if fetch fails
  }
}

// Tab Switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update contents
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// Form Setup
function setupForm() {
  // Input mode switching
  inputModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const mode = e.target.value;
      const privacyNotice = document.getElementById('folder-privacy-notice');
      if (mode === 'files') {
        inputSourceFiles.style.display = 'block';
        inputSourceFolder.style.display = 'none';
        if (privacyNotice) privacyNotice.style.display = 'none';
        inputHelper.textContent = 'Select one or more image files. Supports PNG, JPG, WebP, AVIF. Multiple files will be processed as a batch.';
      } else {
        inputSourceFiles.style.display = 'none';
        inputSourceFolder.style.display = 'block';
        if (privacyNotice) privacyNotice.style.display = 'block';
        inputHelper.textContent = 'Choose a folder containing image files. Folder picker support depends on browser (Chrome/Edge recommended).';
      }
      // Clear selection when switching modes
      selectedFiles = [];
      inputSourceFiles.value = '';
      inputSourceFolder.value = '';
      updateInputPreview();
      updateUI().catch(console.error);
    });
  });
  
  // Supported image formats (matching backend)
  const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'avif'];
  
  // Filter files to only include supported image formats
  function filterImageFiles(files) {
    return Array.from(files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
    });
  }
  
  // File input
  inputSourceFiles.addEventListener('change', (e) => {
    const allFiles = Array.from(e.target.files);
    selectedFiles = filterImageFiles(allFiles);
    const ignoredCount = allFiles.length - selectedFiles.length;
    if (ignoredCount > 0) {
      console.log(`Ignored ${ignoredCount} non-image file(s)`);
    }
    updateInputPreview();
    updateUI().catch(console.error);
  });
  
  // Folder input
  inputSourceFolder.addEventListener('change', (e) => {
    const allFiles = Array.from(e.target.files);
    selectedFiles = filterImageFiles(allFiles);
    const ignoredCount = allFiles.length - selectedFiles.length;
    if (ignoredCount > 0) {
      console.log(`Ignored ${ignoredCount} non-image file(s)`);
    }
    updateInputPreview();
    updateUI().catch(console.error);
  });
  
  // Custom output directory toggle
  useCustomOutput.addEventListener('change', async () => {
    if (useCustomOutput.checked) {
      outputDir.readOnly = false;
      outputDir.style.background = 'white';
      outputDirHelper.textContent = 'Specify a custom output directory. Use ~ for home directory.';
      await validateCustomOutputPath();
    } else {
      outputDir.readOnly = true;
      outputDir.style.background = '';
      await updateOutputDirectory();
      outputDirHelper.textContent = 'Files will be saved in a new folder inside your home directory.';
    }
  });
  
  // Validate custom output path on input
  outputDir.addEventListener('blur', async () => {
    if (useCustomOutput.checked) {
      await validateCustomOutputPath();
    }
  });
  
  // Open results folder button (near output directory) - with null check
  if (openResultsFolderBtn) {
    openResultsFolderBtn.addEventListener('click', async () => {
      const outputPath = outputDir ? outputDir.value : null;
      if (outputPath) {
        await openResultsFolder(outputPath);
      }
    });
  } else {
    console.warn('open-results-folder button not found in DOM');
  }
  
  // Open results folder button (near results) - with null check
  if (openResultsFolderResultsBtn) {
    openResultsFolderResultsBtn.addEventListener('click', async () => {
      const outputPath = outputDir ? outputDir.value : null;
      if (outputPath) {
        await openResultsFolder(outputPath);
      }
    });
  } else {
    console.warn('open-results-folder-results button not found in DOM');
  }
  
  // Helper function to open results folder
  async function openResultsFolder(path) {
    try {
      const response = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path })
      });
      if (!response.ok) {
        throw new Error('Failed to open folder');
      }
    } catch (error) {
      alert(`Error opening folder: ${error.message}`);
    }
  }
  
  // Rename pattern input
  renamePatternInput.addEventListener('input', () => {
    updateRenamePreview();
  });
  
  // Format change - triggers rename preview update
  formatSelect.addEventListener('change', () => {
    updateFormatDependencies();
    updateRenamePreview();
    updateUI().catch(console.error);
  });
  
  // Quality slider
  qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value;
  });
  
  // Lossless toggle
  losslessToggle.addEventListener('change', () => {
    updateFormatDependencies();
  });
  
  // Background color
  backgroundColor.addEventListener('input', (e) => {
    backgroundText.value = e.target.value;
  });
  
  backgroundText.addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      backgroundColor.value = e.target.value;
    }
  });
  
  // Suffix inputs
  suffixInput.addEventListener('input', updateSuffixPreview);
  autoSuffixToggle.addEventListener('change', updateSuffixPreview);
  widthInput.addEventListener('input', updateSuffixPreview);
  heightInput.addEventListener('input', updateSuffixPreview);
  formatSelect.addEventListener('change', () => {
    updateFormatDependencies();
    updateSuffixPreview();
    updateRenamePreview(); // Update rename preview when format changes
    updateUI().catch(console.error);
  });
  
  // Warnings
  overwriteCheckbox.addEventListener('change', () => {
    document.getElementById('overwrite-warning').style.display = 
      overwriteCheckbox.checked ? 'block' : 'none';
  });
  
  // Delete original checkbox removed - not available in browser UI
  
  // Form submission
  form.addEventListener('submit', handleSubmit);
  
  // Reset button
  resetButton.addEventListener('click', resetForm);
}

// Validation Setup
function setupValidation() {
  // Real-time validation
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('blur', validateForm);
    input.addEventListener('input', validateForm);
  });
}

// Update Format Dependencies
function updateFormatDependencies() {
  const format = formatSelect.value;
  const formatInfo = format ? FORMAT_INFO[format] : null;
  
  // Update quality slider
  if (formatInfo) {
    if (formatInfo.supportsQuality && !losslessToggle.checked) {
      qualitySlider.disabled = false;
      if (formatInfo.defaultQuality && qualitySlider.value === '80') {
        qualitySlider.value = formatInfo.defaultQuality;
        qualityValue.textContent = formatInfo.defaultQuality;
      }
    } else {
      qualitySlider.disabled = true;
    }
    
    // Update lossless toggle
    if (formatInfo.supportsLossless) {
      losslessToggle.disabled = false;
    } else {
      losslessToggle.disabled = true;
      losslessToggle.checked = false;
    }
  } else {
    qualitySlider.disabled = false;
    losslessToggle.disabled = false;
  }
  
  // Update helper texts
  updateHelperTexts();
}

// Update Helper Texts
function updateHelperTexts() {
  const format = formatSelect.value;
  const formatInfo = format ? FORMAT_INFO[format] : null;
  const formatHelper = document.getElementById('format-helper');
  const qualityHelper = document.getElementById('quality-helper');
  const losslessHelper = document.getElementById('lossless-helper');
  
  if (formatInfo) {
    formatHelper.textContent = `${formatInfo.name}: ${formatInfo.supportsTransparency ? 'Supports transparency' : 'No transparency support'}. ${formatInfo.supportsLossless ? 'Supports lossless' : 'Lossy only'}.`;
    
    if (losslessToggle.checked && formatInfo.supportsLossless) {
      qualityHelper.textContent = 'Quality is disabled when lossless compression is enabled.';
    } else if (formatInfo.supportsQuality) {
      qualityHelper.textContent = `Quality for ${formatInfo.name} (1-100). Default: ${formatInfo.defaultQuality}. Higher = better quality but larger file.`;
    } else {
      qualityHelper.textContent = `${formatInfo.name} is always lossless (no quality setting).`;
    }
    
    if (formatInfo.supportsLossless) {
      losslessHelper.textContent = `Use lossless compression for ${formatInfo.name}. When enabled, quality setting is ignored.`;
    } else {
      losslessHelper.textContent = `${formatInfo.name} does not support lossless compression.`;
    }
  } else {
    formatHelper.textContent = 'Select output format or keep original.';
    qualityHelper.textContent = 'Quality for lossy formats (1-100). Defaults: JPG=80, WebP=80, AVIF=50.';
    losslessHelper.textContent = 'Use lossless compression where supported (PNG, WebP, AVIF). PNG is always lossless.';
  }
}

// Update Input Preview
function updateInputPreview() {
  if (selectedFiles.length === 0) {
    fileListSummary.textContent = 'No files selected';
    toggleFileListBtn.style.display = 'none';
    fileListDetail.style.display = 'none';
    return;
  }
  
  // Update summary - always show FILTERED count (selectedFiles is already filtered)
  const filteredCount = selectedFiles.length;
  fileListSummary.textContent = `${filteredCount} file${filteredCount === 1 ? '' : 's'} selected`;
  
  // Always show toggle button (even for single file)
  toggleFileListBtn.style.display = 'inline-block';
  toggleFileListBtn.textContent = fileListDetail.style.display === 'none' ? 'Show files' : 'Hide files';
  
  // Update file list detail - always render list (only filtered image files)
  fileListDetail.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-list-item';
    const size = file.size ? formatBytes(file.size) : 'Unknown size';
    item.innerHTML = `
      <span class="file-list-item-name">${escapeHtml(file.name)}</span>
      <span class="file-list-item-size">${size}</span>
    `;
    fileListDetail.appendChild(item);
  });
}

// Toggle file list
toggleFileListBtn.addEventListener('click', () => {
  if (fileListDetail.style.display === 'none') {
    fileListDetail.style.display = 'block';
    toggleFileListBtn.textContent = 'Hide files';
  } else {
    fileListDetail.style.display = 'none';
    toggleFileListBtn.textContent = 'Show files';
  }
});

// Update Output Directory
async function updateOutputDirectory() {
  // Don't update if we're processing or if path is already resolved
  if (processing) {
    return;
  }
  
  // Don't update if outputDir element is missing
  if (!outputDir) {
    console.warn('output-dir element not found in DOM');
    return;
  }
  
  if (!useCustomOutput || !useCustomOutput.checked) {
    // Generate default path: ~/pulp-image-results/YYYY-MM-DD_HH-mm-ss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    // Get resolved path from server
    try {
      const response = await fetch('/api/resolve-output-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          useDefault: true,
          timestamp: timestamp
        })
      });
      if (response.ok) {
        const data = await response.json();
        resolvedOutputPath = data.path;
        outputDir.value = data.path;
      } else {
        // Fallback to placeholder if server call fails
        const fallbackPath = `~/pulp-image-results/${timestamp}`;
        resolvedOutputPath = fallbackPath;
        outputDir.value = fallbackPath;
      }
    } catch (error) {
      // Fallback to placeholder if server call fails
      const fallbackPath = `~/pulp-image-results/${timestamp}`;
      resolvedOutputPath = fallbackPath;
      outputDir.value = fallbackPath;
    }
    openResultsFolderBtn.style.display = 'none'; // Will show after processing
  } else if (outputDir.value) {
    // Validate custom path exists
    await validateCustomOutputPath();
    // Store custom path
    resolvedOutputPath = outputDir.value;
  }
}

// Validate custom output directory
async function validateCustomOutputPath() {
  const customPath = outputDir.value.trim();
  if (!customPath) return;
  
  try {
    const response = await fetch('/api/validate-output-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: customPath })
    });
    if (response.ok) {
      const data = await response.json();
      if (!data.exists && !data.willCreate) {
        // Show friendly message
        const helper = document.getElementById('output-dir-helper');
        if (helper) {
          helper.textContent = 'Directory does not exist. It will be created.';
          helper.style.color = 'var(--text-secondary)';
        }
      } else {
        const helper = document.getElementById('output-dir-helper');
        if (helper) {
          helper.textContent = useCustomOutput.checked 
            ? 'Specify a custom output directory. Use ~ for home directory.'
            : 'Files will be saved in a new folder inside your home directory.';
        }
      }
    }
  } catch (error) {
    // Silently fail validation
  }
}

// Update Rename Preview
function updateRenamePreview() {
  if (!renamePreview) {
    return; // Element not found, skip silently
  }
  
  const pattern = renamePatternInput ? renamePatternInput.value.trim() : '';
  
  // Show placeholder if no pattern or no files
  if (!pattern) {
    renamePreview.style.display = 'none';
    return;
  }
  
  if (selectedFiles.length === 0) {
    renamePreview.textContent = 'Preview: (select files to see preview)';
    renamePreview.style.display = 'block';
    return;
  }
  
  // Get first file for preview
  const firstFile = selectedFiles[0];
  const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, '');
  
  // Get output extension - use format if set, otherwise keep original extension
  let ext = '';
  if (formatSelect && formatSelect.value) {
    ext = formatSelect.value;
  } else {
    const fileExt = firstFile.name.split('.').pop();
    ext = fileExt || 'png';
  }
  
  // Build preview using tokens
  let preview = pattern
    .replace(/{name}/g, nameWithoutExt)
    .replace(/{ext}/g, ext)
    .replace(/{index}/g, '1');
  
  // Ensure extension is included if pattern doesn't have one
  if (!preview.includes('.')) {
    preview += `.${ext}`;
  }
  
  renamePreview.textContent = `Preview (first file): ${preview}`;
  renamePreview.style.display = 'block';
}

// Update Suffix Preview
function updateSuffixPreview() {
  const suffix = suffixInput.value.trim();
  const autoSuffix = autoSuffixToggle.checked;
  const width = widthInput.value;
  const height = heightInput.value;
  const format = formatSelect.value;
  
  // Build preview filename
  let preview = 'example';
  
  // Auto suffix
  if (autoSuffix) {
    const suffixParts = [];
    if (width && height) {
      suffixParts.push(`${width}x${height}`);
    } else if (width) {
      suffixParts.push(`${width}w`);
    } else if (height) {
      suffixParts.push(`${height}h`);
    }
    if (suffixParts.length > 0) {
      preview += `-${suffixParts.join('-')}`;
    }
  }
  
  // Custom suffix
  if (suffix) {
    preview += `-${suffix}`;
  }
  
  // Extension
  const ext = format || 'png';
  preview += `.${ext}`;
  
  if (autoSuffix || suffix) {
    suffixPreview.textContent = `Preview: ${preview}`;
    suffixPreview.style.display = 'block';
  } else {
    suffixPreview.style.display = 'none';
  }
  
  if (autoSuffix) {
    autoSuffixPreview.textContent = `Auto suffix will add: ${width && height ? `${width}x${height}` : width ? `${width}w` : height ? `${height}h` : 'size'}`;
    autoSuffixPreview.style.display = 'block';
  } else {
    autoSuffixPreview.style.display = 'none';
  }
}

// Update UI State
async function updateUI() {
  updateFormatDependencies();
  updateSuffixPreview();
  updateRenamePreview();
  if (!useCustomOutput.checked && !processing) {
    await updateOutputDirectory();
  }
  validateForm();
}

// Validate Form
function validateForm() {
  const hasInput = selectedFiles.length > 0;
  const isValid = hasInput;
  
  processButton.disabled = !isValid || processing;
  
  return isValid;
}

// Handle Form Submit
async function handleSubmit(e) {
  e.preventDefault();
  
  // Prevent double submission
  if (processing) {
    console.warn('Processing already in progress');
    return;
  }
  
  // Validate files selected
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Error: Please select at least one image file to process.');
    return;
  }
  
  // Validate output directory before processing
  let outputPath = resolvedOutputPath || (outputDir ? outputDir.value : null);
  if (!outputPath || outputPath.trim() === '') {
    alert('Error: Output directory is not set. Please wait for the directory path to be resolved, or specify a custom output directory.');
    return;
  }
  
  // Validate form
  if (!validateForm()) {
    alert('Error: Please check your form inputs and try again.');
    return;
  }
  
  processing = true;
  if (processButton) {
    processButton.disabled = true;
    processButton.textContent = 'Processing...';
  }
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }
  
  try {
    // Use stored resolved path or current value
    // Expand ~ to home directory (will be done on server, but prepare it)
    if (outputPath.startsWith('~')) {
      outputPath = outputPath.replace('~', '');
    }
    
    const config = {
      width: widthInput.value ? parseInt(widthInput.value, 10) : null,
      height: heightInput.value ? parseInt(heightInput.value, 10) : null,
      format: formatSelect.value || null,
      out: outputPath,
      renamePattern: renamePatternInput.value.trim() || null,
      suffix: suffixInput.value.trim() || null,
      autoSuffix: autoSuffixToggle.checked,
      quality: qualitySlider.disabled ? null : parseInt(qualitySlider.value, 10),
      lossless: losslessToggle.checked,
      background: backgroundColor.value,
      alphaMode: document.querySelector('input[name="alpha-mode"]:checked').value,
      overwrite: overwriteCheckbox.checked,
      deleteOriginal: false, // Always false in UI mode - browser security prevents file deletion
      useDefaultOutput: !useCustomOutput.checked
    };
    
    // Prepare file data
    // Files are sent to server for local processing (no internet upload)
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    // Add config as JSON
    formData.append('config', JSON.stringify(config));
    
    const response = await fetch('/api/run', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      let errorMessage = 'Processing failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const results = await response.json();
    
    // Update output directory with resolved path
    if (results.outputPath) {
      if (outputDir) {
        outputDir.value = results.outputPath;
      }
      resolvedOutputPath = results.outputPath; // Keep it stable
      if (openResultsFolderBtn) {
        openResultsFolderBtn.style.display = 'inline-block';
      }
      if (openResultsFolderResultsBtn) {
        openResultsFolderResultsBtn.style.display = 'inline-block';
      }
    }
    
    displayResults(results);
    
  } catch (error) {
    console.error('Processing error:', error);
    // Show user-friendly error message
    const errorMsg = error.message || 'An unexpected error occurred during processing.';
    alert(`Error: ${errorMsg}`);
    
    // Show error in results section if available
    if (resultsSection && resultsContent) {
      resultsContent.innerHTML = `
        <div class="result-item error">
          <div class="result-item-header">
            <div class="result-item-title">Processing Failed</div>
            <div class="result-item-status error">Error</div>
          </div>
          <div class="result-item-details">
            <div class="result-detail">${escapeHtml(errorMsg)}</div>
          </div>
        </div>
      `;
      resultsSection.style.display = 'block';
    }
  } finally {
    processing = false;
    if (processButton) {
      processButton.disabled = false;
      processButton.textContent = 'Process Images';
    }
    // Do NOT reset resolvedOutputPath here - keep it stable for subsequent runs
  }
}

// Display Results
function displayResults(results) {
  resultsContent.innerHTML = '';
  
  // Per-file results
  if (results.processed && results.processed.length > 0) {
    results.processed.forEach(result => {
      const item = createResultItem(result, 'success');
      resultsContent.appendChild(item);
    });
  }
  
  if (results.skipped && results.skipped.length > 0) {
    results.skipped.forEach(skipped => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <div class="result-item-header">
          <div class="result-item-title">${escapeHtml(skipped.filePath)}</div>
          <div class="result-item-status">Skipped</div>
        </div>
        <div class="result-item-details">
          <div class="result-detail">Reason: ${escapeHtml(skipped.reason)}</div>
        </div>
      `;
      resultsContent.appendChild(item);
    });
  }
  
  if (results.failed && results.failed.length > 0) {
    results.failed.forEach(failed => {
      const item = document.createElement('div');
      item.className = 'result-item error';
      item.innerHTML = `
        <div class="result-item-header">
          <div class="result-item-title">${escapeHtml(failed.filePath)}</div>
          <div class="result-item-status error">Failed</div>
        </div>
        <div class="result-item-details">
          <div class="result-detail">Error: ${escapeHtml(failed.error)}</div>
        </div>
      `;
      resultsContent.appendChild(item);
    });
  }
  
  // Summary
  if (results.totals) {
    const summary = createSummary(results.totals);
    resultsContent.appendChild(summary);
  }
  
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Create Result Item
function createResultItem(result, status) {
  const item = document.createElement('div');
  item.className = `result-item ${status}`;
  
  const originalSize = formatBytes(result.originalSize);
  const finalSize = formatBytes(result.finalSize);
  const saved = formatBytes(result.bytesSaved);
  const percent = result.percentSaved.toFixed(2);
  
  item.innerHTML = `
    <div class="result-item-header">
      <div class="result-item-title">${escapeHtml(result.outputPath)}</div>
      <div class="result-item-status ${status}">Processed</div>
    </div>
    <div class="result-item-details">
      <div class="result-detail">
        <strong>Original:</strong> ${originalSize} (${result.metadata.width}×${result.metadata.height})
      </div>
      <div class="result-detail">
        <strong>Final:</strong> ${finalSize}
      </div>
      <div class="result-detail">
        <strong>Saved:</strong> ${saved} (${percent}%)
      </div>
    </div>
  `;
  
  return item;
}

// Create Summary
function createSummary(totals) {
  const summary = document.createElement('div');
  summary.className = 'result-summary';
  
  const totalOriginal = formatBytes(totals.totalOriginal);
  const totalFinal = formatBytes(totals.totalFinal);
  const totalSaved = formatBytes(totals.totalSaved);
  const percentSaved = totals.percentSaved.toFixed(2);
  
  summary.innerHTML = `
    <h3 class="result-summary-title">Summary</h3>
    <div class="result-summary-stats">
      <div class="summary-stat">
        <div class="summary-stat-value">${totals.processedCount}</div>
        <div class="summary-stat-label">Files Processed</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-value">${totalOriginal}</div>
        <div class="summary-stat-label">Total Original Size</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-value">${totalFinal}</div>
        <div class="summary-stat-label">Total Final Size</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-value">${totalSaved}</div>
        <div class="summary-stat-label">Total Saved (${percentSaved}%)</div>
      </div>
      ${totals.skippedCount > 0 ? `
      <div class="summary-stat">
        <div class="summary-stat-value">${totals.skippedCount}</div>
        <div class="summary-stat-label">Files Skipped</div>
      </div>
      ` : ''}
      ${totals.failedCount > 0 ? `
      <div class="summary-stat">
        <div class="summary-stat-value">${totals.failedCount}</div>
        <div class="summary-stat-label">Files Failed</div>
      </div>
      ` : ''}
    </div>
  `;
  
  return summary;
}

// Format Bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Reset Form
function resetForm() {
  form.reset();
  selectedFiles = [];
  inputSourceFiles.value = '';
  inputSourceFolder.value = '';
  qualityValue.textContent = '80';
  qualitySlider.value = '80';
  backgroundText.value = '#ffffff';
  backgroundColor.value = '#ffffff';
  useCustomOutput.checked = false;
  outputDir.readOnly = true;
  outputDir.style.background = '';
  openResultsFolderBtn.style.display = 'none';
  if (openResultsFolderResultsBtn) {
    openResultsFolderResultsBtn.style.display = 'none';
  }
  updateUI().catch(console.error);
  resultsSection.style.display = 'none';
}

