function createAnalyticsCharts(files) {
  if (typeof Chart === 'undefined') {
    return;
  }

  const savingsData = files.length
    ? files.slice(0, 6).map((entry) => ({
        label: entry.name.length > 12 ? entry.name.slice(0, 12) + '…' : entry.name,
        saved: Math.max(0, entry.originalSize - entry.compressedSize),
      }))
    : [{ label: 'No files yet', saved: 0 }];

  const typeMap = files.reduce((acc, entry) => {
    acc[entry.fileType] = (acc[entry.fileType] || 0) + 1;
    return acc;
  }, {});

  const typeLabels = Object.keys(typeMap);
  const typeCounts = Object.values(typeMap);

  const monthlyMap = files.reduce((acc, entry) => {
    const month = new Date(entry.uploadDate).toLocaleString('en', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyLabels = Object.keys(monthlyMap);
  const monthlyCounts = Object.values(monthlyMap);

  const savingsCtx = document.getElementById('savingsChart');
  const typeCtx = document.getElementById('typeChart');
  const monthlyCtx = document.getElementById('monthlyChart');

  if (savingsCtx) {
    if (window._savingsChart) window._savingsChart.destroy();
    window._savingsChart = new Chart(savingsCtx, {
      type: 'bar',
      data: {
        labels: savingsData.map((item) => item.label),
        datasets: [{
          label: 'Compression savings',
          data: savingsData.map((item) => item.saved),
          backgroundColor: ['#38bdf8', '#818cf8', '#a78bfa', '#67e8f9', '#c084fc', '#93c5fd'],
          borderRadius: 12,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.12)' } }, x: { grid: { display: false } } }
      }
    });
  }

  if (typeCtx) {
    if (window._typeChart) window._typeChart.destroy();
    window._typeChart = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: typeLabels.length ? typeLabels : ['No data'],
        datasets: [{ data: typeCounts.length ? typeCounts : [1], backgroundColor: ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fbbf24'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  if (monthlyCtx) {
    if (window._monthlyChart) window._monthlyChart.destroy();
    window._monthlyChart = new Chart(monthlyCtx, {
      type: 'line',
      data: {
        labels: monthlyLabels.length ? monthlyLabels : ['No data'],
        datasets: [{
          label: 'Uploads',
          data: monthlyCounts.length ? monthlyCounts : [0],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
    });
  }
}
