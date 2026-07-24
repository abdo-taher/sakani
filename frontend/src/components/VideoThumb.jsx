import { useState, useRef, useEffect } from "react";

function VideoThumb({ src, className = "", alt = "" }) {
  const videoRef = useRef(null);
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    if (!src) return;
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.currentTime = 0.5;
    const onLoaded = () => {
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
    v.onerror = () => v.remove();
    return () => v.remove();
  }, [src]);

  if (thumb) {
    return <img src={thumb} alt={alt} className={className} />;
  }

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      preload="metadata"
      className={className}
    />
  );
}

export default VideoThumb;
