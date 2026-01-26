// Pulp Image UI v0.2.0 - Redesigned

// ============================================
// STATE
// ============================================

let selectedFiles = [];
let ignoredFiles = [];
let processing = false;
let resolvedOutputPath = null;

// Format information
const FORMAT_INFO = {
  png: { name: 'PNG', supportsLossless: true, supportsQuality: false, defaultQuality: null, supportsTransparency: true },
  jpg: { name: 'JPG', supportsLossless: false, supportsQuality: true, defaultQuality: 80, supportsTransparency: false },
  webp: { name: 'WebP', supportsLossless: true, supportsQuality: true, defaultQuality: 80, supportsTransparency: true },
  avif: { name: 'AVIF', supportsLossless: true, supportsQuality: true, defaultQuality: 50, supportsTransparency: true }
};

const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'avif'];

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
  // Theme
  themeToggle: document.getElementById('theme-toggle'),
  
  // Form
  form: document.getElementById('process-form'),
  processBtn: document.getElementById('process-btn'),
  resetBtn: document.getElementById('reset-btn'),
  
  // Drop Zone
  dropZone: document.getElementById('drop-zone'),
  inputFiles: document.getElementById('input-files'),
  inputFolder: document.getElementById('input-folder'),
  fileListPreview: document.getElementById('file-list-preview'),
  fileCount: document.getElementById('file-count'),
  toggleFileList: document.getElementById('toggle-file-list'),
  fileListItems: document.getElementById('file-list-items'),
  
  // Output
  outputDir: document.getElementById('output-dir'),
  useCustomOutput: document.getElementById('use-custom-output'),
  renamePattern: document.getElementById('rename-pattern'),
  renamePreview: document.getElementById('rename-preview'),
  autoSuffix: document.getElementById('auto-suffix'),
  overwrite: document.getElementById('overwrite'),
  
  // Format
  format: document.getElementById('format'),
  quality: document.getElementById('quality'),
  qualityValue: document.getElementById('quality-value'),
  qualityHelper: document.getElementById('quality-helper'),
  lossless: document.getElementById('lossless'),
  
  // Resize
  width: document.getElementById('width'),
  height: document.getElementById('height'),
  
  // Transparency
  backgroundColor: document.getElementById('background-color'),
  backgroundHex: document.getElementById('background-hex'),
  
  // Results
  resultsPanel: document.getElementById('results-panel'),
  resultsContent: document.getElementById('results-content'),
  openResultsFolder: document.getElementById('open-results-folder'),
  
  // Version
  version: document.getElementById('version'),
  updateBanner: document.getElementById('update-banner')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initTooltips();
  initBackToTop();
  initSidebar();
  initSections();
  initSectionFocus();
  initInputMode();
  initFileInputs();
  initDropZone();
  initForm();
  await loadVersion();
  await updateOutputDirectory();
  checkForUpdates();
});

// ============================================
// BACK TO TOP
// ============================================

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  
  const showThreshold = 300;
  
  const updateVisibility = () => {
    if (window.scrollY > showThreshold) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };
  
  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
  
  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ============================================
// TOOLTIPS
// ============================================

function initTooltips() {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  
  const tooltipElements = document.querySelectorAll('[data-tip]');
  
  tooltipElements.forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const text = el.getAttribute('data-tip');
      if (!text) return;
      
      tooltip.textContent = text;
      tooltip.classList.remove('arrow-left', 'arrow-up');
      
      // Position tooltip to the right of the element
      const rect = el.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // Show to the right with arrow pointing left
      let left = rect.right + 12;
      let top = rect.top + (rect.height / 2) - 20;
      
      // Check if tooltip would go off screen to the right
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.classList.add('arrow-left');
      tooltip.classList.add('visible');
    });
    
    el.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
}

// ============================================
// THEME (Dark Mode)
// ============================================

function initTheme() {
  const savedTheme = localStorage.getItem('pulp-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  
  elements.themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pulp-theme', newTheme);
  });
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

