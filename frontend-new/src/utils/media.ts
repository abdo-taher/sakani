import { ApiService } from '../services/apiService';

export const FALLBACK_PROPERTY_IMAGE = '/default-property.svg';
export const DEFAULT_PROPERTY_IMAGE = '/default-property.svg';
export const DEFAULT_SYSTEM_LOGO = '/default-property.svg';

/**
 * Capture a frame from a video File or URL client-side and return a Blob (JPEG)
 */
export async function captureVideoFrame(videoSource: File | Blob | string, seekTimeSec: number = 1.0): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    let objectUrl = '';
    if (typeof videoSource === 'string') {
      if (videoSource.startsWith('http://') || videoSource.startsWith('https://')) {
        video.crossOrigin = 'anonymous';
      }
      video.src = videoSource;
    } else {
      objectUrl = URL.createObjectURL(videoSource);
      video.src = objectUrl;
    }

    const cleanUp = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch {}
      }
    };

    video.onloadedmetadata = () => {
      const targetTime = Math.min(seekTimeSec, video.duration > 0 ? video.duration / 2 : 0.5);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanUp();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanUp();
          resolve(blob);
        }, 'image/jpeg', 0.85);
      } catch (e) {
        cleanUp();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanUp();
      resolve(null);
    };
  });
}

/**
 * Fast client-side extraction of the first image/frame from a video File, Blob, or URL as a base64 Data URL.
 * Works instantaneously before or during upload.
 */
export async function extractFirstFrameDataUrl(videoSource: File | Blob | string, seekTimeSec: number = 0.5): Promise<string | null> {
  // If remote URL and is Cloudinary or YouTube, return direct CDN thumbnail without loading video element
  if (typeof videoSource === 'string') {
    if (isCloudinaryVideoUrl(videoSource)) {
      const cThumb = getCloudinaryVideoThumbnail(videoSource);
      if (cThumb) return cThumb;
    }
    if (isYouTubeUrl(videoSource)) {
      const yThumb = getYouTubeThumbnail(videoSource);
      if (yThumb) return yThumb;
    }
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    let objectUrl = '';
    if (typeof videoSource === 'string') {
      if (videoSource.startsWith('http://') || videoSource.startsWith('https://')) {
        video.crossOrigin = 'anonymous';
      }
      video.src = videoSource;
    } else {
      objectUrl = URL.createObjectURL(videoSource);
      video.src = objectUrl;
    }

    const cleanUp = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch {}
      }
    };

    video.onloadedmetadata = () => {
      const targetTime = Math.min(seekTimeSec, video.duration > 0 ? video.duration / 2 : 0.1);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanUp();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        cleanUp();
        resolve(dataUrl);
      } catch (e) {
        cleanUp();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanUp();
      resolve(null);
    };
  });
}

/**
 * Generate video thumbnail and upload it to Cloudflare R2 / backend
 */
export async function generateAndUploadVideoThumbnail(videoSource: File | string): Promise<{ url: string; public_id: string } | null> {
  try {
    const blob = await captureVideoFrame(videoSource, 1.0);
    if (!blob) return null;

    const thumbnailFile = new File([blob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
    const res = await ApiService.uploadMedia(thumbnailFile, 'sakani/properties/thumbnails');

    return {
      url: res.url,
      public_id: res.key || res.public_id,
    };
  } catch (e) {
    console.warn('Video thumbnail generation error:', e);
    return null;
  }
}

/**
 * Check if a URL is a YouTube link
 */
export function isYouTubeUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com|youtu\.be/i.test(url);
}

/**
 * Extract YouTube video ID
 */
export function getYouTubeVideoId(url: any): string | null {
  if (!url || typeof url !== 'string') return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

/**
 * Convert any YouTube URL to an embeddable iframe URL with optional autoplay
 */
export function getYouTubeEmbedUrl(url: any, autoPlay: boolean = false): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const base = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
  return autoPlay ? `${base}&autoplay=1` : base;
}

/**
 * Get high-quality thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(url: any): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Check if a URL is a Cloudinary video URL
 */
export function isCloudinaryVideoUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cloudinary.com') && (url.includes('/video/upload/') || /\.(mp4|webm|mov|mkv)$/i.test(url));
}

