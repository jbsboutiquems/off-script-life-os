/**
 * Profile pictures + user-uploaded pictures (Amber, Nov 27, 2026).
 *
 * Storage rule (learned from Jason's buddy disappearing): pictures live
 * SERVER-side, in the user record in the server data file — never in
 * localStorage alone. Android clears WebView storage and app updates wipe
 * it; a picture with no server copy is gone forever. localStorage may hold
 * a fast cache, but the server is the source of truth.
 *
 * Pictures are stored as JPEG dataURLs, square-cropped and downscaled so
 * they never bloat the data file: profile pictures cap at 256px (~15–40KB),
 * buddy photos at 512px (~60–150KB). The server's JSON body limit is 1mb
 * (see server.ts) so a picture-carrying profile save is never rejected.
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/** Profile pictures are square, 256px, JPEG — small enough to live in the user record. */
export const PROFILE_PICTURE_SIZE = 256;
/** Buddy photos cap at 512px, same shape BuddyCreator already uses. */
export const BUDDY_PICTURE_SIZE = 512;
/** Hard cap for any stored picture dataURL. Anything bigger gets downscaled until it fits. */
export const PICTURE_MAX_BYTES = 300_000;

/** Is this a usable stored picture? Guards the renderers against junk/empty values. */
export function isPicture(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image/');
}

/** Rough byte size of a dataURL (base64 ≈ 4/3 of the bytes). */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor(b64.length * 0.75);
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = dataUrl;
  });
}

/**
 * Square centre-crop + downscale to `size` px, JPEG-encoded. Returns a
 * dataURL. Used for profile pictures (256px) and for shrinking any
 * oversized upload (buddy photos included) until it fits PICTURE_MAX_BYTES.
 */
export async function squareCropDataUrl(
  dataUrl: string,
  size: number,
  quality = 0.82,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process that image.');
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Shrink a picture dataURL until it fits PICTURE_MAX_BYTES, stepping down
 * 512 → 384 → 256 → 192px. Returns the original when it already fits.
 * Keeps buddy photos (and any future upload) from ever bloating the record.
 */
export async function fitPictureBytes(dataUrl: string): Promise<string> {
  if (!isPicture(dataUrl) || dataUrlBytes(dataUrl) <= PICTURE_MAX_BYTES) return dataUrl;
  for (const size of [384, 256, 192]) {
    const shrunk = await squareCropDataUrl(dataUrl, size, 0.8);
    if (dataUrlBytes(shrunk) <= PICTURE_MAX_BYTES) return shrunk;
  }
  return squareCropDataUrl(dataUrl, 192, 0.7);
}

/** Turn a picked File into a processed 256px profile picture dataURL. */
export async function fileToProfilePicture(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
  return squareCropDataUrl(dataUrl, PROFILE_PICTURE_SIZE);
}

function pickViaFileInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(await fileToProfilePicture(file));
      } catch {
        resolve(null);
      }
    };
    // Cancelled picker fires no change event; resolve on blur as a fallback.
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Let the user pick a profile picture. On the native app this uses the
 * Capacitor Camera plugin (Take Photo / Choose from Gallery). On web — or
 * if the native prompt fails for any reason — it falls back to a plain
 * file input, which works everywhere. Returns a processed 256px JPEG
 * dataURL, or null when the user cancels. Never throws for a cancel.
 */
export async function pickProfilePicture(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Prompt,
        resultType: CameraResultType.DataUrl,
        quality: 80,
      });
      if (!photo.dataUrl) return null;
      return await squareCropDataUrl(photo.dataUrl, PROFILE_PICTURE_SIZE);
    } catch {
      // Native prompt declined, unavailable, or no permission — fall through
      // to the file input rather than leaving the user with nothing.
      return pickViaFileInput();
    }
  }
  return pickViaFileInput();
}
