import { useState, useRef, useEffect } from "react";
import { PlayCircle } from "lucide-react";

function VideoThumb({ src, posterUrl, className = "", alt = "" }) {
  const [thumb, setThumb] = useState(posterUrl || null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    if (posterUrl) {
      setThumb(posterUrl);
      setFailed(false);
      return;
    }
    if (!src) { 
      setFailed(true); 
      return; 
    }
    
    abortRef.current = false;
    setThumb(null);
    setFailed(false);
    setLoading(true);
    
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.currentTime = 1; // Get frame at 1 second

    const onLoaded = () => {
      if (abortRef.current) { 
        v.remove(); 
        return; 
      }
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 320;
        c.height = v.videoHeight || 180;
        const ctx = c.getContext("2d");
        ctx.drawImage(v, 0, 0, c.width, c.height);
        setThumb(c.toDataURL("image/jpeg", 0.8));
        setLoading(false);
      } catch (error) {
        console.log("Failed to generate thumbnail:", error);
        setFailed(true);
        setLoading(false);
      }
      v.remove();
    };

    const onError = () => { 
      if (!abortRef.current) { 
        setFailed(true); 
        setLoading(false);
        v.remove(); 
      } 
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("error", onError);

    return () => {
      abortRef.current = true;
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("error", onError);
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.remove();
    };
  }, [src, posterUrl]);

  // Show generated thumbnail with play button overlay
  if (thumb) {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={thumb} 
          alt={alt} 
          className="w-full h-full object-cover" 
          loading="lazy" 
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
            <PlayCircle className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while generating thumbnail
  if (loading) {
    return (
      <div className={`relative bg-stone-700 ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-stone-600 to-stone-800 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Show fallback when thumbnail generation failed
  if (failed) {
    return (
      <div className={`relative bg-stone-700 ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-stone-600 to-stone-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="w-12 h-12 text-white opacity-80" />
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-white font-medium opacity-70">
          فيديو
        </div>
      </div>
    );
  }

  // Initial loading state
  return (
    <div className={`relative bg-stone-700 ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-stone-600 to-stone-800" />
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayCircle className="w-12 h-12 text-white opacity-60" />
      </div>
    </div>
  );
}

export default VideoThumb;