/**
 * Generate a poster/thumbnail JPG URL from a Cloudinary video URL
 */
export function getCloudinaryVideoThumbnail(url: any): string | null {
  if (!url || typeof url !== 'string' || !isCloudinaryVideoUrl(url)) return null;
  try {
    let clean = url.trim();
    // Replace extension with .jpg
    clean = clean.replace(/\.(mp4|webm|mov|mkv)$/i, '.jpg');
    // Inject thumbnail transformation if not already present
    if (clean.includes('/video/upload/') && !clean.includes('/so_')) {
      clean = clean.replace('/video/upload/', '/video/upload/so_1.0,w_800,c_limit,q_auto,f_auto/');
    }
    return clean;
  } catch {
    return null;
  }
}

export const R2_PUBLIC_BASE_URL = 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev';

/**
 * Resolve any image URL (Cloudflare R2 keys, relative /storage/ paths, backend storage, external CDNs)
 */
export function resolveImageUrl(url: any): string {
  if (!url) return FALLBACK_PROPERTY_IMAGE;
  if (typeof url !== 'string') {
    if (typeof url === 'object' && url !== null) {
      const candidate = url.url || url.image || url.image_url || url.path || url.file_url;
      if (typeof candidate === 'string') return resolveImageUrl(candidate);
    }
    return FALLBACK_PROPERTY_IMAGE;
  }
  // Intercept Unsplash URLs that cause ERR_CONNECTION_CLOSED
  if (trimmed.includes('images.unsplash.com')) {
    if (trimmed.includes('w=1800') || trimmed.includes('1545324418')) {
      return '/hero-poster.jpg';
    }
    return FALLBACK_PROPERTY_IMAGE;
  }

  // If already absolute http / https or data/blob url
  if (/^(https?:|\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  // If Cloudflare R2 key (starts with /sakani/ or sakani/)
  const cleanKey = trimmed.replace(/^\/+/, '');
  if (cleanKey.startsWith('sakani/')) {
    return `${R2_PUBLIC_BASE_URL}/${cleanKey}`;
  }

  // If local /storage/ path from Laravel
  if (cleanKey.startsWith('storage/')) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:8000/${cleanKey}`;
      }
      return `https://api.sakani.site/${cleanKey}`;
    }
  }

  // If static public file (e.g. /default-property.svg, /hero-poster.jpg)
  if (trimmed.startsWith('/') && !trimmed.startsWith('/sakani/')) {
    return trimmed;
  }

  return `${R2_PUBLIC_BASE_URL}/sakani/${cleanKey}`;
}

/**
 * Resolve any video URL (Cloudflare R2 keys, relative /storage/ paths, external CDNs, YouTube, public local files)
 */
export function resolveVideoUrl(url: any): string {
  if (!url) return '';
  if (typeof url !== 'string') {
    if (typeof url === 'object' && url !== null) {
      const candidate = url.url || url.video_url || url.video || url.src || url.file_url;
      if (typeof candidate === 'string') return resolveVideoUrl(candidate);
    }
    return '';
  }
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If absolute http / https or blob or data url
  if (/^(https?:|\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  // If local public static asset (e.g. /hero.mp4)
  if (trimmed.startsWith('/') && !trimmed.startsWith('/sakani/') && !trimmed.startsWith('/properties/')) {
    return trimmed;
  }

  const cleanKey = trimmed.replace(/^\/+/, '');
  if (cleanKey.startsWith('sakani/')) {
    return `${R2_PUBLIC_BASE_URL}/${cleanKey}`;
  }

  // If starts with /storage/ or storage/
  if (cleanKey.startsWith('storage/')) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:8000/${cleanKey}`;
      }
      return `https://api.sakani.site/${cleanKey}`;
    }
  }

  return `${R2_PUBLIC_BASE_URL}/sakani/${cleanKey}`;
}

/**
 * Robustly resolve a thumbnail URL for any video (YouTube, Cloudinary, explicit thumb, or fallback)
 */