function initSidebar() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
  
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      const sectionId = link.dataset.section;
      const section = document.getElementById(`section-${sectionId}`);
      
      if (section && !link.disabled) {
        // Update active state
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Expand section if collapsible
        if (!section.classList.contains('always-open')) {
          section.classList.add('expanded');
        }
        
        // Highlight the card
        highlightSection(section);
        
        // Scroll to section with offset for header
        const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        
        window.scrollTo({
          top: sectionTop - headerHeight - 16,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// SECTION FOCUS (Highlight when interacting)
// ============================================

function initSectionFocus() {
  const sections = document.querySelectorAll('.section-card');
  
  sections.forEach(section => {
    // Track focus within section
    section.addEventListener('focusin', () => {
      highlightSection(section);
    });
    
    // Track clicks within section body
    const body = section.querySelector('.section-body');
    if (body) {
      body.addEventListener('click', () => {
        highlightSection(section);
      });
    }
  });
}

function highlightSection(section) {
  // Remove highlight from all sections
  document.querySelectorAll('.section-card').forEach(s => {
    s.classList.remove('focused');
  });
  
  // Add highlight to this section (if not the always-open one)
  if (!section.classList.contains('always-open')) {
    section.classList.add('focused');
    
    // Update sidebar active state
    const sectionId = section.id.replace('section-', '');
    updateSidebarActive(sectionId);
  }
}

// ============================================
// COLLAPSIBLE SECTIONS
// ============================================

function initSections() {
  const sectionHeaders = document.querySelectorAll('.section-header:not(.no-collapse)');
  
  sectionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.section-card');
      if (!section.classList.contains('always-open')) {
        const wasExpanded = section.classList.contains('expanded');
        section.classList.toggle('expanded');
        
        // If expanding, highlight the card, sidebar nav item, and scroll into view
        if (!wasExpanded) {
          // Highlight this card (removes highlight from others)
          highlightSection(section);
          
          const sectionId = section.id.replace('section-', '');
          
          // Update sidebar immediately
          updateSidebarActive(sectionId);
          
          // Scroll section into view after a brief delay for the expand animation
          setTimeout(() => {
            scrollSectionIntoView(section);
          }, 100);
        } else {
          // Collapsing - remove highlight from this card
          section.classList.remove('focused');
        }
      }
    });
  });
}

function scrollSectionIntoView(section) {
  const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
  const actionBarHeight = 68;
  const padding = 16;
  
  // Wait a frame for the section to fully expand
  requestAnimationFrame(() => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - headerHeight - actionBarHeight - padding * 2;
    
    // Check if the whole section fits in the viewport
    if (rect.height <= availableHeight) {
      // Section fits - make sure it's fully visible
      if (rect.top < headerHeight + padding) {
        // Top is cut off - scroll to show from top
        window.scrollBy({
          top: rect.top - headerHeight - padding,
          behavior: 'smooth'
        });
      } else if (rect.bottom > viewportHeight - actionBarHeight - padding) {
        // Bottom is cut off - scroll to show the whole section
        const scrollAmount = rect.bottom - (viewportHeight - actionBarHeight - padding);
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    } else {
      // Section is taller than viewport - scroll to show the top
      if (rect.top < headerHeight + padding || rect.top > headerHeight + 100) {
        window.scrollBy({
          top: rect.top - headerHeight - padding,
          behavior: 'smooth'
        });
      }
    }
  });
}

function updateSidebarActive(sectionId) {
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
  sidebarLinks.forEach(link => {
    if (link.dataset.section === sectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============================================
// INPUT MODE (Files/Folder)
// ============================================

function initInputMode() {
  const modeButtons = document.querySelectorAll('.input-mode-btn');
  const privacyNotice = document.getElementById('folder-privacy-notice');
  
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      
      // Update button states
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide inputs and privacy notice
      if (mode === 'files') {
        elements.inputFiles?.classList.remove('hidden');
        elements.inputFolder?.classList.add('hidden');
        privacyNotice?.classList.add('hidden');
        updateDropZoneText('files');
      } else {
        elements.inputFiles?.classList.add('hidden');
        elements.inputFolder?.classList.remove('hidden');
        privacyNotice?.classList.remove('hidden');
        updateDropZoneText('folder');
      }
      
      // Clear selection
      selectedFiles = [];
      ignoredFiles = [];
      if (elements.inputFiles) elements.inputFiles.value = '';
      if (elements.inputFolder) elements.inputFolder.value = '';
      updateFileListPreview();
      updateProcessButton();
    });
  });
}

