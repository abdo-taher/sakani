import { useState, useEffect } from "react";

export default function Loader({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 500);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#FBF7F0",
        transition: "opacity 0.5s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="loader-3d-bullets">
        <span className="bullet" />
        <span className="bullet" />
        <span className="bullet" />
        <span className="bullet" />
        <span className="bullet" />
      </div>
      <p
        className="mt-8 text-lg tracking-wide"
        style={{ color: "#B08D57", fontFamily: "'Cairo', sans-serif" }}
      >
        جاري التحميل...
      </p>
    </div>
  );
}
