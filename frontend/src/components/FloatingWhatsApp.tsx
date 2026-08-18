import React from 'react';
import { MessageCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';

export const FloatingWhatsApp: React.FC = () => {
  const handleClick = () => {
    const settings = StorageService.getSettings();
    const rawNum = settings.whatsapp || settings.company_whatsapp || '201067725976';
    const whatsappNum = String(rawNum).replace(/\D/g, '');
    const text = encodeURIComponent('السلام عليكم، أود الاستفسار عن العقارات المتاحة في دمياط الجديدة عبر منصة سكني.');
    window.open(`https://wa.me/${whatsappNum}?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 md:bottom-6 left-5 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
      title="تواصل معنا عبر واتساب"
      aria-label="تواصل عبر واتساب"
    >
      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30 pointer-events-none" />
      <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 relative z-10" />
      
      {/* Tooltip on desktop */}
      <span className="hidden sm:group-hover:flex absolute right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-md pointer-events-none items-center gap-1">
        تحدث مع المستشار العقاري
      </span>
    </button>
  );
};
