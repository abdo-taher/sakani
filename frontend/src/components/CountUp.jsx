
import React, { useState, useEffect, useRef } from "react";

/* عداد أرقام متحرك */
function CountUp({ value, duration = 900 }) {
  const [n, setN] = useState(value); // Start with the final value instead of 0
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          setN(0); // Now start from 0
          
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
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [value, duration, hasAnimated]);
  
  return <span ref={ref}>{n}</span>;
}

export default CountUp;
