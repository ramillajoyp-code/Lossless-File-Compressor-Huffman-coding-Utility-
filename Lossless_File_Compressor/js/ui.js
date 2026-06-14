function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
  };

  const toast = document.createElement('article');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="${icons[type] || icons.success}"></i>
    <div>
      <strong>${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Warning'}</strong>
      <span>${message}</span>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function renderStats(stats) {
  const statsGrid = document.getElementById('statsGrid');
  if (!statsGrid) return;
  statsGrid.innerHTML = [
    { title: 'Total Files Stored', value: stats.totalFiles, trend: 'Files in local storage' },
    { title: 'Total Storage Used', value: formatFileSize(stats.totalSize), trend: `${formatFileSize(stats.totalCompressed)} compressed` },
    { title: 'Files Compressed Today', value: stats.files.filter((item) => new Date(item.uploadDate).toDateString() === new Date().toDateString()).length, trend: 'Today\'s uploads' },
    { title: 'Compression Rate', value: `${stats.averageCompression}%`, trend: 'Average savings' },
  ].map((item) => `
    <article class="stat-card glass">
      <h3>${item.title}</h3>
      <strong>${item.value}</strong>
      <div class="trend">${item.trend}</div>
    </article>
  `).join('');
}

function renderFilesTable(files) {
  const body = document.getElementById('filesTableBody');
  if (!body) return;

  if (!files.length) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:18px;">No files stored yet.</td></tr>';
    return;
  }

  body.innerHTML = files.map((file) => `
    <tr>
      <td class="file-name">
        <strong>${escapeHtml(file.name)}</strong>
        <span>${file.fileType.toUpperCase()} • ${formatFileSize(file.originalSize)}</span>
      </td>
      <td>${formatFileSize(file.originalSize)}</td>
      <td>${formatFileSize(file.compressedSize)}</td>
      <td>${file.compressionRate}%</td>
      <td>${new Date(file.uploadDate).toLocaleDateString()}</td>
      <td>
        <button class="mini-btn primary" data-action="preview" data-id="${file.id}" type="button"><i class="fa-solid fa-eye"></i></button>
        <button class="mini-btn" data-action="download" data-id="${file.id}" type="button"><i class="fa-solid fa-download"></i></button>
        <button class="mini-btn" data-action="rename" data-id="${file.id}" type="button"><i class="fa-solid fa-pen"></i></button>
        <button class="mini-btn danger" data-action="delete" data-id="${file.id}" type="button"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function openModal(title, content) {
  const modal = document.getElementById('previewModal');
  const previewTitle = document.getElementById('previewTitle');
  const previewBody = document.getElementById('previewBody');
  previewTitle.textContent = title;
  previewBody.innerHTML = content;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  document.getElementById('previewModal').classList.add('hidden');
  document.getElementById('previewModal').setAttribute('aria-hidden', 'true');
}

function setProgress(fill, label, percent) {
  fill.style.width = `${percent}%`;
  label.textContent = `${percent}%`;
}
