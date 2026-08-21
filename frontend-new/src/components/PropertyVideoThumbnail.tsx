import React, { useState, useEffect, useRef } from 'react';
import { Play, Film, AlertCircle, Sparkles } from 'lucide-react';
import { isYouTubeUrl, getYouTubeThumbnail, isCloudinaryVideoUrl, getCloudinaryVideoThumbnail, resolveVideoUrl, resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/media';

interface PropertyVideoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string;
  fallbackImage?: string;
  alt?: string;
  className?: string;
  showPlayBadge?: boolean;
  playBadgeSize?: 'sm' | 'md' | 'lg';
  label?: string;
  onClick?: () => void;
  active?: boolean;
}

export const PropertyVideoThumbnail: React.FC<PropertyVideoThumbnailProps> = ({
  videoUrl,
  thumbnailUrl,
  fallbackImage,
  alt = 'فيديو معاينة العقار',
  className = '',
  showPlayBadge = true,
  playBadgeSize = 'md',
  label,
  onClick,
  active = false,
}) => {
  const resolvedVideo = resolveVideoUrl(videoUrl);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [useVideoElement, setUseVideoElement] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setLoadError(false);
    setUseVideoElement(false);

    // 1. Explicit thumbnail
    if (thumbnailUrl && thumbnailUrl.trim()) {
      setImageSrc(resolveImageUrl(thumbnailUrl.trim()));
      return;
    }

    // 2. YouTube thumbnail
    if (isYouTubeUrl(resolvedVideo)) {
      const yt = getYouTubeThumbnail(resolvedVideo);
      if (yt) {
        setImageSrc(yt);
        return;
      }
    }

    // 3. Cloudinary auto poster
    if (isCloudinaryVideoUrl(resolvedVideo)) {
      const cld = getCloudinaryVideoThumbnail(resolvedVideo);
      if (cld) {
        setImageSrc(cld);
        return;
      }
    }

    // 4. If direct video file without image thumbnail, use video element to render frame
    if (resolvedVideo && !isYouTubeUrl(resolvedVideo)) {
      setUseVideoElement(true);
      return;
    }

    // 5. Fallback image
    if (fallbackImage) {
      setImageSrc(resolveImageUrl(fallbackImage));
    }
  }, [resolvedVideo, thumbnailUrl, fallbackImage]);

  const handleImageError = () => {
    // If image failed to load and we have a video URL, try video element preview
    if (!useVideoElement && resolvedVideo && !isYouTubeUrl(resolvedVideo)) {
      setUseVideoElement(true);
    } else if (fallbackImage && imageSrc !== resolveImageUrl(fallbackImage)) {
      setImageSrc(resolveImageUrl(fallbackImage));
    } else if (imageSrc !== FALLBACK_PROPERTY_IMAGE) {
      setImageSrc(FALLBACK_PROPERTY_IMAGE);
    } else {
      setLoadError(true);
    }
  };

  const badgeDimensions = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }[playBadgeSize];

  const iconDimensions = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }[playBadgeSize];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden group select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {useVideoElement ? (
        <video
          ref={videoRef}
          src={`${resolvedVideo}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0.5;
            }
          }}
          onError={() => {
            setUseVideoElement(false);
            setImageSrc(FALLBACK_PROPERTY_IMAGE);
            setLoadError(true);
          }}
        />
      ) : loadError ? (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-2">
          <Film className="w-6 h-6 mb-1 text-amber-500/80" />
          <span className="text-[10px] font-bold text-slate-300">معاينة فيديو</span>
        </div>
      ) : (
        <img
          src={imageSrc || fallbackImage || FALLBACK_PROPERTY_IMAGE}
          alt={alt}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 group-hover:bg-black/40 transition-colors pointer-events-none" />

      {/* Play Icon Badge */}
      {showPlayBadge && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-10 pointer-events-none">
          <div
            className={`${badgeDimensions} rounded-full bg-[#8D6A28] text-white flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-115 group-hover:bg-amber-500 ${
              active ? 'ring-4 ring-amber-300/60 scale-110' : ''
            }`}
          >
            <Play className={`${iconDimensions} fill-current ml-0.5`} />
          </div>

          {label && (
            <span className="text-[10px] sm:text-xs font-bold text-white bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs border border-white/10">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
