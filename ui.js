function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderStats(filesList) {
  const files = Array.isArray(filesList) ? filesList : [];
  const totalOriginal = files.reduce((sum, f) => sum + (Number(f.originalSize) || 0), 0);
  const totalCompressed = files.reduce((sum, f) => sum + (Number(f.compressedSize) || 0), 0);

  const totalSizeEl = document.getElementById('totalSize');
  if (totalSizeEl) totalSizeEl.textContent = formatFileSize(totalOriginal);

  const processedCountEl = document.getElementById('processedCount');
  if (processedCountEl) processedCountEl.textContent = files.length;

  const savingsEl = document.getElementById('totalSavings');
  if (savingsEl) {
    const rate = totalOriginal > 0 ? Math.max(0, Math.round((1 - totalCompressed / totalOriginal) * 100)) : 0;
    savingsEl.textContent = `${rate}%`;
  }
}

function renderFilesTable(files) {
  const tableBody = document.getElementById('filesTableBody');
  if (!tableBody) return;

  if (!files || files.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:gray;">No data records found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = files.map((file) => {
    const rateClass = file.compressionRate >= 50 ? 'rate-high' : 'rate-normal';
    return `
      <tr data-id="${file.id}">
        <td>📁 <span>${escapeHtml(file.name)}</span></td>
        <td><span class="badge">${escapeHtml(file.fileType || 'zip')}</span></td>
        <td>${escapeHtml(file.sizeLabel || formatFileSize(file.originalSize))}</td>
        <td>${escapeHtml(file.compressedLabel || formatFileSize(file.compressedSize))}</td>
        <td><span class="${rateClass}">${file.compressionRate}% Saved</span></td>
        <td>
          <button data-action="download" data-id="${file.id}">📥</button>
          <button data-action="delete" data-id="${file.id}">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function createAnalyticsCharts(files) {
  const chartCanvas = document.getElementById('analyticsChart');
  if (!chartCanvas || typeof Chart !== 'function') return;

  try {
    const existingChart = Chart.getChart(chartCanvas);
    if (existingChart) existingChart.destroy();
    if (!files || files.length === 0) return;

    const dataMatrix = files.slice(0, 7).reverse();
    new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: dataMatrix.map(f => f.name.length > 12 ? f.name.slice(0, 10) + '...' : f.name),
        datasets: [
          { label: 'Original', data: dataMatrix.map(f => (f.originalSize / 1024).toFixed(1)), backgroundColor: 'rgba(54, 162, 235, 0.5)' },
          { label: 'Compressed', data: dataMatrix.map(f => (f.compressedSize / 1024).toFixed(1)), backgroundColor: 'rgba(75, 192, 192, 0.5)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (err) {}
}

function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast-item alert alert-${type === 'error' ? 'danger' : type}`;
  toast.innerHTML = `${type === 'error' ? '❌' : '✔️'} ${escapeHtml(message)}`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}