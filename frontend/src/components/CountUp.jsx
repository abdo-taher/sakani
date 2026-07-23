
import React, { useState, useEffect, useRef } from "react";


/* عداد أرقام متحرك */
function CountUp({ value, duration = 900 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setN(Math.floor(progress * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span ref={ref}>{n}</span>;
}

export default CountUp;
