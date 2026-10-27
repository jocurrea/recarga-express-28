'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, HelpCircle, Check, ArrowRight, Sparkles } from 'lucide-react';
import { isSessionUnlocked } from '@/lib/storage';

export default function PwaInstallBanner({ isUnlocked = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isSessionUnlocked()) {
      setSessionActive(true);
      return;
    }

    // Detectar si ya está corriendo como app instalada (PWA standalone)
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      return standalone;
    };

    if (checkStandalone()) return;

    // Verificar si ya existe prompt guardado previamente
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setIsOpen(true);
    }

    // Escuchar el evento antes de instalar
    const onPromptReady = (e) => {
      const promptEvent = e.detail || e;
      setDeferredPrompt(promptEvent);
      window.deferredPrompt = promptEvent;
      // Mostrar automáticamente el modal de instalación
      setIsOpen(true);
    };

    window.addEventListener('pwa-prompt-ready', onPromptReady);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      setIsOpen(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsOpen(false);
      window.deferredPrompt = null;
    });

    // Mostrar el banner a los 2 segundos si es móvil y no está instalada
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const timer = setTimeout(() => {
      if (!checkStandalone() && isMobile) {
        setIsOpen(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.deferredPrompt : null);

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsOpen(false);
          setDeferredPrompt(null);
          window.deferredPrompt = null;
        }
      } catch (err) {
        console.warn('Error al ejecutar prompt de instalación:', err);
        setShowManualGuide(true);
      }
    } else {
      // Si el navegador aún no generó el evento nativo, mostramos la guía paso a paso
      setShowManualGuide(true);
    }
  };

  // Si ya inició sesión o está abierta como PWA instalada, no mostramos nada
  if (isUnlocked || sessionActive || isStandalone || isInstalled) return null;

  return (
    <>
      {/* Botón Flotante discreto en esquina inferior si el modal está cerrado */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs py-2.5 px-3.5 rounded-full shadow-xl shadow-orange-950/40 border border-orange-400/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce duration-1000"
          title="Instalar RE28 en tu teléfono"
        >
          <Smartphone className="w-4 h-4 text-white" />
          <span>Instalar App RE28</span>
        </button>
      )}

      {/* Modal / Banner de Instalación */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c1428] border border-orange-500/30 text-white shadow-2xl shadow-orange-950/50 p-5 space-y-4 animate-in slide-in-from-bottom-5 duration-300">
            
            {/* Cabecera */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/app-icon.png"
                    alt="RE28 Icon"
                    className="w-13 h-13 rounded-2xl object-contain border-2 border-orange-500/40 shadow-lg shadow-orange-500/20 bg-[#060b18]"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    RE28 Recarga Express
                  </h3>
                  <p className="text-xs text-orange-400 font-medium">
                    Instalar en este teléfono
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Beneficios */}
            <div className="bg-[#121c38] rounded-2xl p-3 border border-[#1e2f5c] space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Acceso directo con el nuevo icono en tu pantalla</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Funciona en pantalla completa (sin barra del navegador)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mucho más rápida y segura para caja</span>
              </div>
            </div>

            {/* Guía manual desplegable si no sale el prompt directo */}
            {showManualGuide && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3 text-xs text-orange-200 space-y-2 animate-in fade-in">
                <p className="font-bold text-orange-400 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" /> Si tu teléfono no abre el instalador:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-300">
                  <li>Toca los <strong>3 puntos de Chrome</strong> (arriba a la derecha).</li>
                  <li>Si no ves «Instalar», busca <strong>«Agregar a la pantalla principal»</strong>.</li>
                  <li>
                    <span className="text-orange-300 font-medium">En Xiaomi / Redmi:</span> Ve a <em>Ajustes ➔ Aplicaciones ➔ Chrome ➔ Otros permisos ➔ Accesos directos: «Permitir»</em>.
                  </li>
                </ol>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="btn-confirm-install-pwa"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-600/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Instalar en Teléfono</span>
              </button>

              <a
                href="/RE28.apk"
                download="RE28.apk"
                className="w-full py-2.5 px-3 rounded-2xl font-semibold text-xs bg-slate-800/90 hover:bg-slate-700 text-orange-300 border border-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Descargar APK directo (para Xiaomi / Redmi)</span>
              </a>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition text-center cursor-pointer"
              >
                Continuar en navegador web
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
