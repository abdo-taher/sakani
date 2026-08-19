import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export interface PageLoaderProps {
  /** Primary loading title */
  message?: string;
  /** Secondary subtitle text */
  subMessage?: string;
  /** Optional array of progressive stage texts that cycle automatically */
  stages?: string[];
  /** Backward compatibility: true renders fullscreen overlay */
  fullScreen?: boolean;
  /** Visual variant */
  variant?: 'fullscreen' | 'page' | 'section' | 'card' | 'inline' | 'minimal';
  /** Color theme */
  theme?: 'light' | 'dark' | 'glass';
  /** Show the animated precision gold progress bar */
  showProgress?: boolean;
  /** Show the enterprise security & verification chip */
  showBadge?: boolean;
  /** Size multiplier */
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_STAGES = [
  'جاري الاتصال بالخادم والتحقق من البيانات...',
  'جاري استرداد أحدث العقارات الموثقة والمعاينات...',
  'جاري تحسين صور العرض وتجهيز الخرائط التفاعلية...',
];

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'جاري تجهيز البيانات والعقارات...',
  subMessage = 'منصة سكنك الأولى في دمياط الجديدة 🏡',
  stages = DEFAULT_STAGES,
  fullScreen = true,
  variant,
  theme = 'light',
  showProgress = true,
  showBadge = true,
  size = 'md',
}) => {
  // Determine active display mode
  const effectiveVariant = variant || (fullScreen ? 'fullscreen' : 'page');

  // Automatic stage progression
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageFade, setStageFade] = useState(true);

  useEffect(() => {
    if (!stages || stages.length <= 1) return;

    const interval = setInterval(() => {
      setStageFade(false);
      setTimeout(() => {
        setCurrentStageIdx((prev) => (prev + 1) % stages.length);
        setStageFade(true);
      }, 200);
    }, 2200);

    return () => clearInterval(interval);
  }, [stages]);

  const activeStageText = stages && stages.length > 0 ? stages[currentStageIdx] : message;

  // Sizes configuration
  const emblemSizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  }[size];

  const houseIconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  // Minimal variant for compact buttons or tiny containers
  if (effectiveVariant === 'minimal' || effectiveVariant === 'inline') {
    return (
      <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-[#8D6A28]/20 backdrop-blur-xs select-none" dir="rtl">
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-[#8D6A28]/20 border-t-[#8D6A28] animate-spin" />
          <svg viewBox="0 0 100 100" className="w-2.5 h-2.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15L15 45V85H85V45L50 15Z" stroke="#8D6A28" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-xs font-bold text-slate-700">{message}</span>
      </div>
    );
  }

  // Enterprise Brand Core Graphic
  const BrandEmblem = (
    <div className="relative flex items-center justify-center my-2 select-none">
      {/* 1. Ambient Golden Breathing Aura */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#9F7425]/20 via-[#DFB757]/30 to-amber-500/10 blur-xl animate-enterprise-glow pointer-events-none" />

      {/* 2. Outer Rotating Orbital Track */}
      <div className="absolute w-[115%] h-[115%] rounded-full border border-dashed border-[#8D6A28]/35 animate-enterprise-orbit pointer-events-none" />

      {/* 3. Inner Reverse Orbital Track with Micro Light Particle */}
      <div className="absolute w-[130%] h-[130%] rounded-full border border-[#8D6A28]/15 animate-enterprise-orbit-reverse pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-amber-300 to-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
      </div>

      {/* 4. Luxury Glassmorphic Shield & House Center */}
      <div className={`relative ${emblemSizeClasses} rounded-3xl bg-gradient-to-b from-white/95 via-slate-50/90 to-amber-50/50 dark:from-slate-900/90 dark:to-slate-950/90 border border-amber-500/25 shadow-[0_12px_36px_rgba(141,106,40,0.18)] backdrop-blur-xl flex items-center justify-center transition-transform hover:scale-105 duration-300`}>
        {/* Animated House Icon */}
        <div className={`relative ${houseIconSizes} flex items-center justify-center animate-float-gentle`}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Navy Frame */}
            <path
              d="M50 12L15 42V84H85V42L50 12Z"
              stroke="#0F172A"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Chimney */}
            <path
              d="M28 31V16H38V22"
              stroke="#0F172A"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Golden House */}
            <path
              d="M50 32L26 54V84H74V54L50 32Z"
              stroke="#8D6A28"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-stroke-draw"
            />
            {/* Arched Doorway */}
            <path
              d="M40 84V64C40 58.4772 44.4772 54 50 54C55.5228 54 60 58.4772 60 64V84"
              stroke="#8D6A28"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Base line */}
            <path
              d="M10 84H90"
              stroke="#0F172A"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Micro Sparkle Indicator */}
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-tr from-[#9F7425] to-[#DFB757] text-white flex items-center justify-center shadow-md shadow-amber-900/20 border border-white/60 animate-bounce">
          <Sparkles className="w-3 h-3 text-amber-100" />
        </div>
      </div>
    </div>
  );

  // Main Content Structure
  const Content = (
    <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4 animate-fade-in" dir="rtl">
      {BrandEmblem}

      {/* Brand Heading & Typography */}
      <div className="mt-4 mb-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Cairo'] flex items-center justify-center gap-1.5">
          <span className="bg-gradient-to-r from-slate-950 via-[#8D6A28] to-slate-900 bg-clip-text text-transparent">
            سَــكَـنِــي
          </span>
        </h2>
        <p className="text-[10px] sm:text-[11px] font-bold text-[#8D6A28] uppercase tracking-widest mt-0.5">
          SAKANI ENTERPRISE REAL ESTATE
        </p>
      </div>

      {/* Dynamic Stage Progression Message */}
      <div className="h-10 flex items-center justify-center my-1.5">
        <p
          className={`text-xs sm:text-sm font-bold text-slate-800 transition-all duration-200 transform ${
            stageFade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95'
          }`}
        >
          {activeStageText}
        </p>
      </div>

      {/* Subtitle Message */}
      <p className="text-[11px] text-slate-400 font-medium max-w-xs mb-3">
        {subMessage}
      </p>

      {/* Sleek Precision Enterprise Progress Bar */}
      {showProgress && (
        <div className="w-48 sm:w-56 h-1.5 bg-slate-100/90 rounded-full overflow-hidden relative border border-slate-200/70 shadow-inner my-2">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-[#9F7425] via-[#F5D77F] to-[#805C1C] rounded-full shadow-[0_0_12px_rgba(212,175,55,0.7)] animate-enterprise-shimmer" />
        </div>
      )}

      {/* Enterprise Security & Verification Chip */}
      {showBadge && (
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 shadow-xs backdrop-blur-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>منصة معتمدة • اتصال آمن 256-bit</span>
        </div>
      )}
    </div>
  );

  // Fullscreen Overlay
  if (effectiveVariant === 'fullscreen') {
    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl animate-fade-in"
        dir="rtl"
        aria-live="polite"
        role="status"
      >
        <div className="w-full max-w-md bg-white/95 rounded-3xl p-8 sm:p-10 border border-amber-500/20 shadow-[0_24px_64px_rgba(15,23,42,0.25)] relative overflow-hidden backdrop-blur-2xl">
          {/* Subtle decorative gold light flare */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#9F7425]/15 to-transparent rounded-full blur-2xl pointer-events-none" />
          {Content}
        </div>
      </div>
    );
  }

  // Section / Card Container Variant
  if (effectiveVariant === 'section' || effectiveVariant === 'card') {
    return (
      <div
        className="w-full py-12 px-6 rounded-3xl bg-white/85 border border-slate-200/80 shadow-xs backdrop-blur-sm flex items-center justify-center"
        dir="rtl"
        role="status"
      >
        {Content}
      </div>
    );
  }

  // Standard In-Page Loader
  return (
    <div
      className="w-full min-h-[60vh] flex items-center justify-center p-6"
      dir="rtl"
      role="status"
    >
      {Content}
    </div>
  );
};

// Aliases for convenience & enterprise naming conventions
export const EnterpriseLoader = PageLoader;
export default PageLoader;
