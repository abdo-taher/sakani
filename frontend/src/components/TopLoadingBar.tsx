import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface TopLoadingBarProps {
  isLoading?: boolean;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ isLoading = false }) => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger on route change
    setVisible(true);
    setProgress(28);

    const timer1 = setTimeout(() => {
      setProgress(72);
    }, 100);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }, 320);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(65);
    } else if (visible && progress === 65) {
      setProgress(100);
      const t = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999999] h-[3.5px] pointer-events-none overflow-hidden bg-transparent select-none">
      <div
        className="h-full bg-gradient-to-r from-[#9F7425] via-[#F5D77F] to-[#805C1C] transition-all duration-300 ease-out shadow-[0_0_14px_rgba(212,175,55,0.95)] relative"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Leading edge golden light spark */}
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white via-amber-200 to-transparent shadow-[0_0_12px_#FFF]" />
      </div>
    </div>
  );
};

