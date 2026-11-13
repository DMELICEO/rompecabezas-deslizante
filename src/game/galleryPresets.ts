import botanicalImg from '../assets/images/puzzle_botanical_mosaic_1794509523181.jpg';
import lighthouseImg from '../assets/images/puzzle_coastal_lighthouse_1794509525168.jpg';
import ceramicsImg from '../assets/images/puzzle_bauhaus_ceramics_1794509525279.jpg';

export interface GalleryImageItem {
  id: string;
  title: string;
  src: string;
  isUserUpload?: boolean;
}

export const BUILTIN_GALLERY_IMAGES: GalleryImageItem[] = [
  {
    id: 'ceramics',
    title: 'Cerámica Geométrica',
    src: ceramicsImg,
  },
  {
    id: 'lighthouse',
    title: 'Faro en la Costa',
    src: lighthouseImg,
  },
  {
    id: 'botanical',
    title: 'Invernadero Botánico',
    src: botanicalImg,
  },
];

/**
 * Reads a user-selected File from the device gallery, scales it cleanly
 * to <= 1400px on its longest side so large phone photos remain responsive,
 * and returns a data URL.
 */
export function readGalleryFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const rawUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawUrl) {
        reject(new Error('Archivo de imagen vacío.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        let targetW = img.naturalWidth || img.width;
        let targetH = img.naturalHeight || img.height;

        if (targetW > maxDim || targetH > maxDim) {
          const scale = maxDim / Math.max(targetW, targetH);
          targetW = Math.max(1, Math.round(targetW * scale));
          targetH = Math.max(1, Math.round(targetH * scale));
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Formato de imagen no compatible.'));
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Crops any source image using center-cover math to match the exact cols:rows
 * aspect ratio of the sliding puzzle board so tiles never stretch or distort.
 */
export function cropImageToBoardAspect(
  src: string,
  cols: number,
  rows: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) {
        resolve(src);
        return;
      }

      const targetRatio = cols / rows;
      const sourceRatio = iw / ih;

      let sx = 0;
      let sy = 0;
      let sw = iw;
      let sh = ih;

      if (sourceRatio > targetRatio) {
        sw = Math.round(ih * targetRatio);
        sx = Math.round((iw - sw) / 2);
      } else if (sourceRatio < targetRatio) {
        sh = Math.round(iw / targetRatio);
        sy = Math.round((ih - sh) / 2);
      }

      const maxOut = 1080;
      const outW =
        cols >= rows ? maxOut : Math.max(200, Math.round(maxOut * targetRatio));
      const outH =
        cols >= rows ? Math.max(200, Math.round(maxOut / targetRatio)) : maxOut;

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
