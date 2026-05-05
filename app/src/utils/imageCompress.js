/**
 * imageCompress.js — Canvas-based image compression utility
 */

/**
 * Compress a File to a base64 JPEG under maxDim × maxDim.
 * @param {File} file
 * @param {number} maxDim  — max width/height in px (default 1600)
 * @param {number} quality — JPEG quality 0-1 (default 0.88)
 * @returns {Promise<string>} base64 data URL
 */
export function compressImage(file, maxDim = 1600, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
          else                { width  = Math.round((width / height) * maxDim); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple files in parallel.
 * @param {File[]} files
 * @returns {Promise<string[]>}
 */
export function compressImages(files, maxDim = 1600, quality = 0.88) {
  return Promise.all(Array.from(files).map(f => compressImage(f, maxDim, quality)));
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Get approximate size of a base64 data URL in bytes.
 */
export function base64Size(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}
