import React, { useState } from 'react';
import { Video, Play, ExternalLink, Sparkles, Film, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PropertyVideo } from '../types';
import { isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnail, resolveVideoUrl } from '../utils/media';

interface PropertyMultiVideoPlayerProps {
  videos?: PropertyVideo[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  fallbackPoster?: string;
  className?: string;
  title?: string;
}

export const PropertyMultiVideoPlayer: React.FC<PropertyMultiVideoPlayerProps> = ({
  videos = [],
  videoUrl,
  videoThumbnailUrl,
  fallbackPoster,
  className = '',
  title = 'فيديوهات المعاينة والجولة الميدانية',
}) => {
  // Consolidate video list
  const videoList: PropertyVideo[] = React.useMemo(() => {
    const list: PropertyVideo[] = [];
    if (Array.isArray(videos) && videos.length > 0) {
      list.push(...videos.filter(v => v && (v.url || (v as any).video_url)));
    }
    if (videoUrl && !list.some(v => v.url === videoUrl)) {
      list.unshift({
        url: videoUrl,
        title: 'فيديو الجولة الرئيسية',
        thumbnail_url: videoThumbnailUrl,
        is_primary: true,
      });
    }
    return list.map(v => ({
      ...v,
      url: resolveVideoUrl(v.url || (v as any).video_url),
      thumbnail_url: v.thumbnail_url || (isYouTubeUrl(v.url) ? getYouTubeThumbnail(v.url) || undefined : undefined),
    })).filter(v => Boolean(v.url));
  }, [videos, videoUrl, videoThumbnailUrl]);

  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  if (videoList.length === 0) {
    return null;
  }

  const currentVideo = videoList[activeVideoIndex] || videoList[0];
  const isYouTube = isYouTubeUrl(currentVideo.url);
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(currentVideo.url) : null;
  const poster = currentVideo.thumbnail_url || videoThumbnailUrl || fallbackPoster;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-7 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#8D6A28] flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
              {videoList.length > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#8D6A28] text-[11px] font-bold">
                  {videoList.length} فيديوهات
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              معاينة مرئية واقعية بدقة عالية لكافة تفاصيل وأرجاء العقار
            </p>
          </div>
        </div>

        {/* External Link */}
        <a
          href={currentVideo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#8D6A28] hover:text-[#73541D] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 transition"
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
              onClick={() => {
                setActiveVideoIndex(idx);
                setHasVideoError(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                activeVideoIndex === idx
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Film className={`w-3.5 h-3.5 ${activeVideoIndex === idx ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
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

      {/* Active Video Player */}
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
            <p className="text-sm font-bold">تعذر تشغيل الفيديو داخل الصفحة مباشرة</p>
            <a
              href={currentVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold transition flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>مشاهدة الفيديو في نافذة جديدة</span>
            </a>
          </div>
        ) : (
          <video
            key={currentVideo.url}
            src={currentVideo.url}
            poster={poster}
            controls
            preload="metadata"
            playsInline
            onError={() => setHasVideoError(true)}
            className="w-full h-full object-cover"
          >
            <source src={currentVideo.url} type="video/mp4" />
            <source src={currentVideo.url} type="video/webm" />
            <source src={currentVideo.url} type="video/quicktime" />
            متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
          </video>
        )}
      </div>

      {/* Video caption or subtitle */}
      {currentVideo.title && videoList.length > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
          <span className="font-semibold text-slate-800">{currentVideo.title}</span>
          <span>فيديو {activeVideoIndex + 1} من {videoList.length}</span>
        </div>
      )}
    </div>
  );
};
