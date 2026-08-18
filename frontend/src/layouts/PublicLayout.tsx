import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { BottomNav, ActiveTab } from '../components/BottomNav';

interface PublicLayoutProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  favoritesCount: number;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenNeedModal: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenNeedModal,
}) => {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-['Cairo'] selection:bg-[#8D6A28]/20 selection:text-[#8D6A28]" dir="rtl">
      {/* 1. Public Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        favoritesCount={favoritesCount}
        isAdmin={isAdmin}
        onOpenAdminLogin={onOpenAdminLogin}
        onLogoutAdmin={onLogoutAdmin}
        onOpenNeedModal={onOpenNeedModal}
      />

      {/* 2. Public Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 3. Public Footer */}
      <Footer
        onSelectTab={onSelectTab}
        onOpenNeedModal={onOpenNeedModal}
      />

      {/* 4. Public Floating WhatsApp */}
      <FloatingWhatsApp />

      {/* 5. Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        favoritesCount={favoritesCount}
        isAdmin={isAdmin}
      />
    </div>
  );
};