export function getVideoThumbnailUrl(
  videoUrl: string | null | undefined,
  explicitThumbnail?: string | null | undefined,
  fallbackImage?: string | null | undefined
): string {
  if (explicitThumbnail && explicitThumbnail.trim()) {
    return resolveImageUrl(explicitThumbnail.trim());
  }

  if (!videoUrl) {
    return fallbackImage ? resolveImageUrl(fallbackImage) : '';
  }

  const resolved = resolveVideoUrl(videoUrl);

  // 1. YouTube thumbnail
  if (isYouTubeUrl(resolved)) {
    const ytThumb = getYouTubeThumbnail(resolved);
    if (ytThumb) return ytThumb;
  }

  // 2. Cloudinary video thumbnail
  if (isCloudinaryVideoUrl(resolved)) {
    const cloudThumb = getCloudinaryVideoThumbnail(resolved);
    if (cloudThumb) return cloudThumb;
  }

  // 3. Fallback to image or direct video frame query
  if (fallbackImage && fallbackImage.trim()) {
    return resolveImageUrl(fallbackImage.trim());
  }

  return resolved ? `${resolved}#t=0.5` : FALLBACK_PROPERTY_IMAGE;
}

/**
 * Detect if a media URL is a video (.mp4, .webm, .mov, /videos/, YouTube, etc.)
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const str = url.trim();
  if (!str) return false;
  if (isYouTubeUrl(str)) return true;
  if (isCloudinaryVideoUrl(str)) return true;
  if (/\.(mp4|webm|mov|mkv|avi|m3u8|flv|wmv)(\?.*)?$/i.test(str)) return true;
  if (/\/properties\/videos\/|\/videos\//i.test(str)) return true;
  return false;
}

/**
 * Detect if a media URL is an image
 */
export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const str = url.trim();
  if (!str) return false;
  if (str.startsWith('data:image/') || str.startsWith('blob:')) return true;
  if (isVideoUrl(str)) return false;
  return true;
}

/**
 * Sanitize property media to strictly separate images from videos:
 * - If any video (.mp4) was accidentally added to `images` or `image_url`, it is extracted into `video_url`
 * - `images` will ONLY contain pure image URLs
 * - `image_url` is guaranteed to be a valid photo (not a .mp4)
 */
export function sanitizePropertyMedia(p: any): any {
  if (!p || typeof p !== 'object') return p;

  const rawImages: any[] = Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []);
  
  const extractedImageUrls: string[] = [];
  let detectedVideoUrl: string = p.video_url || '';

  for (const item of rawImages) {
    const url = typeof item === 'string' ? item.trim() : (item?.image_url || item?.url || item?.image_path || '').trim();
    if (!url) continue;

    if (isVideoUrl(url)) {
      if (!detectedVideoUrl) {
        detectedVideoUrl = resolveVideoUrl(url);
      }
    } else {
      extractedImageUrls.push(resolveImageUrl(url));
    }
  }

  // Also check direct image_url field
  if (p.image_url && isVideoUrl(p.image_url)) {
    if (!detectedVideoUrl) {
      detectedVideoUrl = resolveVideoUrl(p.image_url);
    }
  }

  const finalImages = extractedImageUrls.length > 0 ? extractedImageUrls : [FALLBACK_PROPERTY_IMAGE];
  const finalImageUrl = extractedImageUrls[0] || (p.video_thumbnail_url && !isVideoUrl(p.video_thumbnail_url) ? resolveImageUrl(p.video_thumbnail_url) : FALLBACK_PROPERTY_IMAGE);

  return {
    ...p,
    images: finalImages,
    image_url: finalImageUrl,
    video_url: detectedVideoUrl || (p.video_url ? resolveVideoUrl(p.video_url) : undefined),
    video_thumbnail_url: p.video_thumbnail_url && !isVideoUrl(p.video_thumbnail_url) 
      ? resolveImageUrl(p.video_thumbnail_url) 
      : (detectedVideoUrl ? getVideoThumbnailUrl(detectedVideoUrl, undefined, finalImageUrl) : undefined),
  };
}

