
import React, { useState, useEffect, useRef } from "react";

/* عداد أرقام متحرك */
function CountUp({ value, duration = 900 }) {
  const [n, setN] = useState(value); // Start with final value to prevent showing 0
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          // Small delay before starting animation to prevent 0 flash
          setTimeout(() => {
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
          }, 100); // 100ms delay
        }
      },
      { threshold: 0.3 } // Increase threshold to trigger later
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