function updateDropZoneText(mode) {
  const textEl = document.getElementById('drop-zone-text');
  const hintEl = document.getElementById('drop-zone-hint');
  
  if (mode === 'folder') {
    if (textEl) textEl.innerHTML = '<strong>Click to select a folder</strong>';
    if (hintEl) hintEl.textContent = 'All images in the folder will be processed';
  } else {
    if (textEl) textEl.innerHTML = '<strong>Drop images here</strong> or click to browse';
    if (hintEl) hintEl.textContent = 'Supports PNG, JPG, WebP, AVIF';
  }
}

function initFileInputs() {
  // File input change handlers
  elements.inputFiles?.addEventListener('change', handleFileSelect);
  elements.inputFolder?.addEventListener('change', handleFileSelect);
  
  // Toggle file list
  elements.toggleFileList?.addEventListener('click', () => {
    const items = elements.fileListItems;
    const isExpanded = items?.classList.contains('expanded');
    items?.classList.toggle('expanded');
    if (elements.toggleFileList) {
      elements.toggleFileList.textContent = isExpanded ? 'Show files' : 'Hide files';
    }
  });
}

// ============================================
// DROP ZONE
// ============================================

function initDropZone() {
  const dropZone = elements.dropZone;
  if (!dropZone) return;
  
  // Drag events
  ['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isFolderMode = elements.inputFolder && !elements.inputFolder.classList.contains('hidden');
      // Only show drag feedback in files mode (folder mode requires click)
      if (!isFolderMode) {
        dropZone.classList.add('drag-over');
      }
    });
  });
  
  ['dragleave'].forEach(event => {
    dropZone.addEventListener(event, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });
  
  // Handle drop
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    
    const isFolderMode = elements.inputFolder && !elements.inputFolder.classList.contains('hidden');
    
    // In folder mode, don't handle drops (user must click to select folder via browser dialog)
    if (isFolderMode) {
      return;
    }
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processDroppedFiles(Array.from(files));
    }
  });
}

function processDroppedFiles(files) {
  selectedFiles = files.filter(file => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext && SUPPORTED_EXTENSIONS.includes(ext);
  });
  
  ignoredFiles = files.filter(file => !selectedFiles.includes(file));
  
  updateFileListPreview();
  updateProcessButton();
}

function handleFileSelect(e) {
  const allFiles = Array.from(e.target.files);
  
  selectedFiles = allFiles.filter(file => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext && SUPPORTED_EXTENSIONS.includes(ext);
  });
  
  ignoredFiles = allFiles.filter(file => !selectedFiles.includes(file));
  
  updateFileListPreview();
  updateProcessButton();
}

function updateFileListPreview() {
  if (selectedFiles.length === 0) {
    elements.fileListPreview?.classList.add('hidden');
    return;
  }
  
  elements.fileListPreview?.classList.remove('hidden');
  
  // Update count
  let countText = `${selectedFiles.length} image${selectedFiles.length === 1 ? '' : 's'} selected`;
  if (ignoredFiles.length > 0) {
    countText += ` (${ignoredFiles.length} ignored)`;
  }
  if (elements.fileCount) elements.fileCount.textContent = countText;
  
  // Build file list
  if (elements.fileListItems) {
    elements.fileListItems.innerHTML = selectedFiles.map(file => `
      <div class="file-list-item">
        <span class="file-list-name">${escapeHtml(file.name)}</span>
        <span class="file-list-size">${formatBytes(file.size)}</span>
      </div>
    `).join('');
  }
  
  // Update rename preview
  updateRenamePreview();
}

// ============================================
// FORM HANDLING
// ============================================

function initForm() {
  // Custom output toggle
  elements.useCustomOutput?.addEventListener('change', async () => {
    if (elements.useCustomOutput.checked) {
      if (elements.outputDir) {
        elements.outputDir.readOnly = false;
        elements.outputDir.placeholder = '~/my-images or /full/path';
      }
    } else {
      if (elements.outputDir) {
        elements.outputDir.readOnly = true;
      }
      await updateOutputDirectory();
    }
  });
  
  // Format change
  elements.format?.addEventListener('change', () => {
    updateFormatDependencies();
    updateRenamePreview();
  });
  
  // Quality slider
  elements.quality?.addEventListener('input', () => {
    if (elements.qualityValue) {
      elements.qualityValue.textContent = elements.quality.value;
    }
  });
  
  // Lossless toggle
  elements.lossless?.addEventListener('change', updateFormatDependencies);
  
  // Rename pattern
  elements.renamePattern?.addEventListener('input', updateRenamePreview);
  
  // Color picker sync
  elements.backgroundColor?.addEventListener('input', () => {
    if (elements.backgroundHex) {
      elements.backgroundHex.value = elements.backgroundColor.value;
    }
  });
  
  // Form submit
  elements.form?.addEventListener('submit', handleSubmit);
  
  // Reset button
  elements.resetBtn?.addEventListener('click', resetForm);
  
  // Open results folder
  elements.openResultsFolder?.addEventListener('click', () => {
    const path = elements.outputDir?.value;
    if (path) openFolder(path);
  });
}

