import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { requestNotificationPermission, registerTokenWithBackend } from '../services/firebaseService';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Authenticate with Laravel API
      const res = await ApiService.login({
        username: username.trim(),
        password: password.trim(),
      });

      if (res && res.token) {
        StorageService.setAdminLoggedIn(true);

        // 2. Register FCM Device Token for Admin
        const existingDeviceToken = localStorage.getItem('sakani_device_token');
        if (existingDeviceToken) {
          await registerTokenWithBackend(existingDeviceToken, 'admin').catch(() => {});
        } else {
          await requestNotificationPermission('admin').catch(() => {});
        }

        setIsLoading(false);
        onLoginSuccess();
        onClose();
        return;
      }
    } catch (apiErr: any) {
      console.warn('Backend API login attempted:', apiErr.message);

      // Fallback demo login if offline/demo
      if (
        (username.trim() === 'SakaniAdmin2026' && password === 'Password@123@sakani') ||
        (username.trim() === 'admin' && (password === 'sakani2026' || password === 'admin' || password === '123456'))
      ) {
        StorageService.setAdminLoggedIn(true);
        setIsLoading(false);
        onLoginSuccess();
        onClose();
        return;
      }

      setIsLoading(false);
      setError(apiErr.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4" dir="rtl">
      
      <div 
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl gold-gradient text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black">تسجيل الدخول إلى الحساب</h3>
          <p className="text-xs text-slate-400 mt-1">أدخل بيانات الحساب لتسجيل الدخول والمتابعة</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المستخدم / البريد الإلكتروني
              </label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
