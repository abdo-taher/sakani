import { useState, useEffect } from "react";

export default function Loader({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 600);
    }, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #FBF7F0 0%, #F3E8D5 40%, #FBF7F0 100%)",
        transition: "opacity 0.6s ease, visibility 0.6s ease",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="loader-orb loader-orb-1" />
        <div className="loader-orb loader-orb-2" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10 loader-brand"
          style={{ color: "#4A2E1F", fontFamily: "'Cairo', sans-serif" }}
        >
          سكنى
        </h1>

        <div className="loader__balls">
          <div className="loader__balls__group">
            <div className="ball item1" />
            <div className="ball item2" />
            <div className="ball item3" />
          </div>
          <div className="loader__balls__group">
            <div className="ball item1" />
            <div className="ball item2" />
            <div className="ball item3" />
          </div>
          <div className="loader__balls__group">
            <div className="ball item1" />
            <div className="ball item2" />
            <div className="ball item3" />
          </div>
        </div>

        <p
          className="mt-8 text-sm font-bold tracking-widest loader-text"
          style={{ color: "#B08D57", fontFamily: "'Cairo', sans-serif" }}
        >
          جاري التحميل
          <span className="loader-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </p>
      </div>
    </div>
  );
}
