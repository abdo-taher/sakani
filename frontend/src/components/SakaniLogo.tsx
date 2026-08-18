import React from 'react';

interface SakaniLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'light';
}

export const SakaniLogo: React.FC<SakaniLogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'full'
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const isLight = variant === 'light';
  const navyColor = isLight ? '#FFFFFF' : '#0F172A';
  const goldColor = '#8D6A28';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`} dir="rtl">
      {/* Geometric House Logo mark from Image 5.jpeg */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-sm" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Dark/Navy Roof & Chimney & Frame */}
          <path 
            d="M50 12L15 42V84H85V42L50 12Z" 
            stroke={navyColor} 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Chimney */}
          <path 
            d="M28 31V16H38V22" 
            stroke={navyColor} 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Inner Golden House & Arched Doorway */}
          <path 
            d="M50 32L26 54V84H74V54L50 32Z" 
            stroke={goldColor} 
            strokeWidth="6.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Arched Doorway */}
          <path 
            d="M40 84V64C40 58.4772 44.4772 54 50 54C55.5228 54 60 58.4772 60 64V84" 
            stroke={goldColor} 
            strokeWidth="6" 
            strokeLinecap="round"
          />
          {/* Base line */}
          <path 
            d="M10 84H90" 
            stroke={navyColor} 
            strokeWidth="7" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {variant !== 'icon-only' && (
        <div className="flex flex-col leading-none">
          <span 
            className={`font-black tracking-tight font-['Cairo'] ${textSizes[size]}`}
            style={{ color: navyColor }}
          >
            سَكَنِي
          </span>
          {size === 'xl' || size === 'lg' ? (
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 tracking-wider">
              عقارات دمياط الجديدة
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
