/**
 * Client-side image validation and canvas compression helpers for LinkedIn-style
 * profile avatars and cover banners.
 *
 * Compresses user uploads to compact JPEG data URLs (~15-60 KB) so profile
 * photos sync cleanly inside Supabase `user_profiles.profile_data` JSONB and
 * localStorage without exhausting Free-Tier storage budgets.
 */

export const MAX_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB source file cap

export interface CompressImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  cropMode?: 'cover' | 'contain';
  backgroundColor?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read the selected image file.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read the selected image file.'));
    };
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
    img.src = src;
  });
}

/**
 * Validates, center-crops/scales onto an HTML5 `<canvas>`, and exports a
 * compressed JPEG data URL suitable for cloud JSONB persistence.
 */
export async function compressImageFileToDataUrl(
  file: File,
  {
    maxWidth,
    maxHeight,
    quality = 0.84,
    cropMode = 'cover',
    backgroundColor = '#ffffff',
  }: CompressImageOptions
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, or WebP).');
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Image exceeds the 8 MB upload limit. Please select a smaller file.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadHtmlImage(rawDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = maxHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas rendering is unavailable in this browser.');
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, maxWidth, maxHeight);

  const scale =
    cropMode === 'contain'
      ? Math.min(maxWidth / img.width, maxHeight / img.height)
      : Math.max(maxWidth / img.width, maxHeight / img.height);

  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const offsetX = (maxWidth - drawWidth) / 2;
  const offsetY = (maxHeight - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  return canvas.toDataURL('image/jpeg', quality);
}
