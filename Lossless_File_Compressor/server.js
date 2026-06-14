const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const multer = require('multer');

const app = express();
const DEFAULT_PORT = Number.parseInt(process.env.PORT || '3000', 10);

function normalizePort(value) {
  const port = Number.parseInt(value, 10);
  if (Number.isNaN(port)) return DEFAULT_PORT;
  return port;
}

function startServer(port) {
  const server = app.listen(normalizePort(port), '0.0.0.0', () => {
    console.log(`LosslessFileCompressor backend running at http://localhost:${server.address().port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy. Trying ${port + 1} instead...`);
      server.close(() => startServer(port + 1));
      return;
    }

    console.error('Failed to start the backend:', error);
    process.exit(1);
  });
}

const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'uploads', 'files.json');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf8');
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readFiles() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeFiles(files) {
  fs.writeFileSync(dataFile, JSON.stringify(files, null, 2), 'utf8');
}

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Lossless File Compressor backend is running.' });
});

app.get('/api/files', (_req, res) => {
  res.json(readFiles());
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const original = Buffer.from(req.file.buffer);
  const compressed = zlib.gzipSync(original);
  const originalSize = original.length;
  const compressedSize = compressed.length;
  const compressionRate = originalSize > 0
    ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
    : 0;

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: req.file.originalname,
    originalSize,
    compressedSize,
    compressionRate,
    uploadDate: new Date().toISOString(),
    fileType: (req.file.originalname.split('.').pop() || 'file').toLowerCase(),
    mimeType: req.file.mimetype || 'application/octet-stream',
    sizeLabel: formatFileSize(originalSize),
    compressedLabel: formatFileSize(compressedSize),
    note: 'Stored on the JavaScript backend.',
    data: Array.from(compressed),
  };

  const files = readFiles();
  files.unshift(entry);
  writeFiles(files);

  res.json(entry);
});

app.get('/api/files/:id/download', (req, res) => {
  const files = readFiles();
  const file = files.find((item) => item.id === req.params.id);

  if (!file) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const compressed = Uint8Array.from(file.data);
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}.gz"`);
  res.send(Buffer.from(compressed));
});

app.delete('/api/files/:id', (req, res) => {
  const files = readFiles().filter((item) => item.id !== req.params.id);
  writeFiles(files);
  res.json({ ok: true, removed: req.params.id });
});

startServer(DEFAULT_PORT);
