import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  X, 
  ExternalLink, 
  Smartphone, 
  Globe, 
  Sparkles,
  Building2,
  Phone,
  Layers
} from 'lucide-react';
import { StorageService } from '../services/storageService';

interface QRCodeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'website' | 'install_app' | 'custom';
  customUrl?: string;
  customTitle?: string;
}

export const QRCodeShareModal: React.FC<QRCodeShareModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'website',
  customUrl,
  customTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'website' | 'install_app' | 'custom'>(initialMode);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const settings = StorageService.getSettings();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sakani.site';

  const getTargetUrl = () => {
    if (activeTab === 'install_app') {
      return `${baseUrl}/#/properties?pwa_install=true&source=qr`;
    }
    if (activeTab === 'custom' && customUrl) {
      return customUrl.startsWith('http') ? customUrl : `${baseUrl}${customUrl.startsWith('/') ? '' : '/'}${customUrl}`;
    }
    return `${baseUrl}/`;
  };

  const getTargetTitle = () => {
    if (activeTab === 'install_app') {
      return 'تثبيت تطبيق سكني على الهاتف';
    }
    if (activeTab === 'custom' && customTitle) {
      return customTitle;
    }
    return settings.site_name || 'منصة سكني — عقارات دمياط الجديدة';
  };

  const getTargetSubtitle = () => {
    if (activeTab === 'install_app') {
      return 'امسح الرمز بكاميرا الموبايل لتثبيت التطبيق على الشاشة الرئيسية فوراً وبدون متجر التطبيقات';
    }
    return 'امسح الرمز للوصول المباشر إلى المنصة وتصفح أحدث عقارات وسكن دمياط الجديدة';
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      generateQr(getTargetUrl());
    }
  }, [isOpen, initialMode, activeTab, customUrl]);

  const generateQr = async (url: string) => {
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 480,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.warn('QR generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const url = getTargetUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `sakani-qr-${activeTab}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const url = getTargetUrl();
    const title = getTargetTitle();
    const text = `${title}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: getTargetSubtitle(),
          url,
        });
      } catch (e) {}
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const url = getTargetUrl();
    const title = getTargetTitle();
    const subtitle = getTargetSubtitle();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة رمز الاستجابة السريع — منصة سكني</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            text-align: center;
            margin: 0;
            padding: 40px;
            background: #fff;
            color: #0F172A;
          }
          .poster {
            max-width: 480px;
            margin: 0 auto;
            border: 3px solid #8D6A28;
            border-radius: 32px;
            padding: 36px 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          }
          .logo-badge {
            display: inline-block;
            background: #0F172A;
            color: #D6A94E;
            padding: 8px 20px;
            border-radius: 9999px;
            font-weight: 900;
            font-size: 16px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 26px;
            margin: 8px 0;
            color: #0F172A;
          }
          p {
            font-size: 14px;
            color: #475569;
            margin-top: 4px;
            margin-bottom: 24px;
          }
          .qr-img {
            width: 260px;
            height: 260px;
            border: 8px solid #F8FAFC;
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          }
          .url-box {
            margin-top: 20px;
            padding: 10px;
            background: #F8FAFC;
            border-radius: 12px;
            font-family: monospace;
            font-weight: bold;
            color: #8D6A28;
            direction: ltr;
            font-size: 14px;
          }
          .footer-note {
            margin-top: 24px;
            font-size: 12px;
            color: #64748B;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="poster">
          <div class="logo-badge">🏡 منصة سكني العقارية</div>
          <h1>${title}</h1>
          <p>${subtitle}</p>
          <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
          <div class="url-box">${url}</div>
          <div class="footer-note">امسح الكود بكاميرا الهاتف المحمول للوصول الفوري</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn" dir="rtl">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div 
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-900/10 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#8D6A28] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-[#8D6A28] text-white flex items-center justify-center shadow-lg shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  <Sparkles className="w-3 h-3 inline ml-1" />
                  مشاركة فورية
                </span>
                <span className="text-[11px] text-slate-300 font-medium">QR Code Hub</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                رمز الاستجابة السريع ومشاركة المنصة
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-100/80 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('website')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'website'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#8D6A28]" />
            <span>رابط الموقع</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('install_app')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'install_app'
                ? 'bg-white text-[#8D6A28] shadow-xs border border-amber-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>تثبيت التطبيق (PWA)</span>
          </button>

          {customUrl && (
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>الصفحة الحالية</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-center flex-1" ref={printRef}>
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900">
              {getTargetTitle()}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {getTargetSubtitle()}
            </p>
          </div>

          {/* QR Code Container with Gold Accent Frame */}
          <div className="relative inline-block p-3 rounded-3xl bg-gradient-to-br from-amber-100/60 via-slate-50 to-amber-50 border-2 border-amber-200/80 shadow-md">
            {isGenerating || !qrDataUrl ? (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-white rounded-2xl">
                <div className="w-8 h-8 border-3 border-[#8D6A28] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={qrDataUrl} 
                  alt="Sakani QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-white p-2 shadow-inner object-contain mx-auto" 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-[#0F172A] border-2 border-amber-400/80 shadow-lg flex items-center justify-center text-base">
                    🏡
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct URL String Box */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            <span className="truncate flex-1 text-right dir-ltr select-all" dir="ltr">
              {getTargetUrl()}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-sans text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8D6A28]" />
            <span>تحميل PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>طباعة بوستر</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مشاركة</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-black transition flex items-center justify-center cursor-pointer shadow-xs"
          >
            <span>تم</span>
          </button>
        </div>

      </div>
    </div>
  );
};
