import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installGlobalImageFallback} from './utils/imageFallback';

installGlobalImageFallback();

// Shield application from unhandled third-party browser extension script and XrayWrapper cross-origin errors
if (typeof window !== 'undefined') {
  const isIgnorableThirdPartyError = (msg: string, file: string, stack: string): boolean => {
    const combined = `${msg} ${file} ${stack}`.toLowerCase();
    return (
      combined.includes('chrome-extension://') ||
      combined.includes('moz-extension://') ||
      combined.includes('safari-extension://') ||
      combined.includes('content-script') ||
      combined.includes('contentscript') ||
      combined.includes('xraywrapper') ||
      combined.includes('cross-origin object') ||
      combined.includes('not allowed to define') ||
      combined.includes('direction') ||
      combined.includes('save-page')
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      const msg = String(event.message || '');
      const file = String(event.filename || '');
      const stack = String(event.error?.stack || '');
      if (isIgnorableThirdPartyError(msg, file, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true,
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const reasonStr = String(reason?.message || reason?.stack || reason || '');
      if (isIgnorableThirdPartyError(reasonStr, '', reasonStr)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
