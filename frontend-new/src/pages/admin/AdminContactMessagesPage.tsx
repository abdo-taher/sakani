import React, { useState, useEffect } from 'react';
import { ContactMessage } from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  Mail, 
  Search, 
  MessageCircle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone,
  MailCheck
} from 'lucide-react';

import { ApiService } from '../../services/apiService';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';

export const AdminContactMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

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
          created_at: m.created_at || new Date().toISOString(),
        }));
        setMessages(mapped);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleToggleRead = async (id: string, currentStatus: ContactMessage['status']) => {
    const nextStatus = currentStatus === 'new' ? 'read' : 'replied';
    StorageService.updateContactMessageStatus(id, nextStatus);
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.updateContactMessage(numId, { status: nextStatus });
      } catch (e) {}
    }
    loadData();
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
    }
  };

  const filtered = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              رسائل التواصل والاستفسارات
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            عرض والرد على رسائل الزوار الواردة من صفحة اتصل بنا ({messages.length} رسالة)
          </p>
        </div>

        {newCount > 0 && (
          <span className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse self-start sm:self-auto">
            {newCount} رسائل جديدة لم تُقرأ
          </span>
        )}
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
              placeholder="ابحث باسم المرسل، رقم الهاتف، أو نص الرسالة..."
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
            <option value="read">تمت القراءة</option>
            <option value="replied">تم الرد</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
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
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-5 rounded-3xl border transition-all ${
                msg.status === 'new' 
                  ? 'bg-white border-blue-200 shadow-sm' 
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    msg.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {msg.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{msg.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span dir="ltr">{msg.phone}</span>
                      {msg.email && (
                        <>
                          <span>•</span>
                          <span>{msg.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                    {new Date(msg.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    msg.status === 'new' ? 'bg-rose-100 text-rose-800' : msg.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {msg.status === 'new' ? 'جديد' : msg.status === 'replied' ? 'تم الرد' : 'مقروء'}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div className="py-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {msg.status === 'new' ? (
                    <button
                      onClick={() => handleToggleRead(msg.id, 'new')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <MailCheck className="w-3.5 h-3.5" />
                      <span>تحديد كمقروء</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleRead(msg.id, 'read')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تحديد كتم الرد</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً أ/ ${msg.name}، نتواصل معك من منصة سكني بخصوص استفسارك.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>رد عبر واتساب</span>
                  </a>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
