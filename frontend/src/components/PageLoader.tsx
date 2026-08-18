import React from 'react';
import { SakaniLogo } from './SakaniLogo';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'جاري تحميل البيانات والعقارات...',
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center ${
        fullScreen ? 'min-h-[65vh] w-full' : 'py-12 w-full'
      }`}
      dir="rtl"
    >
      <div className="relative flex items-center justify-center mb-5">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-20 h-20 rounded-full bg-[#8D6A28]/20 animate-ping" />
        
        {/* Rotating gold spinner ring */}
        <div className="w-16 h-16 rounded-full border-3 border-slate-200 border-t-[#8D6A28] border-r-[#8D6A28] animate-spin" />

        {/* Center Logo Icon */}
        <div className="absolute w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100">
          <SakaniLogo size="sm" showText={false} />
        </div>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-sm font-bold text-slate-800 animate-pulse">
          {message}
        </h3>
        <p className="text-[11px] text-slate-400 font-medium">
          منصة سكنك الأولى في دمياط الجديدة 🏡
        </p>
      </div>

      {/* Sleek bottom loader bar */}
      <div className="w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4 border border-slate-200/60">
        <div className="h-full bg-gradient-to-r from-[#9F7425] via-[#D4AF37] to-[#805C1C] rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};
