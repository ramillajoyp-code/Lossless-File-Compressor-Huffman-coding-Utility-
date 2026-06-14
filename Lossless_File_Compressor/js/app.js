const fileManager = new FileManager();

const state = {
  files: fileManager.getFiles(),
};

function refreshDashboard() {
  state.files = fileManager.getFiles();
  const metrics = fileManager.calculateStorage();
  renderStats(metrics);
  renderFilesTable(filterFiles(state.files));
  createAnalyticsCharts(state.files);
}

function filterFiles(files) {
  const query = document.getElementById('searchInput')?.value?.trim().toLowerCase() || '';
  const sortBy = document.getElementById('sortSelect')?.value || 'date-desc';

  let filtered = files.filter((item) => !query || `${item.name} ${item.fileType}`.toLowerCase().includes(query));

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'size-asc': return a.originalSize - b.originalSize;
      case 'size-desc': return b.originalSize - a.originalSize;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'type-asc': return a.fileType.localeCompare(b.fileType);
      case 'date-asc': return new Date(a.uploadDate) - new Date(b.uploadDate);
      default: return new Date(b.uploadDate) - new Date(a.uploadDate);
    }
  });

  return filtered;
}

function setupTheme() {
  const savedTheme = localStorage.getItem('lossless-file-compress-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  if (isDark) {
    document.body.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }

  const themeButton = document.getElementById('themeToggle');
  if (themeButton) {
    const updateLabel = () => {
      const isDarkMode = document.body.classList.contains('dark');
      themeButton.innerHTML = isDarkMode
        ? '<i class="fa-solid fa-sun"></i> Light Mode'
        : '<i class="fa-solid fa-moon"></i> Dark Mode';
    };
    updateLabel();
    themeButton.addEventListener('click', () => {
      const nextDark = !document.body.classList.contains('dark');
      document.body.classList.toggle('dark', nextDark);
      document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
      localStorage.setItem('lossless-file-compress-theme', nextDark ? 'dark' : 'light');
      updateLabel();
      showToast(nextDark ? 'Dark mode enabled.' : 'Light mode enabled.', 'success');
    });
  }
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['txt', 'md', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'json', 'csv', 'html', 'css', 'js'];

function validateFile(file) {
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  if (file.size > MAX_FILE_SIZE) return { ok: false, message: 'File exceeds 100 MB limit.' };
  if (!ALLOWED_EXTENSIONS.includes(extension)) return { ok: false, message: 'Unsupported file type.' };
  return { ok: true };
}

async function processSelection(files) {
  if (!files.length) {
    showToast('Please select at least one file.', 'error');
    return;
  }

  const validFiles = [];
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.ok) {
      showToast(`${file.name}: ${validation.message}`, 'error');
      continue;
    }
    if (fileManager.getFiles().some((entry) => entry.name === file.name && entry.originalSize === file.size)) {
      showToast(`Skipped existing file: ${file.name}`, 'warning');
      continue;
    }
    validFiles.push(file);
  }

  if (!validFiles.length) {
    showToast('No valid files were selected.', 'warning');
    return;
  }

  let completed = 0;
  setProgress(document.getElementById('uploadProgress'), document.getElementById('uploadLabel'), 10);
  setProgress(document.getElementById('compressionProgress'), document.getElementById('compressionLabel'), 0);

  for (const file of validFiles) {
    try {
      await fileManager.saveFile(file);
      completed += 1;
      const percent = Math.min(98, Math.round((completed / validFiles.length) * 100));
      setProgress(document.getElementById('compressionProgress'), document.getElementById('compressionLabel'), percent);
    } catch (error) {
      console.error(error);
      showToast(`Could not process ${file.name}.`, 'error');
    }
  }

  setProgress(document.getElementById('uploadProgress'), document.getElementById('uploadLabel'), 100);
  setProgress(document.getElementById('compressionProgress'), document.getElementById('compressionLabel'), 100);
  refreshDashboard();
  showToast('Compression process completed.', 'success');
}

async function handleFileAction(event) {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const id = action.dataset.id;
  const file = fileManager.getFile(id);
  if (!file) return;

  if (action.dataset.action === 'download') {
    const bytes = new Uint8Array(file.data);
    downloadBlob(bytes, `${file.name}.gz`, 'application/gzip');
    showToast('Compressed file downloaded.', 'success');
  }

  if (action.dataset.action === 'preview') {
    const decompressed = await gzipDecompress(new Uint8Array(file.data));
    if (file.mimeType.startsWith('image/')) {
      const imageBlob = new Blob([decompressed], { type: file.mimeType || 'image/png' });
      const imageUrl = URL.createObjectURL(imageBlob);
      openModal(file.name, `<img src="${imageUrl}" alt="${file.name}" />`);
    } else if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfBlob = new Blob([decompressed], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      openModal(file.name, `<iframe class="preview-pdf" src="${pdfUrl}"></iframe>`);
    } else {
      openModal(file.name, `<div class="preview-text">${escapeHtml(new TextDecoder().decode(decompressed))}</div>`);
    }
    showToast('Preview ready.', 'success');
  }

  if (action.dataset.action === 'rename') {
    const next = window.prompt('Rename file', file.name);
    if (!next) return;
    fileManager.renameFile(id, next);
    refreshDashboard();
    showToast('File renamed.', 'success');
  }

  if (action.dataset.action === 'delete') {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    fileManager.deleteFile(id);
    refreshDashboard();
    showToast('File deleted.', 'success');
  }
}

function attachEvents() {
  document.getElementById('compressBtn')?.addEventListener('click', () => {
    const input = document.getElementById('fileInput');
    processSelection(Array.from(input.files || []));
  });

  document.getElementById('fileInput')?.addEventListener('change', (event) => {
    processSelection(Array.from(event.target.files || []));
  });

  const dropZone = document.getElementById('dropZone');
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
  });
  ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    dropZone?.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
  });
  dropZone?.addEventListener('drop', (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    processSelection(files);
  });

  document.getElementById('searchInput')?.addEventListener('input', () => renderFilesTable(filterFiles(state.files)));
  document.getElementById('sortSelect')?.addEventListener('change', () => renderFilesTable(filterFiles(state.files)));

  document.getElementById('filesTableBody')?.addEventListener('click', handleFileAction);

  document.getElementById('clearAllBtn')?.addEventListener('click', () => {
    if (!window.confirm('Remove all stored files?')) return;
    localStorage.removeItem('lossless-file-compress-files');
    refreshDashboard();
    showToast('All files removed.', 'warning');
  });

  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    refreshDashboard();
    showToast('Dashboard refreshed.', 'success');
  });

  document.getElementById('closePreviewBtn')?.addEventListener('click', closeModal);
  document.getElementById('previewModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'previewModal') closeModal();
  });
}

setupTheme();
refreshDashboard();
attachEvents();
showToast('Lossless File Compressor is ready. Upload files to begin.', 'success');
