/**
 * Client-side image compression using Canvas API.
 * Resizes and compresses an image File before uploading.
 *
 * @param file       - Original image File
 * @param maxWidth   - Max width in pixels (default: 1200)
 * @param maxHeight  - Max height in pixels (default: 1200)
 * @param quality    - JPEG/WebP quality 0–1 (default: 0.82)
 * @param maxSizeMB  - Stop compressing if result is under this size in MB (default: 1)
 * @returns          - base64 data URL of the compressed image
 */
export function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82,
  maxSizeMB = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down to fit within maxWidth × maxHeight, keeping aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try JPEG first; fall back to PNG for transparent images
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      let q = quality;
      let dataUrl = canvas.toDataURL(mimeType, q);

      // Iteratively reduce quality until under maxSizeMB
      const maxBytes = maxSizeMB * 1024 * 1024;
      while (dataUrl.length * 0.75 > maxBytes && q > 0.3) {
        q = parseFloat((q - 0.1).toFixed(1));
        dataUrl = canvas.toDataURL(mimeType, q);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
