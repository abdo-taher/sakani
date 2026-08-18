import React from 'react';
import { SakaniLogo } from './SakaniLogo';
import { ActiveTab } from './BottomNav';
import { StorageService } from '../services/storageService';
import { 
  Phone, 
  Mail, 
  Share2, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ChevronLeft,
  MessageCircle,
  Facebook,
  Instagram
} from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNeedModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenNeedModal,
}) => {
  const settings = StorageService.getSettings();
  const phone = settings.phone || settings.company_phone || '01067725976';
  const rawWhatsapp = settings.whatsapp || settings.company_whatsapp || '201067725976';
  const whatsappNum = String(rawWhatsapp).replace(/\D/g, '');
  const email = settings.email || settings.company_email || 'info@sakani.site';
  const address = settings.address || settings.company_address || 'دمياط الجديدة - المنطقة المركزية';
  const commissionText = settings.commission_text || 'عمولة الوساطة 2.5% تدفع عند إتمام التعاقد فقط، والمعاينة مجانية تماماً';

  return (
    <footer className="bg-[#0F172A] text-white pt-14 pb-24 md:pb-12 border-t border-slate-800" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Col 1: Brand & About */}
          <div className="md:col-span-2 space-y-4">
            <SakaniLogo size="lg" variant="light" />
            <p className="text-slate-400 text-sm leading-relaxed max-w-md font-medium">
              {settings.about || 'سكني هي المنصة العقارية الأولى المتخصصة في مدينة دمياط الجديدة والمناطق الساحلية المجاورة، نوفر لك تجربة بيع وشراء وتأجير عقارات سلسة ومضمونة مع استشارات هندسية وقانونية متكاملة.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={`tel:${phone}`}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-[#8D6A28] text-white flex items-center justify-center transition shadow-sm"
                title="اتصال مباشر"
              >
                <Phone className="w-4 h-4" />
              </a>

              <a
                href={`mailto:${email}`}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-[#8D6A28] text-white flex items-center justify-center transition shadow-sm"
                title="البريد الإلكتروني"
              >
                <Mail className="w-4 h-4" />
              </a>

              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-sm"
                title="واتساب"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center transition shadow-sm"
                  title="فيسبوك"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}

              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-pink-600 text-white flex items-center justify-center transition shadow-sm"
                  title="انستجرام"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-[#8D6A28] tracking-wider uppercase">
              روابط المنصة
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li>
                <button onClick={() => onSelectTab('home')} className="hover:text-[#8D6A28] transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('search')} className="hover:text-[#8D6A28] transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  عقارات للبيع في دمياط الجديدة
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('search')} className="hover:text-[#8D6A28] transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  شقق للإيجار وسكن مفروش
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('sell')} className="hover:text-[#8D6A28] transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  أضف عقارك للبيع أو الإيجار
                </button>
              </li>
              <li>
                <button onClick={onOpenNeedModal} className="hover:text-[#8D6A28] transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  طلب عقار بمواصفات خاصة
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details & Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-[#8D6A28] tracking-wider uppercase">
              تواصل معنا
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8D6A28] shrink-0" />
                <span className="truncate">{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#8D6A28] shrink-0" />
                <a href={`tel:${phone}`} className="font-mono hover:text-[#8D6A28] transition" dir="ltr">{phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8D6A28] shrink-0" />
                <a href={`mailto:${email}`} className="font-mono hover:text-[#8D6A28] transition">{email}</a>
              </li>
              <li className="flex items-center gap-2 pt-1 text-emerald-400 font-bold text-[11px] leading-snug">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{commissionText}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>
            جميع الحقوق محفوظة © {settings.site_name || 'سكني'} {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <button onClick={() => onSelectTab('contact')} className="hover:text-white transition cursor-pointer">عن سكني</button>
            <span>•</span>
            <button onClick={() => onSelectTab('contact')} className="hover:text-white transition cursor-pointer">الشروط والأحكام</button>
          </div>
        </div>

      </div>
    </footer>
  );
};
