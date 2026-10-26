'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Registrar Service Worker de inmediato
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('RE28 Service Worker activo:', reg.scope);
        } catch (err) {
          console.warn('Error registrando Service Worker:', err);
        }
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }
    }

    // Capturar evento de instalación de PWA
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-prompt-ready', { detail: e }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Si la app ya se instaló
    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-installed'));
      console.log('RE28 ha sido instalada exitosamente');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