function updateFormatDependencies() {
  const format = elements.format?.value;
  const formatInfo = format ? FORMAT_INFO[format] : null;
  const isLossless = elements.lossless?.checked;
  
  if (formatInfo) {
    // Quality slider
    if (elements.quality) {
      elements.quality.disabled = !formatInfo.supportsQuality || isLossless;
    }
    
    // Lossless toggle
    if (elements.lossless) {
      elements.lossless.disabled = !formatInfo.supportsLossless;
      if (!formatInfo.supportsLossless) {
        elements.lossless.checked = false;
      }
    }
    
    // Update helper
    if (elements.qualityHelper) {
      if (isLossless && formatInfo.supportsLossless) {
        elements.qualityHelper.textContent = 'Quality disabled in lossless mode.';
      } else if (formatInfo.supportsQuality) {
        elements.qualityHelper.textContent = `Lower = smaller file, less quality. Higher = larger file, better quality. Default for ${formatInfo.name}: ${formatInfo.defaultQuality}.`;
      } else {
        elements.qualityHelper.textContent = `${formatInfo.name} is always lossless, quality setting does not apply.`;
      }
    }
  } else {
    if (elements.quality) elements.quality.disabled = false;
    if (elements.lossless) elements.lossless.disabled = false;
    if (elements.qualityHelper) {
      elements.qualityHelper.textContent = 'Lower = smaller file, less quality. Higher = larger file, better quality. For JPG, WebP, AVIF.';
    }
  }
}

function updateRenamePreview() {
  const pattern = elements.renamePattern?.value.trim();
  
  if (!pattern || selectedFiles.length === 0) {
    if (elements.renamePreview) elements.renamePreview.textContent = '';
    return;
  }
  
  const firstFile = selectedFiles[0];
  const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, '');
  const format = elements.format?.value;
  const ext = format || firstFile.name.split('.').pop() || 'png';
  
  let preview = pattern
    .replace(/{name}/g, nameWithoutExt)
    .replace(/{ext}/g, ext)
    .replace(/{index}/g, '1');
  
  if (!preview.includes('.')) {
    preview += `.${ext}`;
  }
  
  if (elements.renamePreview) {
    elements.renamePreview.textContent = `Preview: ${preview}`;
  }
}

function updateProcessButton() {
  if (elements.processBtn) {
    elements.processBtn.disabled = selectedFiles.length === 0 || processing;
  }
}

// ============================================
// OUTPUT DIRECTORY
// ============================================

async function updateOutputDirectory() {
  if (processing || elements.useCustomOutput?.checked) return;
  
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    '-',
    String(now.getMinutes()).padStart(2, '0'),
    '-',
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
  
  try {
    const response = await fetch('/api/resolve-output-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useDefault: true, timestamp })
    });
    
    if (response.ok) {
      const data = await response.json();
      resolvedOutputPath = data.path;
      if (elements.outputDir) elements.outputDir.value = data.path;
    }
  } catch (error) {
    console.warn('Failed to resolve output path:', error);
    const fallback = `~/pulp-image-results/${timestamp}`;
    resolvedOutputPath = fallback;
    if (elements.outputDir) elements.outputDir.value = fallback;
  }
}

// ============================================
// FORM SUBMISSION
// ============================================

