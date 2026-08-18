import React from 'react';
import { Building2, Sparkles } from 'lucide-react';

interface SakaniBrandedLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const SakaniBrandedLoader: React.FC<SakaniBrandedLoaderProps> = ({
  message = 'جاري التحميل...',
  fullScreen = true,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in" dir="rtl">
      {/* Branded Golden Logo Pulse */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl gold-gradient flex items-center justify-center shadow-xl shadow-[#8D6A28]/20 animate-pulse">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Brand Name & Typography */}
      <h2 className="text-2xl font-black text-slate-900 tracking-wide mb-1">
        سَــكــنــي
      </h2>
      <p className="text-xs font-bold text-[#8D6A28] uppercase tracking-widest mb-3">
        SAKANI REAL ESTATE
      </p>

      {/* Spinner bar */}
      <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className="h-full gold-gradient rounded-full w-1/2 animate-shimmer" />
      </div>

      <p className="text-xs font-semibold text-slate-500">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      {content}
    </div>
  );
};
