import { useState, useRef, useEffect } from "react";

function VideoThumb({ src, className = "", alt = "" }) {
  const videoRef = useRef(null);
  const [thumb, setThumb] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!src) return;
    abortRef.current = false;
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
      } catch {}
      v.remove();
    };
    v.onloadeddata = onLoaded;
    v.onerror = () => { if (!abortRef.current) v.remove(); };
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

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      preload="none"
      className={className}
    />
  );
}

export default VideoThumb;