async function handleSubmit(e) {
  e.preventDefault();
  
  if (processing || selectedFiles.length === 0) return;
  
  processing = true;
  updateProcessButton();
  if (elements.processBtn) {
    elements.processBtn.innerHTML = `
      <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
      </svg>
      Processing...
    `;
  }
  
  // Hide previous results
  elements.resultsPanel?.classList.remove('visible');
  
  try {
    const outputPath = elements.useCustomOutput?.checked 
      ? elements.outputDir?.value 
      : resolvedOutputPath || elements.outputDir?.value;
    
    if (!outputPath) {
      throw new Error('Output directory not set');
    }
    
    const config = {
      width: elements.width?.value ? parseInt(elements.width.value, 10) : null,
      height: elements.height?.value ? parseInt(elements.height.value, 10) : null,
      format: elements.format?.value || null,
      out: outputPath,
      renamePattern: elements.renamePattern?.value.trim() || null,
      autoSuffix: elements.autoSuffix?.checked || false,
      quality: elements.quality?.disabled ? null : parseInt(elements.quality?.value || '80', 10),
      lossless: elements.lossless?.checked || false,
      background: elements.backgroundColor?.value || '#ffffff',
      alphaMode: document.querySelector('input[name="alpha-mode"]:checked')?.value || 'flatten',
      overwrite: elements.overwrite?.checked || false,
      useDefaultOutput: !elements.useCustomOutput?.checked
    };
    
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('config', JSON.stringify(config));
    
    const response = await fetch('/api/run', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }
    
    const results = await response.json();
    
    // Update output path if returned
    if (results.outputPath && !elements.useCustomOutput?.checked) {
      if (elements.outputDir) elements.outputDir.value = results.outputPath;
      resolvedOutputPath = results.outputPath;
    }
    
    displayResults(results);
    
  } catch (error) {
    console.error('Processing error:', error);
    alert(`Error: ${sanitizeError(error.message)}`);
  } finally {
    processing = false;
    updateProcessButton();
    if (elements.processBtn) {
      elements.processBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Process Images
      `;
    }
  }
}

// ============================================
// RESULTS DISPLAY
// ============================================

function displayResults(results) {
  if (!elements.resultsContent) return;
  
  let html = '';
  
  // Per-file results
  if (results.processed?.length > 0) {
    results.processed.forEach(result => {
      const sizeChange = result.finalSize - result.originalSize;
      const percentChange = result.originalSize > 0 
        ? ((sizeChange / result.originalSize) * 100).toFixed(1)
        : '0';
      const changeText = sizeChange >= 0 ? `+${percentChange}%` : `${percentChange}%`;
      const changeClass = sizeChange > 0 ? 'text-warning' : sizeChange < 0 ? 'text-success' : '';
      
      html += `
        <div class="result-item success">
          <div class="result-item-header">
            <span class="result-item-name">${escapeHtml(extractFilename(result.outputPath))}</span>
            <span class="result-item-status success">Done</span>
          </div>
          <div class="result-item-details">
            <span class="result-item-detail"><strong>Size:</strong> ${formatBytes(result.originalSize)} → ${formatBytes(result.finalSize)} <span class="${changeClass}">(${changeText})</span></span>
            <span class="result-item-detail"><strong>Dimensions:</strong> ${result.metadata?.width || '?'}×${result.metadata?.height || '?'}</span>
          </div>
        </div>
      `;
    });
  }
  
  // Skipped
  if (results.skipped?.length > 0) {
    results.skipped.forEach(item => {
      html += `
        <div class="result-item skipped">
          <div class="result-item-header">
            <span class="result-item-name">${escapeHtml(extractFilename(item.filePath))}</span>
            <span class="result-item-status skipped">Skipped</span>
          </div>
          <div class="result-item-details">
            <span class="result-item-detail">${escapeHtml(sanitizeError(item.reason))}</span>
          </div>
        </div>
      `;
    });
  }
  
  // Failed
  if (results.failed?.length > 0) {
    results.failed.forEach(item => {
      html += `
        <div class="result-item error">
          <div class="result-item-header">
            <span class="result-item-name">${escapeHtml(extractFilename(item.filePath))}</span>
            <span class="result-item-status error">Failed</span>
          </div>
          <div class="result-item-details">
            <span class="result-item-detail">${escapeHtml(sanitizeError(item.error))}</span>
          </div>
        </div>
      `;
    });
  }
  
  // Summary
  if (results.totals) {
    const t = results.totals;
    const totalChange = t.totalFinal - t.totalOriginal;
    const totalPercent = t.totalOriginal > 0 
      ? ((totalChange / t.totalOriginal) * 100).toFixed(1) 
      : '0';
    const changeText = totalChange >= 0 ? `+${totalPercent}%` : `${totalPercent}%`;
    
    html += `
      <div class="results-summary">
        <h3 class="results-summary-title">Summary</h3>
        <div class="results-summary-grid">
          <div class="summary-stat">
            <div class="summary-stat-value">${t.processedCount || 0}</div>
            <div class="summary-stat-label">Processed</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${formatBytes(t.totalOriginal || 0)}</div>
            <div class="summary-stat-label">Original</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${formatBytes(t.totalFinal || 0)}</div>
            <div class="summary-stat-label">Final</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${changeText}</div>
            <div class="summary-stat-label">Change</div>
          </div>
        </div>
      </div>
    `;
  }
  
  elements.resultsContent.innerHTML = html;
  elements.resultsPanel?.classList.add('visible');
  elements.resultsPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// RESET FORM
// ============================================

function resetForm() {
  elements.form?.reset();
  selectedFiles = [];
  ignoredFiles = [];
  
  // Reset file inputs
  if (elements.inputFiles) elements.inputFiles.value = '';
  if (elements.inputFolder) elements.inputFolder.value = '';
  
  // Reset UI elements
  if (elements.qualityValue) elements.qualityValue.textContent = '80';
  if (elements.backgroundHex) elements.backgroundHex.value = '#ffffff';
  if (elements.renamePreview) elements.renamePreview.textContent = '';
  
  // Reset output
  if (elements.useCustomOutput) elements.useCustomOutput.checked = false;
  if (elements.outputDir) elements.outputDir.readOnly = true;
  
  // Hide results and fallback
  elements.resultsPanel?.classList.remove('visible');
  document.getElementById('open-folder-fallback')?.classList.add('hidden');
  
  // Remove focus highlights
  document.querySelectorAll('.section-card').forEach(s => {
    s.classList.remove('focused');
  });
  
  // Update state
  updateFileListPreview();
  updateProcessButton();
  updateOutputDirectory();
}

// ============================================
// OPEN FOLDER
// ============================================

async function openFolder(path) {
  const fallback = document.getElementById('open-folder-fallback');
  const fallbackPath = document.getElementById('fallback-path');
  
  // Hide fallback before attempting
  fallback?.classList.add('hidden');
  
  try {
    const response = await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.warn('Could not open folder:', data.error || 'Unknown error');
      // Show fallback with path
      if (fallback && fallbackPath) {
        fallbackPath.textContent = data.path || path;
        fallback.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.warn('Failed to open folder:', error);
    // Show fallback with path
    if (fallback && fallbackPath) {
      fallbackPath.textContent = path;
      fallback.classList.remove('hidden');
    }
  }
}

// ============================================
// VERSION & UPDATES
// ============================================

async function loadVersion() {
  try {
    // Hide version badge until loaded
    if (elements.version) {
      elements.version.style.opacity = '0';
    }
    
    const response = await fetch('/api/version');
    if (response.ok) {
      const data = await response.json();
      if (elements.version && data.version) {
        elements.version.textContent = `v${data.version}`;
      }
    }
  } catch (error) {
    console.warn('Failed to load version:', error);
  } finally {
    if (elements.version) {
      elements.version.style.opacity = '1';
    }
  }
}

async function checkForUpdates() {
  try {
    const response = await fetch('/api/check-update');
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.updateAvailable && data.latestVersion && elements.updateBanner) {
      elements.updateBanner.innerHTML = `
        <span><strong>Update available:</strong> v${data.currentVersion} → v${data.latestVersion}</span>
        <code>npm update -g pulp-image</code>
        <span>or visit <a href="https://pulp.run" target="_blank">pulp.run</a></span>
        <button class="update-banner-close" onclick="this.parentElement.classList.add('hidden')">&times;</button>
      `;
      elements.updateBanner.classList.remove('hidden');
    }
  } catch (error) {
    // Silent fail for update check
  }
}

// ============================================
// UTILITIES
// ============================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function extractFilename(path) {
  if (!path) return 'Unknown';
  return path.split(/[/\\]/).pop() || path;
}

function sanitizeError(msg) {
  if (!msg) return 'An error occurred.';
  
  let clean = msg;
  clean = clean.replace(/\/tmp\/[^\s]+/g, '');
  clean = clean.replace(/[^\s]*pulp-image-[^\s]+/g, '');
  clean = clean.replace(/--[a-z-]+/g, '');
  
  if (clean.includes('transparency') && clean.includes('does not support')) {
    return 'Image has transparency but target format does not support it. Use PNG/WebP or enable background flattening.';
  }
  if (clean.includes('already exists')) {
    return 'File already exists. Enable "Overwrite existing files" to replace.';
  }
  
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean || 'An error occurred.';
}
