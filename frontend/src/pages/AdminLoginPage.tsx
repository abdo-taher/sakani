import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { requestNotificationPermission, registerTokenWithBackend } from '../services/firebaseService';
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { SakaniLogo } from '../components/SakaniLogo';
import { SEOHead } from '../components/SEOHead';

interface AdminLoginPageProps {
  onLoginSuccess?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

        if (onLoginSuccess) {
          onLoginSuccess();
        }
        navigate('/admin/dashboard');
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
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        navigate('/admin/dashboard');
        return;
      }

      setError(apiErr.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 selection:bg-[#8D6A28]/30 selection:text-[#8D6A28]" dir="rtl">
      <SEOHead
        title="تسجيل الدخول للإدارة | سكني"
        robots="noindex, nofollow"
      />
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8D6A28]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative border border-slate-100 z-10 animate-fade-in">
        
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <SakaniLogo size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            تسجيل الدخول إلى الحساب
          </h1>
          <p className="text-xs text-slate-500">
            بوابة تسجيل الدخول لمنصة سكني - دمياط الجديدة
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المستخدم / البريد الإلكتروني
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:bg-white focus:border-[#8D6A28] outline-none transition"
              placeholder="أدخل اسم المستخدم"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:bg-white focus:border-[#8D6A28] outline-none transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#8D6A28] transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة إلى الموقع الرئيسي</span>
          </Link>
        </div>

      </div>

    </div>
  );
};
