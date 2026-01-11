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
let ignoredFiles = []; // Store ignored non-image files
let ignoredFilesCount = 0; // Track ignored non-image files
let showIgnoredFiles = false; // Toggle state for showing ignored files
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
const toggleIgnoredFilesBtn = document.getElementById('toggle-ignored-files');
const ignoredFilesList = document.getElementById('ignored-files-list');
const renamePreview = document.getElementById('rename-preview');
const suffixPreview = document.getElementById('suffix-preview');
const autoSuffixPreview = document.getElementById('auto-suffix-preview');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const inputHelper = document.getElementById('input-helper');
const outputDirHelper = document.getElementById('output-dir-helper');
const openResultsFolderHelper = document.getElementById('open-results-folder-helper');
const openResultsFolderResultsHelper = document.getElementById('open-results-folder-results-helper');
const openResultsFolderFallback = document.getElementById('open-results-folder-fallback');
const openResultsFolderResultsFallback = document.getElementById('open-results-folder-results-fallback');

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
    ignoredFiles = Array.from(allFiles).filter(file => !selectedFiles.includes(file));
    ignoredFilesCount = ignoredFiles.length;
    if (ignoredFilesCount > 0) {
      console.log(`Ignored ${ignoredFilesCount} non-image file(s)`);
    }
    updateInputPreview();
    updateUI().catch(console.error);
  });
  
  // Folder input
  inputSourceFolder.addEventListener('change', (e) => {
    const allFiles = Array.from(e.target.files);
    selectedFiles = filterImageFiles(allFiles);
    ignoredFiles = Array.from(allFiles).filter(file => !selectedFiles.includes(file));
    ignoredFilesCount = ignoredFiles.length;
    if (ignoredFilesCount > 0) {
      console.log(`Ignored ${ignoredFilesCount} non-image file(s)`);
    }
    updateInputPreview();
    updateUI().catch(console.error);
  });
  
  // Toggle ignored files
  if (toggleIgnoredFilesBtn) {
    toggleIgnoredFilesBtn.addEventListener('click', () => {
      showIgnoredFiles = !showIgnoredFiles;
      updateInputPreview();
    });
  }
  
  // Custom output directory toggle
  useCustomOutput.addEventListener('change', async () => {
    if (useCustomOutput.checked) {
      outputDir.readOnly = false;
      outputDir.style.background = 'white';
      outputDirHelper.textContent = 'Use ~ as a shortcut for your home folder (e.g., ~/my-images), or enter a full path.';
      await validateCustomOutputPath();
    } else {
      outputDir.readOnly = true;
      outputDir.style.background = '';
      await updateOutputDirectory();
      outputDirHelper.textContent = 'Files will be saved in a new folder inside your home directory.';
    }
  });
  
  // Validate custom output path on input and update resolvedOutputPath
  outputDir.addEventListener('blur', async () => {
    if (useCustomOutput.checked) {
      await validateCustomOutputPath();
      // Update resolvedOutputPath with the custom value
      resolvedOutputPath = outputDir.value;
    }
  });
  
  // Open results folder button (near output directory) - with null check
  if (openResultsFolderBtn) {
    openResultsFolderBtn.addEventListener('click', async (e) => {
      // Prevent clicks when disabled
      if (e.target.disabled === true) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const outputPath = outputDir ? outputDir.value : null;
      if (outputPath) {
        await openResultsFolder(outputPath, 'output');
      }
    });
  } else {
    console.warn('open-results-folder button not found in DOM');
  }
  
  // Open results folder button (near results) - with null check
  if (openResultsFolderResultsBtn) {
    openResultsFolderResultsBtn.addEventListener('click', async (e) => {
      // Prevent clicks when disabled
      if (e.target.disabled === true) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const outputPath = outputDir ? outputDir.value : null;
      if (outputPath) {
        await openResultsFolder(outputPath, 'results');
      }
    });
  } else {
    console.warn('open-results-folder-results button not found in DOM');
  }
  
  // Helper function to open results folder
  async function openResultsFolder(path, buttonLocation = 'output') {
    // Hide any previous fallback messages
    if (openResultsFolderFallback) {
      openResultsFolderFallback.style.display = 'none';
    }
    if (openResultsFolderResultsFallback) {
      openResultsFolderResultsFallback.style.display = 'none';
    }
    
    try {
      const response = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Show friendly fallback message with path
        const fallbackElement = buttonLocation === 'results' ? openResultsFolderResultsFallback : openResultsFolderFallback;
        const messageElement = fallbackElement?.querySelector('.folder-open-fallback-message');
        const pathElement = fallbackElement?.querySelector('.folder-open-fallback-path');
        
        if (fallbackElement && messageElement && pathElement) {
          messageElement.textContent = 'We couldn\'t open the results folder automatically on this system.\nYou can open it manually using the path below.';
          pathElement.textContent = errorData.path || path || 'Path not available';
          fallbackElement.style.display = 'block';
        }
        return; // Don't throw - this is expected behavior
      }
      
      // Success - ensure fallback is hidden
      if (openResultsFolderFallback) {
        openResultsFolderFallback.style.display = 'none';
      }
      if (openResultsFolderResultsFallback) {
        openResultsFolderResultsFallback.style.display = 'none';
      }
    } catch (error) {
      // Network or other errors - show fallback with path
      const fallbackElement = buttonLocation === 'results' ? openResultsFolderResultsFallback : openResultsFolderFallback;
      const messageElement = fallbackElement?.querySelector('.folder-open-fallback-message');
      const pathElement = fallbackElement?.querySelector('.folder-open-fallback-path');
      
      if (fallbackElement && messageElement && pathElement) {
        messageElement.textContent = 'We couldn\'t open the results folder automatically on this system.\nYou can open it manually using the path below.';
        pathElement.textContent = path || 'Path not available';
        fallbackElement.style.display = 'block';
      }
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
  if (selectedFiles.length === 0 && ignoredFilesCount === 0) {
    fileListSummary.textContent = 'No files selected';
    toggleFileListBtn.style.display = 'none';
    fileListDetail.style.display = 'none';
    if (toggleIgnoredFilesBtn) toggleIgnoredFilesBtn.style.display = 'none';
    if (ignoredFilesList) ignoredFilesList.style.display = 'none';
    return;
  }
  
  // Update summary - show filtered count and ignored count if any
  const filteredCount = selectedFiles.length;
  let summaryText = `${filteredCount} image file${filteredCount === 1 ? '' : 's'} selected`;
  if (ignoredFilesCount > 0) {
    summaryText += ` (${ignoredFilesCount} non-image ${ignoredFilesCount === 1 ? 'file' : 'files'} ignored)`;
  }
  fileListSummary.textContent = summaryText;
  
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
  
  // Update ignored files section
  if (ignoredFilesCount > 0 && toggleIgnoredFilesBtn && ignoredFilesList) {
    toggleIgnoredFilesBtn.style.display = 'inline-block';
    toggleIgnoredFilesBtn.textContent = showIgnoredFiles ? 'Hide ignored files' : 'Show ignored files';
    
    if (showIgnoredFiles) {
      ignoredFilesList.style.display = 'block';
      ignoredFilesList.innerHTML = '';
      ignoredFiles.forEach((file) => {
        const item = document.createElement('div');
        item.className = 'file-list-item ignored-file';
        item.innerHTML = `
          <span class="file-list-item-name">${escapeHtml(file.name)}</span>
          <span class="file-list-item-badge">Ignored</span>
        `;
        ignoredFilesList.appendChild(item);
      });
    } else {
      ignoredFilesList.style.display = 'none';
    }
  } else {
    if (toggleIgnoredFilesBtn) toggleIgnoredFilesBtn.style.display = 'none';
    if (ignoredFilesList) ignoredFilesList.style.display = 'none';
  }
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
            ? 'Use ~ as a shortcut for your home folder (e.g., ~/my-images), or enter a full path.'
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
  
  // Prevent submission if button is disabled
  if (processButton && processButton.disabled === true) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  
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
  // When custom output is enabled, always use the current input value
  let outputPath;
  if (useCustomOutput && useCustomOutput.checked) {
    outputPath = outputDir ? outputDir.value : null;
  } else {
    outputPath = resolvedOutputPath || (outputDir ? outputDir.value : null);
  }
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
    // Note: ~ expansion is handled by the server
    
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
    // Only update if NOT using custom output (to preserve user's custom path)
    if (results.outputPath && !useCustomOutput.checked) {
      if (outputDir) {
        outputDir.value = results.outputPath;
      }
      resolvedOutputPath = results.outputPath; // Keep it stable
    }
    
    displayResults(results);
    
    // Hide any fallback messages from previous attempts
    if (openResultsFolderFallback) {
      openResultsFolderFallback.style.display = 'none';
    }
    if (openResultsFolderResultsFallback) {
      openResultsFolderResultsFallback.style.display = 'none';
    }
    
    // Enable/disable "Open results folder" buttons based on whether any files were processed
    const hasProcessedFiles = results.processed && results.processed.length > 0;
    const explanationText = 'No output files were created.\nFix the errors above and process again to enable this action.';
    
    if (openResultsFolderBtn) {
      if (hasProcessedFiles) {
        openResultsFolderBtn.style.display = 'inline-block';
        openResultsFolderBtn.disabled = false;
        if (openResultsFolderHelper) {
          openResultsFolderHelper.style.display = 'none';
        }
      } else {
        openResultsFolderBtn.style.display = 'inline-block';
        openResultsFolderBtn.disabled = true;
        if (openResultsFolderHelper) {
          openResultsFolderHelper.textContent = explanationText;
          openResultsFolderHelper.style.display = 'block';
        }
      }
    }
    if (openResultsFolderResultsBtn) {
      if (hasProcessedFiles) {
        openResultsFolderResultsBtn.style.display = 'inline-block';
        openResultsFolderResultsBtn.disabled = false;
        if (openResultsFolderResultsHelper) {
          openResultsFolderResultsHelper.style.display = 'none';
        }
      } else {
        openResultsFolderResultsBtn.style.display = 'inline-block';
        openResultsFolderResultsBtn.disabled = true;
        if (openResultsFolderResultsHelper) {
          openResultsFolderResultsHelper.textContent = explanationText;
          openResultsFolderResultsHelper.style.display = 'block';
        }
      }
    }
    
  } catch (error) {
    console.error('Processing error:', error);
    // Sanitize error message for UI
    const rawError = error.message || 'An unexpected error occurred during processing.';
    const sanitizedError = sanitizeErrorMessage(rawError);
    alert(`Error: ${sanitizedError}`);
    
    // Show error in results section if available
    if (resultsSection && resultsContent) {
      resultsContent.innerHTML = `
        <div class="result-item error">
          <div class="result-item-header">
            <div class="result-item-title">Processing Failed</div>
            <div class="result-item-status error">Error</div>
          </div>
          <div class="result-item-details">
            <div class="result-detail">${escapeHtml(sanitizedError)}</div>
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
      const fileName = extractFileName(skipped.filePath);
      const sanitizedReason = sanitizeErrorMessage(skipped.reason);
      item.innerHTML = `
        <div class="result-item-header">
          <div class="result-item-title">${escapeHtml(fileName)}</div>
          <div class="result-item-status">Skipped</div>
        </div>
        <div class="result-item-details">
          <div class="result-detail">${escapeHtml(sanitizedReason)}</div>
        </div>
      `;
      resultsContent.appendChild(item);
    });
  }
  
  if (results.failed && results.failed.length > 0) {
    results.failed.forEach(failed => {
      const item = document.createElement('div');
      item.className = 'result-item error';
      // Sanitize error message and file path
      const sanitizedError = sanitizeErrorMessage(failed.error);
      const fileName = extractFileName(failed.filePath);
      item.innerHTML = `
        <div class="result-item-header">
          <div class="result-item-title">${escapeHtml(fileName)}</div>
          <div class="result-item-status error">Failed</div>
        </div>
        <div class="result-item-details">
          <div class="result-detail">${escapeHtml(sanitizedError)}</div>
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
      <div class="result-item-title">${escapeHtml(extractFileName(result.outputPath))}</div>
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

// Sanitize error messages for UI display
function sanitizeErrorMessage(errorMsg) {
  if (!errorMsg) return 'An error occurred.';
  
  let sanitized = errorMsg;
  
  // Remove temp paths
  sanitized = sanitized.replace(/\/tmp\/[^\s]+/g, '');
  sanitized = sanitized.replace(/[^\s]*pulp-image-[^\s]+/g, '');
  
  // Remove CLI flags and technical jargon
  sanitized = sanitized.replace(/--[a-z-]+/g, '');
  sanitized = sanitized.replace(/Use --alpha-mode flatten/g, '');
  sanitized = sanitized.replace(/Use --overwrite/g, '');
  
  // Transform common error messages to user-friendly versions
  if (sanitized.includes('transparency') && sanitized.includes('does not support')) {
    const formatMatch = sanitized.match(/format (\w+)/i);
    const format = formatMatch ? formatMatch[1].toUpperCase() : 'this format';
    return `This image contains transparency, but ${format} does not support transparency.\n\nChoose a format like PNG or WebP, or enable background flattening.`;
  }
  
  if (sanitized.includes('already exists')) {
    return 'This file already exists. Enable "Overwrite Existing Files" to replace it.';
  }
  
  if (sanitized.includes('Input and output paths are the same')) {
    return 'Input and output are the same file. Enable "Overwrite Existing Files" to process in place.';
  }
  
  if (sanitized.includes('Input file not found')) {
    return 'The selected file could not be found. Please select the file again.';
  }
  
  if (sanitized.includes('Unsupported output format')) {
    return 'The selected output format is not supported. Please choose PNG, JPG, WebP, or AVIF.';
  }
  
  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // If message is too technical or empty, provide generic message
  if (sanitized.length === 0 || sanitized.includes('Error:') || sanitized.includes('at ')) {
    return 'An error occurred while processing this image. Please check the image file and try again.';
  }
  
  return sanitized;
}

// Extract just the filename from a path
function extractFileName(filePath) {
  if (!filePath) return 'Unknown file';
  // Remove temp paths
  if (filePath.includes('/tmp/') || filePath.includes('pulp-image-')) {
    // Try to extract original filename from path
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'File';
  }
  // Return just the filename
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

// Reset Form
function resetForm() {
  form.reset();
  selectedFiles = [];
  ignoredFiles = [];
  ignoredFilesCount = 0;
  showIgnoredFiles = false;
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
  openResultsFolderBtn.disabled = true;
  if (openResultsFolderHelper) {
    openResultsFolderHelper.style.display = 'none';
  }
  if (openResultsFolderFallback) {
    openResultsFolderFallback.style.display = 'none';
  }
  if (openResultsFolderResultsBtn) {
    openResultsFolderResultsBtn.style.display = 'none';
    openResultsFolderResultsBtn.disabled = true;
  }
  if (openResultsFolderResultsHelper) {
    openResultsFolderResultsHelper.style.display = 'none';
  }
  if (openResultsFolderResultsFallback) {
    openResultsFolderResultsFallback.style.display = 'none';
  }
  updateUI().catch(console.error);
  resultsSection.style.display = 'none';
}


// Terminal Example Copy Functionality
function setupTerminalCopyButtons() {
  document.querySelectorAll('.terminal-example-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const body = btn.closest('.terminal-example-body');
      const textToCopy = body?.dataset.copy;
      
      if (!textToCopy) return;
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        
        // Show success state
        const copyIcon = btn.querySelector('.copy-icon');
        const checkIcon = btn.querySelector('.check-icon');
        
        if (copyIcon && checkIcon) {
          copyIcon.style.display = 'none';
          checkIcon.style.display = 'block';
          
          setTimeout(() => {
            copyIcon.style.display = 'block';
            checkIcon.style.display = 'none';
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });
}

// Back to Top Button (works for all tabs)
function setupBackToTop() {
  const backToTop = document.getElementById('back-to-top');
  if (!backToTop) return;
  
  // Show/hide based on scroll position
  window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 300 ? 'flex' : 'none';
  });
  
  // Click handler
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Help Sub-Navigation
function setupHelpSubnav() {
  const subnav = document.getElementById('help-subnav');
  if (!subnav) return;
  
  const links = subnav.querySelectorAll('.help-subnav-link');
  const helpTab = document.getElementById('help-tab');
  
  // Set first link as active initially
  if (links.length > 0) {
    links[0].classList.add('active');
  }
  
  // Flag to temporarily disable scroll-based updates after click
  let isClickScrolling = false;
  
  // Navigation links - smooth scroll
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        // Set active immediately on click
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Disable scroll-based updates during animation
        isClickScrolling = true;
        
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Re-enable scroll updates after animation completes
        setTimeout(() => {
          isClickScrolling = false;
        }, 800);
      }
    });
  });
  
  // Track scroll position to update active nav link
  function updateActiveOnScroll() {
    // Skip if we're in the middle of a click-triggered scroll
    if (isClickScrolling) return;
    
    // Only track when help tab is visible
    if (!helpTab || !helpTab.classList.contains('active')) return;
    
    // Update active nav link based on scroll position
    let currentSection = '';
    const scrollOffset = 80; // Smaller offset for more accurate detection
    
    links.forEach(link => {
      const targetId = link.getAttribute('href').slice(1);
      const section = document.getElementById(targetId);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= scrollOffset) {
          currentSection = targetId;
        }
      }
    });
    
    // Update active class
    if (currentSection) {
      links.forEach(link => {
        const targetId = link.getAttribute('href').slice(1);
        link.classList.toggle('active', targetId === currentSection);
      });
    }
  }
  
  // Listen to window scroll
  window.addEventListener('scroll', updateActiveOnScroll);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupTerminalCopyButtons();
  setupBackToTop();
  setupHelpSubnav();
});
