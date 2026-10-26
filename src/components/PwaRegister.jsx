'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('RE28 Service Worker registrado con éxito:', reg.scope);
          })
          .catch((err) => {
            console.warn('Error al registrar Service Worker:', err);
          });
      });
    }

    // Capturar evento antes de instalar para botones personalizados
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-installable', { detail: e }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  return null;
}
