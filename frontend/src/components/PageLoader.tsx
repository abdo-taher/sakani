import React from 'react';

export interface PageLoaderProps {
  /** Primary title or brand name */
  message?: string;
  /** Secondary subtitle text */
  subMessage?: string;
  /** Backward compatibility: array of stages (ignored in unified loader) */
  stages?: string[];
  /** Fullscreen overlay mode */
  fullScreen?: boolean;
  /** Visual variant */
  variant?: 'fullscreen' | 'page' | 'section' | 'card' | 'inline' | 'minimal';
  /** Color theme */
  theme?: 'light' | 'dark' | 'glass';
  /** Show progress bar */
  showProgress?: boolean;
  /** Show security badge */
  showBadge?: boolean;
  /** Size multiplier */
  size?: 'sm' | 'md' | 'lg';
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'سَـكَـنِـي',
  subMessage = 'منصة عقارات دمياط الجديدة الأولى',
  fullScreen = true,
  variant,
}) => {
  const isFullScreen = variant === 'fullscreen' || (fullScreen && variant !== 'inline' && variant !== 'section' && variant !== 'card');

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 z-[99999] min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#0F172A] p-4'
          : 'min-h-[50vh] flex flex-col items-center justify-center bg-transparent text-[#0F172A] p-4'
      }
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-[380px] w-full mx-auto p-4 animate-fade-in">
        {/* Sakani Brand Spinning Emblem (Matches index.html Loader 1 1-to-1) */}
        <div className="relative w-[68px] h-[68px] mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#8D6A28]/15" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#8D6A28] animate-spin" />
          <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center shadow-md">
            <span className="font-black text-xl text-[#D6A94E] font-['Cairo']">س</span>
          </div>
        </div>

        <h1 className="text-[1.35rem] font-black text-[#0F172A] mb-1.5 font-['Cairo'] tracking-tight">
          {message}
        </h1>
        <p className="text-[0.8125rem] font-semibold text-[#64748B] font-['Cairo'] m-0">
          {subMessage}
        </p>
      </div>
    </div>
  );
};

export const EnterpriseLoader = PageLoader;
export default PageLoader;
