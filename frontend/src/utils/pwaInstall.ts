import { useState, useEffect } from 'react';

// Global reference for deferred prompt to catch event as early as possible
let globalDeferredPrompt: any = null;
let pwaListeners: Array<() => void> = [];

const notifyPwaListeners = () => {
  pwaListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
};

// Check if running in standalone mode (already installed & opened as PWA)
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    localStorage.getItem('sakani_pwa_installed') === 'true';

  return isStandalone;
};

// Check if device is iOS (iPhone/iPad)
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Global event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    notifyPwaListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem('sakani_pwa_installed', 'true');
    } catch {}
    notifyPwaListeners();
  });
}

// Direct native install trigger without any intermediate popups
export const triggerPWAInstall = async (): Promise<{ outcome: 'accepted' | 'dismissed' | 'unsupported' | 'already_installed' }> => {
  if (isPWAInstalled()) {
    return { outcome: 'already_installed' };
  }

  if (globalDeferredPrompt) {
    try {
      const promptEvent = globalDeferredPrompt;
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      // A BeforeInstallPromptEvent can only be used once, whether the user
      // accepts or dismisses it.
      globalDeferredPrompt = null;
      notifyPwaListeners();
      if (choiceResult && choiceResult.outcome === 'accepted') {
        try {
          localStorage.setItem('sakani_pwa_installed', 'true');
        } catch {}
        return { outcome: 'accepted' };
      }
      return { outcome: 'dismissed' };
    } catch (err) {
      console.warn('PWA Install Prompt error:', err);
    }
  }

  if (isIOSDevice()) {
    alert("لتثبيت التطبيق على جهاز الآيفون (iOS):\n\n1. اضغط على زر المشاركة (Share ⎋) أسفل المتصفح.\n2. اختر 'إضافة إلى الصفحة الرئيسية (Add to Home Screen ➕)'.");
    return { outcome: 'unsupported' };
  }

  alert("يمكنك تثبيت تطبيق سكني مباشرة من قائمة خيارات المتصفح (ثلاث نقاط ⋮) ثم الضغط على 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'.");
  return { outcome: 'unsupported' };
};

// React hook for components
export const usePWAInstall = () => {
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isPWAInstalled());
  const [hasPrompt, setHasPrompt] = useState<boolean>(() => !!globalDeferredPrompt || isIOSDevice());

  useEffect(() => {
    const handleUpdate = () => {
      setIsInstalled(isPWAInstalled());
      setHasPrompt(!!globalDeferredPrompt || isIOSDevice());
    };

    pwaListeners.push(handleUpdate);
    handleUpdate();

    return () => {
      pwaListeners = pwaListeners.filter((fn) => fn !== handleUpdate);
    };
  }, []);

  return {
    isInstalled,
    canInstall: !isInstalled,
    installApp: triggerPWAInstall,
  };
};
