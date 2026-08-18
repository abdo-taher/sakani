import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ContactMessage } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';
import { 
  Mail, 
  Search, 
  MessageCircle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone,
  MailCheck,
  Reply,
  Send,
  Bell,
  Sparkles,
  Copy,
  Check,
  Calendar,
  X,
  ExternalLink,
  MessageSquare,
  CornerDownLeft,
  ChevronDown,
  Info
} from 'lucide-react';

const QUICK_REPLY_TEMPLATES = [
  'مرحباً بك، تم استلام استفسارك وسيتم التواصل معك هاتفياً في أقرب وقت لتوضيح كافة التفاصيل.',
  'شكراً لتواصلك مع منصة سكني، العقار متاح حالياً للمعاينة ويسعدنا تنسيق موعد مناسب لك.',
  'يسعدنا خدمتك، تم تحويل استفسارك للمستشار العقاري المختص وسيقوم بالرد على كافة أسئلتكم فوراً.',
  'السلام عليكم، بخصوص استفساركم نود إفادتكم بأنه تم تسجيل طلبكم وسنوافيكم بآخر التحديثات.',
];

export const AdminContactMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Reply Modal State
  const [replyingMsg, setReplyingMsg] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyChannel, setReplyChannel] = useState<'platform' | 'whatsapp' | 'email' | 'call'>('platform');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Listen to real-time local storage updates
    const handleUpdate = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail && Array.isArray(customEv.detail)) {
        setMessages(customEv.detail);
      }
    };
    window.addEventListener('sakani_contact_messages_updated', handleUpdate);
    return () => window.removeEventListener('sakani_contact_messages_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!replyingMsg) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReplyingMsg(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [replyingMsg]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    // Immediate local render
    setMessages(StorageService.getContactMessages());

    // Fetch from backend API
    try {
      const res = await ApiService.getContactMessages();
      if (Array.isArray(res) && res.length > 0) {
        const mapped: ContactMessage[] = res.map((m: any) => ({
          id: String(m.id),
          name: m.name,
          phone: m.phone,
          email: m.email || '',
          subject: m.subject || '',
          message: m.message || '',
          status: m.status === 'read' ? 'read' : m.status === 'replied' ? 'replied' : 'new',
          reply: m.reply || m.admin_reply,
          replied_at: m.replied_at,
          replies: Array.isArray(m.replies) ? m.replies : undefined,
          created_at: m.created_at || new Date().toISOString(),
        }));
        setMessages(mapped);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleToggleRead = async (id: string, currentStatus: ContactMessage['status']) => {
    const nextStatus = currentStatus === 'new' ? 'read' : 'new';
    StorageService.updateContactMessageStatus(id, nextStatus);
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.updateContactMessage(numId, { status: nextStatus });
      } catch (e) {}
    }
    loadData();
    showToast(nextStatus === 'read' ? 'تم تحديد الرسالة كمقروءة' : 'تمت إعادة تعيين الرسالة كجديدة');
  };

  const handleDeleteMessage = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      StorageService.deleteContactMessage(id);
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.deleteContactMessage(numId);
        } catch (e) {}
      }
      loadData();
      showToast('تم حذف الرسالة بنجاح');
    }
  };

  const handleOpenReplyModal = (msg: ContactMessage) => {
    setReplyingMsg(msg);
    setReplyText(msg.reply || '');
    setReplyChannel('platform');
  };

  const handleSendReply = async () => {
    if (!replyingMsg || !replyText.trim()) return;

    setIsSubmittingReply(true);

    // 1. Save reply in Local Storage (also dispatches customer notification & sound)
    StorageService.replyToContactMessage(replyingMsg.id, replyText.trim(), replyChannel);

    // 2. Sync with Backend API
    const numId = parseInt(replyingMsg.id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.replyToContactMessage(numId, {
          reply: replyText.trim(),
          status: 'replied',
          channel: replyChannel,
        });
      } catch (e) {}
    }

    // 3. If WhatsApp channel chosen, open WhatsApp web with prefilled message
    if (replyChannel === 'whatsapp') {
      const cleanPhone = replyingMsg.phone.replace(/\D/g, '');
      const waText = encodeURIComponent(`مرحباً أ/ ${replyingMsg.name}، بخصوص استفسارك على منصة سكني:\n\n${replyText.trim()}`);
      window.open(`https://wa.me/${cleanPhone}?text=${waText}`, '_blank');
    } else if (replyChannel === 'email' && replyingMsg.email) {
      const mailtoUrl = `mailto:${replyingMsg.email}?subject=${encodeURIComponent(`رد منصة سكني: ${replyingMsg.subject || 'بخصوص استفسارك'}`)}&body=${encodeURIComponent(replyText.trim())}`;
      window.open(mailtoUrl, '_blank');
    }

    setIsSubmittingReply(false);
    setReplyingMsg(null);
    setReplyText('');
    loadData();
    showToast(`تم إرسال الرد وإشعار العميل (${replyingMsg.name}) بنجاح`);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };
      return {
        date: d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const filtered = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.subject && m.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const newCount = messages.filter((m) => m.status === 'new').length;
  const repliedCount = messages.filter((m) => m.status === 'replied').length;
  const readCount = messages.filter((m) => m.status === 'read').length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-5 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              رسائل التواصل والردود
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            متابعة رسائل الزوار، إرسال الردود، وإشعار العملاء فورا عبر الإشعارات والواتساب ({messages.length} رسالة)
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {newCount > 0 && (
            <span className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
              {newCount} جديدة
            </span>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {repliedCount} تم الرد عليها
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            {readCount} مقروءة
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المرسل، رقم الهاتف، موضوع الرسالة، أو المحتوى..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#8D6A28] outline-none transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة الرسائل ({messages.length})</option>
            <option value="new">رسائل جديدة ({newCount})</option>
            <option value="replied">تم الرد عليها ({repliedCount})</option>
            <option value="read">مقروءة بدون رد ({readCount})</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>نتائج الفلترة: <strong className="text-slate-900">{filtered.length}</strong> رسالة</span>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="text-[#8D6A28] font-bold hover:underline cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      {loading ? (
        <DashboardTableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
          <ModernStateFeedback
            type="empty"
            title="لا توجد رسائل تواصل مطابقة"
            description={searchTerm || filterStatus !== 'all' ? 'جرب تعديل كلمات البحث أو ضبط فلتر الحالة.' : 'رسائل واستفسارات الزوار الواردة من صفحة اتصل بنا ستظهر هنا مباشرة.'}
            actionText={searchTerm || filterStatus !== 'all' ? 'إعادة ضبط الفلاتر' : undefined}
            onAction={searchTerm || filterStatus !== 'all' ? () => { setSearchTerm(''); setFilterStatus('all'); } : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((msg) => {
            const dateTime = formatDateTime(msg.created_at);
            const repliedDateTime = msg.replied_at ? formatDateTime(msg.replied_at) : null;
            const isPhoneCopied = copiedKey === `phone-${msg.id}`;
            const isEmailCopied = copiedKey === `email-${msg.id}`;

            return (
              <div 
                key={msg.id} 
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  msg.status === 'new' 
                    ? 'bg-white border-blue-300 shadow-md ring-1 ring-blue-100' 
                    : msg.status === 'replied'
                    ? 'bg-white border-emerald-200 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                {/* Header Row: Sender Details & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base shadow-inner shrink-0 ${
                      msg.status === 'new' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : msg.status === 'replied'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {msg.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{msg.name}</h3>
                        {msg.subject && (
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden md:inline-block">
                            {msg.subject}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1 flex-wrap">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span dir="ltr" className="font-bold text-slate-700">{msg.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.phone, `phone-${msg.id}`)}
                            className="p-0.5 hover:text-[#8D6A28] transition cursor-pointer"
                            title="نسخ رقم الهاتف"
                          >
                            {isPhoneCopied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>

                        {msg.email && (
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{msg.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.email!, `email-${msg.id}`)}
                              className="p-0.5 hover:text-[#8D6A28] transition cursor-pointer"
                              title="نسخ البريد"
                            >
                              {isEmailCopied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Time */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="text-left font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateTime.date}</span>
                      </div>
                      {dateTime.time && <span>{dateTime.time}</span>}
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-black shadow-2xs ${
                      msg.status === 'new' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : msg.status === 'replied' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {msg.status === 'new' ? 'طلب جديد' : msg.status === 'replied' ? 'تم الرد' : 'مقروء'}
                    </span>
                  </div>
                </div>

                {/* Subject on mobile */}
                {msg.subject && (
                  <div className="pt-2 md:hidden">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                      الموضوع: {msg.subject}
                    </span>
                  </div>
                )}

                {/* Message Body */}
                <div className="py-3 text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 my-3">
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>

                {/* Admin Reply Thread (If replied) */}
                {(msg.reply || (msg.replies && msg.replies.length > 0)) && (
                  <div className="bg-gradient-to-r from-amber-50/60 to-emerald-50/40 p-4 rounded-2xl border border-amber-200/70 space-y-2 mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#8D6A28]">
                        <Reply className="w-3.5 h-3.5 rotate-180" />
                        <span>رد إدارة منصة سكني المُرسل للعميل:</span>
                      </div>
                      {repliedDateTime && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {repliedDateTime.date} {repliedDateTime.time}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/50">
                      {msg.reply || msg.replies?.[msg.replies.length - 1]?.reply_text}
                    </p>

                    {/* All thread replies if multiple */}
                    {msg.replies && msg.replies.length > 1 && (
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/40">
                        <span className="text-[10px] font-bold text-slate-500 block">سجل الردود السابقة ({msg.replies.length}):</span>
                        {msg.replies.slice(0, -1).map((r, rIdx) => (
                          <div key={rIdx} className="text-[11px] bg-white/60 p-2 rounded-lg text-slate-700">
                            <span>"{r.reply_text}"</span>
                            <span className="text-[9px] font-mono text-slate-400 mr-2">({new Date(r.replied_at).toLocaleDateString('ar-EG')})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  
                  {/* Left: Reply Button + Toggle Read */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReplyModal(msg)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5 rotate-180" />
                      <span>{msg.status === 'replied' ? 'إرسال رد إضافي' : 'الرد على العميل'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRead(msg.id, msg.status)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <MailCheck className="w-3.5 h-3.5" />
                      <span>{msg.status === 'new' ? 'تحديد كمقروء' : 'تحديد كجديد'}</span>
                    </button>
                  </div>

                  {/* Right: Quick Direct Contact & Delete */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً أ/ ${msg.name}، نتواصل معك من منصة سكني بخصوص استفسارك.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="محادثة واتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">واتساب</span>
                    </a>

                    <a
                      href={`tel:${msg.phone}`}
                      className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">اتصال</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition shadow-2xs cursor-pointer"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Interactive Reply Modal with Channel Dispatch & Client Notification */}
      {/* ========================================================================= */}
      {replyingMsg && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl" onClick={() => setReplyingMsg(null)}>
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scale-in my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center font-bold">
                  <Reply className="w-4 h-4 rotate-180" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">الرد على استفسار العميل</h3>
                  <p className="text-xs text-slate-500 font-medium">سيتم إرسال الرد وإشعار العميل فوراً</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReplyingMsg(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client Context Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">{replyingMsg.name}</span>
                <span className="font-mono text-slate-500" dir="ltr">{replyingMsg.phone}</span>
              </div>
              <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100 line-clamp-3">
                "{replyingMsg.message}"
              </p>
            </div>

            {/* Quick Templates Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>نماذج ردود جاهزة وسريعة:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLY_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(tmpl)}
                    className="text-[11px] font-medium bg-amber-50/70 hover:bg-amber-100 text-slate-700 border border-amber-200/60 px-2.5 py-1 rounded-xl transition cursor-pointer text-right line-clamp-1"
                    title={tmpl}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">نص الرد الموجه للعميل *</label>
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك الواضح والشامل على استفسار العميل هنا..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#8D6A28] text-xs sm:text-sm font-medium text-slate-900 outline-none leading-relaxed"
              ></textarea>
            </div>

            {/* Delivery Channel Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">طريقة وقناة توصيل الرد:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReplyChannel('platform')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    replyChannel === 'platform'
                      ? 'bg-amber-50 border-[#8D6A28] text-[#8D6A28] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>إشعار بالمنصة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyChannel('whatsapp')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    replyChannel === 'whatsapp'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>واتساب + إشعار</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyChannel('email')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    replyChannel === 'email'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>إيميل + إشعار</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingMsg(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isSubmittingReply || !replyText.trim()}
                onClick={handleSendReply}
                className="px-5 py-2.5 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-black shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingReply ? 'جاري إرسال الرد...' : 'إرسال الرد وإشعار العميل'}</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
