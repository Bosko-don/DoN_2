import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline asset caching in production builds
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[DoN PWA] New version available.');
    },
    onOfflineReady() {
      console.log('[DoN PWA] App shell and critical assets cached for offline use.');
    },
    onRegisterError(error) {
      console.warn('[DoN PWA] Service worker registration notice:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
