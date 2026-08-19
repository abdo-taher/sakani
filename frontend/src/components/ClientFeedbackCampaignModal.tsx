import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Heart, 
  MessageSquare, 
  Send, 
  Star, 
  ThumbsUp, 
  HelpCircle,
  MessageCircle,
  Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { FeedbackCampaign } from '../types';

export const ClientFeedbackCampaignModal: React.FC = () => {
  const [activeCampaign, setActiveCampaign] = useState<FeedbackCampaign | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    // 0. Check admin settings
    const settings = StorageService.getSettings();
    if (settings?.feedback_enabled === false) {
      return;
    }

    // Never show client feedback survey to admin or on admin dashboard routes
    if (typeof window !== 'undefined') {
      const isHashAdmin = window.location.hash.startsWith('#/admin');
      const isPathAdmin = window.location.pathname.startsWith('/admin');
      const isAdmin = StorageService.isAdminLoggedIn();
      if (isHashAdmin || isPathAdmin || isAdmin) {
        return;
      }
    }

    let isMounted = true;
    let timer: any = null;

    const initCampaign = async () => {
      try {
        const page = window.location.pathname.replace(/^\//, '') || 'home';
        let camp = await ApiService.getActiveFeedbackCampaign(page);
        if (!camp) {
          camp = StorageService.getActiveFeedbackCampaign(page);
        }

        if (!camp || !isMounted) return;

        // Check if already answered or dismissed
        if (StorageService.hasClientAnsweredCampaign(camp.id)) {
          return;
        }

        // Use campaign-specific delay or fallback to settings
        const delaySeconds = camp.delay_seconds || settings?.feedback_delay_seconds || 60;
        const delayMs = Math.max(3000, delaySeconds * 1000);

        timer = setTimeout(() => {
          if (!isMounted) return;
          if (StorageService.isAdminLoggedIn()) return;
          if (window.location.hash.startsWith('#/admin') || window.location.pathname.startsWith('/admin')) return;

          // Auto-fill saved client phone if available
          const savedPhone = StorageService.getClientPhone();
          if (savedPhone) setClientPhone(savedPhone);

          setActiveCampaign(camp);
          setIsOpen(true);
        }, delayMs);
      } catch (err) {
        console.warn('Feedback campaign init error:', err);
      }
    };

    initCampaign();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    if (activeCampaign) {
      StorageService.setClientAnsweredCampaign(activeCampaign.id);
    }
    setIsOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeCampaign || isSubmitting) return;

    setIsSubmitting(true);

    const selectedOption = activeCampaign.options?.find(o => o.id === selectedOptionId);

    const payload = {
      campaign_id: activeCampaign.id,
      campaign_title: activeCampaign.title,
      client_name: clientName.trim() || undefined,
      client_phone: clientPhone.trim() || StorageService.getClientPhone() || undefined,
      rating: activeCampaign.type === 'rating' || activeCampaign.type === 'net_promoter' ? rating : undefined,
      selected_option_id: selectedOptionId || undefined,
      selected_option_label: selectedOption?.label || undefined,
      comment: comment.trim() || undefined,
      page_url: window.location.hash || window.location.pathname,
      device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
    };

    try {
      await ApiService.submitFeedbackResponse(payload);
    } catch {
      StorageService.saveFeedbackResponse(payload);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    // Auto close after 2.5 seconds
    setTimeout(() => {
      setIsOpen(false);
    }, 2500);
  };

  if (!isOpen || !activeCampaign || StorageService.isAdminLoggedIn() || window.location.hash.startsWith('#/admin')) {
    return null;
  }

  const ratingLabels: Record<number, string> = {
    1: 'تحتاج تحسين كبير 😕',
    2: 'مقبولة ولكن ينقصها الكثير 😐',
    3: 'جيدة بشكل عام 🙂',
    4: 'ممتازة ومفيدة جداً 😃',
    5: 'رائعة وسريعة وفوق التوقعات 🌟',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px] animate-fadeIn" dir="rtl">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden transform transition-all duration-300 animate-slideUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#8D6A28] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute top-4 left-4 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer active:scale-95 shadow-md backdrop-blur-sm"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-[#8D6A28] text-white flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  استطلاع رأي مباشر
                </span>
                <span className="text-[11px] text-slate-300 font-medium">سريع في 10 ثوانٍ</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                {activeCampaign.title}
              </h3>
            </div>
          </div>

          {activeCampaign.description && (
            <p className="text-xs text-slate-300 mt-2 font-medium">
              {activeCampaign.description}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900">تسلم إيدك! شكراً لمشاركتك القيّمة ❤️</h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                رأيك يساعدنا في تقديم أفضل خدمة سكن ومعاينات مجانية في دمياط الجديدة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-slate-900 text-sm font-bold flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-[#8D6A28] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{activeCampaign.question}</span>
              </div>

              {/* RATING MODE (Stars) */}
              {(activeCampaign.type === 'rating' || activeCampaign.type === 'net_promoter') && (
                <div className="space-y-2 text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const activeStar = hoverRating ? hoverRating >= star : rating >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1.5 transform hover:scale-125 transition active:scale-95 cursor-pointer"
                        >
                          <Star 
                            className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                              activeStar 
                                ? 'text-amber-400 fill-amber-400 drop-shadow-md' 
                                : 'text-slate-200 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-bold text-[#8D6A28] h-4">
                    {ratingLabels[hoverRating || rating] || ''}
                  </p>
                </div>
              )}

              {/* MULTIPLE CHOICE MODE */}
              {activeCampaign.type === 'choice' && activeCampaign.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCampaign.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`p-3 rounded-2xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-[#8D6A28] bg-amber-50/80 text-[#8D6A28] ring-2 ring-[#8D6A28]/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#8D6A28] bg-[#8D6A28] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* OPTIONAL FEEDBACK NOTE */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>ملاحظتك أو اقتراحك (اختياري)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="أكتب أي اقتراح أو عقار ترغب بتوفيره في دمياط الجديدة..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/20 text-xs text-slate-800 outline-hidden transition resize-none placeholder:text-slate-400"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-900/10 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  لاحقاً
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
