import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { SakaniLogo } from '../components/SakaniLogo';
import { NotificationCenter } from '../components/NotificationCenter';
import { SEOHead } from '../components/SEOHead';
import { 
  LayoutDashboard, 
  Building2, 
  CalendarCheck, 
  HelpCircle, 
  Mail, 
  MapPin,
  Layers,
  Sparkles,
  Tag,
  BarChart3,
  Globe, 
  Settings,
  LogOut, 
  ExternalLink,
  Plus,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  Bell,
  Users,
  FilePlus2,
  Send,
  MessageSquare
} from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
  onOpenAddProperty?: () => void;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  onOpenAddProperty,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sakani_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sakani_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Counts for badges
  const inquiries = StorageService.getInquiries();
  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;
  const needRequests = StorageService.getNeedRequests();
  const pendingNeedsCount = needRequests.filter(n => n.status === 'pending').length;
  const messages = StorageService.getContactMessages();
  const newMessagesCount = messages.filter(m => m.status === 'new').length;
  const properties = StorageService.getProperties();
  const pendingSubmissionsCount = properties.filter(p => p.submission_status === 'pending_review' || (p.status as string) === 'pending_review').length;

  const handleLogoutClick = () => {
    StorageService.setAdminLoggedIn(false);
    if (onLogout) onLogout();
    navigate('/admin/login');
  };

  const navGroups = [
    {
      groupTitle: 'الرئيسية',
      items: [
        { path: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      groupTitle: 'إدارة العقارات',
      items: [
        { path: '/admin/properties', label: 'العقارات', icon: Building2, badge: `${properties.length}` },
        { path: '/admin/properties/create', label: 'إضافة عقار جديد', icon: Plus, badge: null },
        { path: '/admin/property-submissions', label: 'العقارات المضافة من العملاء', icon: FilePlus2, badge: pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} جديد` : null },
        { path: '/admin/reservations', label: 'طلبات الحجز والمعاينات', icon: CalendarCheck, badge: newInquiriesCount > 0 ? `${newInquiriesCount} جديد` : null },
        { path: '/admin/need-requests', label: 'طلبات البحث عن عقار', icon: HelpCircle, badge: pendingNeedsCount > 0 ? `${pendingNeedsCount}` : null },
      ],
    },
    {
      groupTitle: 'العملاء والتواصل',
      items: [
        { path: '/admin/customers', label: 'دليل العملاء واستخبارات الاتصال', icon: Users, badge: 'تفاعل' },
        { path: '/admin/feedback-campaigns', label: 'حملات واستطلاعات الرأي', icon: MessageSquare, badge: null },
        { path: '/admin/contact-messages', label: 'رسائل التواصل', icon: Mail, badge: newMessagesCount > 0 ? `${newMessagesCount}` : null },
        { path: '/admin/marketing', label: 'النشرات البريدية والتسويق', icon: Send, badge: null },
        { path: '/admin/notifications', label: 'سجل الإشعارات والتنبيهات', icon: Bell, badge: null },
      ],
    },
    {
      groupTitle: 'إدارة المحتوى العقاري',
      items: [
        { path: '/admin/categories', label: 'الأقسام والأنواع', icon: Layers, badge: null },
        { path: '/admin/locations', label: 'الأماكن والمناطق', icon: MapPin, badge: null },
        { path: '/admin/tags', label: 'التاجات والوسوم', icon: Tag, badge: null },
        { path: '/admin/amenities', label: 'المميزات والمرافق', icon: Sparkles, badge: null },
      ],
    },
    {
      groupTitle: 'التقارير والإدارة',
      items: [
        { path: '/admin/statistics', label: 'الإحصائيات والتقارير', icon: BarChart3, badge: null },
        { path: '/admin/content', label: 'محتوى الموقع (CMS)', icon: Globe, badge: null },
        { path: '/admin/settings', label: 'الإعدادات العامة', icon: Settings, badge: null },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex font-['Cairo'] text-slate-900 selection:bg-[#8D6A28]/20 selection:text-[#8D6A28]" dir="rtl">
      <SEOHead
        title="لوحة تحكم الإدارة | سكني"
        robots="noindex, nofollow"
      />
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop & Mobile Admin Sidebar (Sticky on scroll + Smooth Collapsible) */}
      <aside className={`fixed top-0 bottom-0 right-0 z-50 bg-[#0F172A] text-white flex flex-col justify-between shadow-2xl transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-40 ${
        isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'lg:w-20 w-72' : 'w-72'}`}>
        
        <div className={`p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar ${isCollapsed ? 'lg:p-3' : 'p-5'}`}>
          
          {/* Admin Header / Logo */}
          <div className={`flex items-center pb-3 border-b border-white/10 ${
            isCollapsed ? 'lg:flex-col lg:gap-2 justify-between' : 'justify-between'
          }`}>
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <SakaniLogo size={isCollapsed ? 'md' : 'md'} />
              {!isCollapsed && (
                <div className="hidden lg:block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D6A94E] block">لوحة الإدارة</span>
                  <span className="text-xs text-slate-400 font-bold">سكني دمياط الجديدة</span>
                </div>
              )}
              <div className="lg:hidden">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D6A94E] block">لوحة الإدارة</span>
                <span className="text-xs text-slate-400 font-bold">سكني دمياط الجديدة</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1.5 rounded-xl bg-white/5 hover:bg-[#8D6A28] text-slate-400 hover:text-white transition cursor-pointer items-center justify-center shrink-0"
              title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Quick Action: Add Property Button */}
          {onOpenAddProperty && (
            <button
              onClick={() => {
                setIsMobileSidebarOpen(false);
                onOpenAddProperty();
              }}
              className={`w-full py-2.5 rounded-2xl gold-gradient gold-gradient-hover text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer ${
                isCollapsed ? 'lg:px-0 lg:py-3' : 'px-3'
              }`}
              title="إضافة عقار جديد"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className={isCollapsed ? 'lg:hidden' : ''}>إضافة عقار جديد</span>
            </button>
          )}

          {/* Sidebar Navigation Groups */}
          <nav className="space-y-4">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed ? (
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {group.groupTitle}
                  </div>
                ) : (
                  <div className="hidden lg:block my-2 border-t border-white/5" />
                )}
                
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-right group relative ${
                        isActive
                          ? 'bg-[#8D6A28] text-white shadow-md'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      } ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between'}`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#D6A94E]'}`} />
                        <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      </div>

                      {item.badge && !isCollapsed && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : item.badge.includes('جديد') 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-white/10 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Small badge dot for collapsed mode */}
                      {item.badge && isCollapsed && (
                        <span className="hidden lg:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0F172A]" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-white/10 space-y-2 bg-[#0a101d] shrink-0 ${isCollapsed ? 'lg:p-2' : 'p-4'}`}>
          <Link
            to="/"
            title={isCollapsed ? 'معاينة وتصفح الموقع' : undefined}
            className={`w-full flex items-center py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer ${
              isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#D6A94E] shrink-0" />
              <span className={isCollapsed ? 'lg:hidden' : ''}>معاينة الموقع</span>
            </div>
            {!isCollapsed && <ChevronLeft className="w-3.5 h-3.5 text-slate-500 hidden lg:block" />}
          </Link>

          <button
            onClick={handleLogoutClick}
            title={isCollapsed ? 'تسجيل الخروج' : undefined}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition cursor-pointer ${
              isCollapsed ? 'lg:px-2' : ''
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>تسجيل الخروج</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Top Navigation Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  لوحة تحكم سكني
                </h2>
                <span className="hidden sm:inline-block bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                  النظام متصل
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                إدارة العقارات، الحجوزات، الطلبات الخاصة، ومحتوى المنصة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {onOpenAddProperty && (
              <button
                onClick={onOpenAddProperty}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة عقار</span>
              </button>
            )}

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <Globe className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span className="hidden sm:inline">زيارة الموقع</span>
            </Link>

            {/* Notification Center */}
            <NotificationCenter role="admin" />

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#8D6A28] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                م
              </div>
              <div className="hidden md:block text-right">
                <span className="text-xs font-bold text-slate-900 block leading-tight">مشرف النظام</span>
                <span className="text-[10px] text-emerald-600 font-bold block leading-tight">نشط الآن</span>
              </div>
            </div>

          </div>

        </header>

        {/* Admin Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>

      </div>

    </div>
  );
};
