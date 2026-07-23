import React, { useRef, useState, useEffect } from "react";

/* مكوّن يظهر عناصره بأنيميشن لما يدخلوا في الشاشة أثناء السكرول */
function Reveal({ children, className = "", delay = 0, as = "div", style, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`${className} ${visible ? "reveal-in" : "reveal-out"}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
