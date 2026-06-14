class FileManager {
  constructor(storageKey = 'lossless-file-compress-files') {
    this.storageKey = storageKey;
  }

  _read() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn('Unable to read files from localStorage', error);
      return [];
    }
  }

  _write(files) {
    localStorage.setItem(this.storageKey, JSON.stringify(files));
  }

  getFiles() {
    return this._read().sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  }

  getFile(id) {
    return this.getFiles().find((entry) => entry.id === id) || null;
  }

  async _uploadToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Backend upload failed.');
    }

    return response.json();
  }

  async saveFile(file) {
    try {
      const backendEntry = await this._uploadToBackend(file);
      const files = this.getFiles();
      if (!files.some((entry) => entry.id === backendEntry.id)) {
        files.unshift(backendEntry);
      }
      this._write(files);
      return backendEntry;
    } catch (error) {
      console.warn('Backend upload unavailable; using browser storage instead.', error);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const compressedBytes = await gzipCompress(bytes);
    const originalSize = bytes.length;
    const compressedSize = compressedBytes.length;
    const compressionRate = originalSize > 0 ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100)) : 0;

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      originalSize,
      compressedSize,
      compressionRate,
      uploadDate: new Date().toISOString(),
      fileType: (file.name.split('.').pop() || 'file').toLowerCase(),
      mimeType: file.type || 'application/octet-stream',
      data: Array.from(compressedBytes),
      sizeLabel: formatFileSize(originalSize),
      compressedLabel: formatFileSize(compressedSize),
      previewable: /^(image|text|application\/pdf)/i.test(file.type || '') || /\.(txt|md|json|csv|html|js|css)$/i.test(file.name),
      note: 'Stored locally in browser storage.'
    };

    const files = this.getFiles();
    files.unshift(entry);
    this._write(files);
    return entry;
  }

  async deleteFile(id) {
    try {
      const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Backend delete failed.');
      }
    } catch (error) {
      console.warn('Backend delete unavailable; removing from browser storage instead.', error);
    }

    const files = this.getFiles().filter((entry) => entry.id !== id);
    this._write(files);
    return files;
  }

  renameFile(id, newName) {
    const files = this.getFiles();
    const target = files.find((entry) => entry.id === id);
    if (!target) return null;

    target.name = newName.trim() || target.name;
    target.fileType = (target.name.split('.').pop() || 'file').toLowerCase();
    this._write(files);
    return target;
  }

  calculateStorage() {
    const files = this.getFiles();
    const totalSize = files.reduce((sum, entry) => sum + entry.originalSize, 0);
    const totalCompressed = files.reduce((sum, entry) => sum + entry.compressedSize, 0);
    const totalSaved = Math.max(0, totalSize - totalCompressed);
    const averageCompression = files.length ? Math.round(files.reduce((sum, entry) => sum + entry.compressionRate, 0) / files.length) : 0;

    return {
      totalFiles: files.length,
      totalSize,
      totalCompressed,
      totalSaved,
      averageCompression,
      files
    };
  }
}
