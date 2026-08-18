import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Video, Play, Pause, ExternalLink, Sparkles, Film, AlertCircle, Maximize, Volume2, VolumeX } from 'lucide-react';
import { PropertyVideo } from '../types';
import { isYouTubeUrl, getYouTubeEmbedUrl, getVideoThumbnailUrl, resolveVideoUrl } from '../utils/media';

export interface PropertyMultiVideoPlayerProps {
  videos?: PropertyVideo[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  fallbackPoster?: string;
  className?: string;
  title?: string;
  autoPlay?: boolean;
  embedded?: boolean; // When true, renders directly in the parent media viewer viewport without outer cards, headers, or padding
  activeVideoIndex?: number;
  onVideoIndexChange?: (index: number) => void;
  onToggleMediaMode?: () => void;
}

export const PropertyMultiVideoPlayer: React.FC<PropertyMultiVideoPlayerProps> = ({
  videos = [],
  videoUrl,
  videoThumbnailUrl,
  fallbackPoster,
  className = '',
  title = 'فيديوهات المعاينة والجولة الميدانية',
  autoPlay = false,
  embedded = false,
  activeVideoIndex: controlledIndex,
  onVideoIndexChange,
}) => {
  // Stable video list memoization based on deep values to prevent unnecessary re-computations
  const rawVideoSignature = useMemo(() => {
    const vStr = Array.isArray(videos) ? videos.map(v => v?.url || (v as any)?.video_url || '').join('|') : '';
    return `${vStr}##${videoUrl || ''}##${videoThumbnailUrl || ''}##${fallbackPoster || ''}`;
  }, [videos, videoUrl, videoThumbnailUrl, fallbackPoster]);

  const videoList: PropertyVideo[] = useMemo(() => {
    const list: PropertyVideo[] = [];
    if (Array.isArray(videos) && videos.length > 0) {
      list.push(...videos.filter(v => Boolean(v && (v.url || (v as any).video_url))));
    }
    if (videoUrl && !list.some(v => v.url === videoUrl)) {
      list.unshift({
        url: videoUrl,
        title: 'فيديو الجولة الرئيسية',
        thumbnail_url: videoThumbnailUrl,
        is_primary: true,
      });
    }
    return list.map(v => {
      const resolved = resolveVideoUrl(v.url || (v as any).video_url);
      return {
        ...v,
        url: resolved,
        thumbnail_url: getVideoThumbnailUrl(resolved, v.thumbnail_url || videoThumbnailUrl, fallbackPoster),
      };
    }).filter(v => Boolean(v.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawVideoSignature]);

  const [internalIndex, setInternalIndex] = useState<number>(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoPlayExecutedRef = useRef<string | null>(null);
  const currentVideo = videoList[activeIndex] || videoList[0];
  const isYouTube = currentVideo ? isYouTubeUrl(currentVideo.url) : false;
  const embedUrl = isYouTube && currentVideo ? getYouTubeEmbedUrl(currentVideo.url, isPlaying) : null;
  const poster = currentVideo?.thumbnail_url || videoThumbnailUrl || fallbackPoster;

  const handleIndexSelect = useCallback((idx: number) => {
    if (onVideoIndexChange) {
      onVideoIndexChange(idx);
    } else {
      setInternalIndex(idx);
    }
    setHasVideoError(false);
    autoPlayExecutedRef.current = null;
  }, [onVideoIndexChange]);

  // Handle Autoplay safely without re-triggering during ongoing playback
  useEffect(() => {
    setHasVideoError(false);
    if (!currentVideo || isYouTube || !videoRef.current) return;

    if (autoPlay && autoPlayExecutedRef.current !== currentVideo.url) {
      autoPlayExecutedRef.current = currentVideo.url;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // If browser blocks unmuted autoplay, retry muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
    }
  }, [currentVideo?.url, autoPlay, isYouTube]);

  // Robust play/pause toggle with resume preservation
  const handlePlayToggle = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isYouTube) {
      setIsPlaying(prev => !prev);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.warn("Video play failed, trying muted:", err);
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isYouTube]);

  const handleFullScreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    }
  }, []);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  if (!currentVideo || videoList.length === 0) {
    return null;
  }

  // =========================================================================
  // 1. EMBEDDED MODE (Directly inside property media viewer viewport)
  // =========================================================================
  if (embedded) {
    return (
      <div 
        className={`relative w-full h-full bg-black flex items-center justify-center select-none group/player ${className}`}
        dir="rtl"
      >
        {isYouTube && embedUrl ? (
          <iframe
            src={embedUrl}
            title={currentVideo.title || 'معاينة الفيديو'}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : hasVideoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/95 space-y-3 z-20">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-bold">تعذر تشغيل الفيديو داخل هذا المتصفح</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => {
                  setHasVideoError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                إعادة المحاولة
              </button>
              <a
                href={currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>مشاهدة في نافذة جديدة</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Stable HTML5 Video Node */}
            <video
              ref={videoRef}
              src={currentVideo.url}
              poster={poster}
              controls={isPlaying}
              preload="metadata"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                const err = (e.currentTarget as HTMLVideoElement).error;
                if (err && err.code > 0) {
                  setHasVideoError(true);
                }
              }}
              onClick={handlePlayToggle}
              className="w-full h-full object-contain bg-black cursor-pointer"
            />

            {/* Large Center Play / Resume Button Overlay (when paused) */}
            {!isPlaying && (
              <div
                onClick={handlePlayToggle}
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-all hover:bg-black/35 z-20 group/center"
                title="تشغيل الفيديو"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8D6A28] hover:bg-[#73541D] text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform transition-all group-hover/center:scale-110 active:scale-95">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Top Bar (Multi-Video Switcher & Fullscreen Action) */}
        <div className="absolute top-3 right-3 left-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Multi-video switch pills (if more than 1 video) */}
          {videoList.length > 1 ? (
            <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-2xl pointer-events-auto border border-white/10 max-w-[70%] overflow-x-auto">
              {videoList.map((vid, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleIndexSelect(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeIndex === idx
                      ? 'bg-[#8D6A28] text-white shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>{vid.title || `فيديو ${idx + 1}`}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl text-white text-xs font-bold border border-white/10 pointer-events-auto">
              <Sparkles className="w-3 h-3 text-[#D6A94E]" />
              <span>جولة فيديو حية</span>
            </div>
          )}

          {/* Controls: Fullscreen & Mute */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {!isYouTube && (
              <button
                type="button"
                onClick={handleMuteToggle}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition cursor-pointer"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleFullScreen}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition cursor-pointer"
              title="ملء الشاشة"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. STANDALONE CARD MODE (Used in Admin pages or standalone layouts)
  // =========================================================================
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-7 space-y-4 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#8D6A28] flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{title}</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#8D6A28]" />
                <span>جولة حية</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              استكشف تفاصيل العقار من الداخل عبر الفيديو
            </p>
          </div>
        </div>

        {/* External Link */}
        <a
          href={currentVideo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#8D6A28] hover:text-[#73541D] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 transition cursor-pointer"
        >
          <span>فتح الرابط الأصلي</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Multi-video Tabs (if more than 1 video) */}
      {videoList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100 pt-1">
          {videoList.map((vid, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleIndexSelect(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                activeIndex === idx
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Film className={`w-3.5 h-3.5 ${activeIndex === idx ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
              <span>{vid.title || `فيديو ${idx + 1}`}</span>
              {vid.is_primary && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                  الرئيسي
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Active Video Player Container */}
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner group">
        {isYouTube && embedUrl ? (
          <iframe
            src={embedUrl}
            title={currentVideo.title || 'معاينة الفيديو'}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : hasVideoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-bold">تعذر تشغيل الفيديو داخل المشغل المدمج</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => {
                  setHasVideoError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                إعادة المحاولة
              </button>
              <a
                href={currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>مشاهدة في نافذة جديدة</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={currentVideo.url}
              poster={poster}
              controls={isPlaying}
              preload="metadata"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                const err = (e.currentTarget as HTMLVideoElement).error;
                if (err && err.code > 0) {
                  setHasVideoError(true);
                }
              }}
              onClick={handlePlayToggle}
              className="w-full h-full object-contain bg-black cursor-pointer"
            />

            {/* Custom Overlay Play Button when paused */}
            {!isPlaying && (
              <div 
                onClick={handlePlayToggle}
                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all hover:bg-black/30 group/play z-10"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8D6A28] hover:bg-[#73541D] text-white flex items-center justify-center shadow-2xl backdrop-blur-xs transform transition-all group-hover/play:scale-110 active:scale-95">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video caption */}
      {currentVideo.title && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
          <span className="font-semibold text-slate-800">{currentVideo.title}</span>
          {videoList.length > 1 && (
            <span>فيديو {activeIndex + 1} من {videoList.length}</span>
          )}
        </div>
      )}
    </div>
  );
};
