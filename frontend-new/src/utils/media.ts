/**
 * Media utilities: Video thumbnail generation & frame capture
 */

import { ApiService } from '../services/apiService';

/**
 * Capture a frame from a video File or URL client-side and return a Blob (JPEG)
 */
export async function captureVideoFrame(videoSource: File | string, seekTimeSec: number = 1.0): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    let objectUrl = '';
    if (typeof videoSource === 'string') {
      video.src = videoSource;
    } else {
      objectUrl = URL.createObjectURL(videoSource);
      video.src = objectUrl;
    }

    const cleanUp = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    video.onloadedmetadata = () => {
      // Seek to either seekTimeSec or half duration if shorter
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
 * Generate video thumbnail and upload it to Cloudflare R2
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
export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be/i.test(url);
}

/**
 * Extract YouTube video ID
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

/**
 * Convert any YouTube URL to an embeddable iframe URL with privacy-enhanced mode
 */
export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Get high-quality thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Resolve any video URL (relative /storage/ paths, backend storage, external CDNs, YouTube)
 */
export function resolveVideoUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If absolute http / https or blob or data url
  if (/^(https?:|\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  // If starts with /storage/ or storage/
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8000${cleanPath}`;
    }
  }
  return cleanPath;
}
