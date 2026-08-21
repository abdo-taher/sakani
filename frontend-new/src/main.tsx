import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installGlobalImageFallback} from './utils/imageFallback';

installGlobalImageFallback();

// Shield application from unhandled third-party browser extension script errors
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const msg = String(event.message || '');
      const file = String(event.filename || '');
      const stack = String(event.error?.stack || '');
      if (
        file.includes('chrome-extension://') ||
        file.includes('moz-extension://') ||
        file.includes('contentscript.js') ||
        stack.includes('chrome-extension://') ||
        stack.includes('contentscript.js') ||
        msg.includes('direction') ||
        msg.includes('save-page')
      ) {
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
      const reasonStr = String(event.reason?.message || event.reason?.stack || event.reason || '');
      if (
        reasonStr.includes('chrome-extension://') ||
        reasonStr.includes('moz-extension://') ||
        reasonStr.includes('contentscript.js') ||
        reasonStr.includes('save-page') ||
        reasonStr.includes('direction')
      ) {
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
