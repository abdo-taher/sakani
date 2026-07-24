import { useState, useRef, useEffect } from "react";
import { Video } from "lucide-react";

function VideoThumb({ src, className = "", alt = "" }) {
  const [thumb, setThumb] = useState(null);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!src) { setFailed(true); return; }
    abortRef.current = false;
    setThumb(null);
    setFailed(false);
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.currentTime = 0.5;
    const onLoaded = () => {
      if (abortRef.current) { v.remove(); return; }
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 320;
        c.height = v.videoHeight || 180;
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        setThumb(c.toDataURL("image/jpeg", 0.6));
      } catch { setFailed(true); }
      v.remove();
    };
    v.onerror = () => { if (!abortRef.current) { setFailed(true); v.remove(); } };
    v.onloadeddata = onLoaded;
    return () => {
      abortRef.current = true;
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.remove();
    };
  }, [src]);

  if (thumb) {
    return <img src={thumb} alt={alt} className={className} loading="lazy" />;
  }

  if (failed) {
    return (
      <div className={`relative overflow-hidden bg-stone-800 ${className}`}>
        {/* Show a solid background with video icon instead of trying to load external image */}
        <div className="w-full h-full bg-gradient-to-br from-stone-600 to-stone-800" style={{ opacity: 0.7 }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Video size={24} color="white" style={{ opacity: 0.9 }} />
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-white font-medium" style={{ opacity: 0.8 }}>
          فيديو غير متاح
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-stone-800 ${className}`}>
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.7 }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Video size={24} color="white" style={{ opacity: 0.7 }} />
      </div>
    </div>
  );
}

export default VideoThumb;