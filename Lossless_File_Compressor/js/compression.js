async function gzipCompress(bytes) {
  if (typeof pako !== 'undefined' && typeof pako.gzip === 'function') {
    return pako.gzip(bytes);
  }

  return bytes;
}

async function gzipDecompress(gzipBytes) {
  if (typeof pako !== 'undefined' && typeof pako.ungzip === 'function') {
    return pako.ungzip(gzipBytes);
  }

  if (gzipBytes[0] !== 0x1F || gzipBytes[1] !== 0x8B) {
    throw new Error('Invalid compressed file');
  }
  return gzipBytes.subarray(10, gzipBytes.length - 8);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (const byte of data) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function mergeChunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
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

function downloadBlob(bytes, fileName, contentType = 'application/octet-stream') {
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
