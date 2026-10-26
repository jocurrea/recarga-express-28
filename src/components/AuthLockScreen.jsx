'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Shield, Eye, EyeOff, Delete, AlertCircle, CheckCircle2, UserCheck, Smartphone, Share2, MoreVertical, X } from 'lucide-react';
import { authenticateUserByPin, getUsersConfig } from '@/lib/storage';

export default function AuthLockScreen({ onUnlock, theme = 'dark' }) {
  const isLight = theme === 'light';
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallClick = async () => {
    if (typeof window !== 'undefined' && window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const choice = await window.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        window.deferredPrompt = null;
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleAttemptUnlock = useCallback((codeToTest) => {
    const code = codeToTest ?? pin;
    if (!code || code.length < 4) {
      setErrorMsg('Ingresa al menos 4 dígitos');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const auth = authenticateUserByPin(code);
    if (auth.success && auth.user) {
      setLoggedInUser(auth.user);
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        onUnlock?.(auth.user);
      }, 450);
    } else {
      setErrorMsg(auth.error || 'PIN de acceso incorrecto');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  }, [pin, onUnlock]);

  // Soporte para teclado físico (PC / Laptop / Tablet con teclado)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSuccess) return;

      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 8) {
          const next = pin + e.key;
          setPin(next);
          setErrorMsg('');
          // Si el PIN alcanza la longitud del PIN configurado, intentamos validar automáticamente
          const targetPin = getSecurityPin();
          if (next.length === targetPin.length) {
            handleAttemptUnlock(next);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
        setErrorMsg('');
      } else if (e.key === 'Escape') {
        setPin('');
        setErrorMsg('');
      } else if (e.key === 'Enter') {
        handleAttemptUnlock(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSuccess, handleAttemptUnlock]);

  const handleKeyPress = (numStr) => {
    if (isSuccess || pin.length >= 8) return;
    const next = pin + numStr;
    setPin(next);
    setErrorMsg('');
    const targetPin = getSecurityPin();
    if (next.length === targetPin.length) {
      handleAttemptUnlock(next);
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    if (isSuccess) return;
    setPin('');
    setErrorMsg('');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 select-none transition-colors ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#060b18] text-slate-100'
    }`}>
      {/* Tarjeta Central */}
      <div className={`w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-300/50'
          : 'bg-[#0d152c] border-[#1e2e5c] shadow-black/60'
      } ${isShaking ? 'animate-shake border-red-500' : ''}`}>

        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className={`h-16 w-auto px-4 py-1.5 rounded-2xl flex items-center justify-center border shadow-md ${
              isLight ? 'bg-white border-slate-200' : 'bg-white border-slate-700'
            }`}>
              <img
                src="/logo.jpg"
                alt="Recarga Express 28"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border shadow-sm ${
              isSuccess
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-orange-500 text-white border-orange-400'
            }`}>
              {isSuccess ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </div>
          </div>

          <h1 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Recarga Express 28
          </h1>
          <p className={`text-xs mt-1 font-medium flex items-center justify-center gap-1.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <Shield className="w-3.5 h-3.5 text-orange-500" />
            Acceso Seguro • Control de Caja & Turnos
          </p>
        </div>

        {/* Visor de PIN / Puntos de Entrada */}
        <div className="my-6">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 flex items-center justify-center border-2 ${
                    isSuccess
                      ? 'bg-emerald-500 border-emerald-400 scale-110'
                      : isFilled
                      ? isLight
                        ? 'bg-orange-500 border-orange-600 scale-110'
                        : 'bg-orange-500 border-orange-400 scale-110 shadow-[0_0_12px_rgba(243,112,33,0.5)]'
                      : isLight
                      ? 'bg-slate-100 border-slate-300'
                      : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  {showPin && isFilled && (
                    <span className="text-[10px] font-bold text-white font-mono">
                      {pin[idx]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón para alternar visibilidad de números */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPin ? 'Ocultar números' : 'Ver números'}</span>
            </button>
          </div>

          {/* Mensajes de Alerta / Éxito */}
          <div className="min-h-[22px] flex items-center justify-center mt-2">
            {errorMsg ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            ) : isSuccess ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {loggedInUser?.rol === 'admin'
                    ? `¡Bienvenido ${loggedInUser.nombre}! (Acceso Total)`
                    : `¡Bienvenido ${loggedInUser?.nombre || 'Vendedor'}! (Caja Registradora)`}
                </span>
              </div>
            ) : (
              <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingresa tu PIN personal de acceso
              </span>
            )}
          </div>
        </div>

        {/* Teclado Táctil Numérico */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(String(num))}
              className={`h-13 sm:h-14 rounded-2xl text-xl sm:text-2xl font-bold font-mono transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer border ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm'
                  : 'bg-[#131d3b] hover:bg-[#1a2850] border-[#223568] text-white hover:border-orange-500/50 shadow-sm'
              }`}
            >
              {num}
            </button>
          ))}

          {/* Fila inferior: Borrar Todo (C), 0, Retroceso */}
          <button
            type="button"
            onClick={handleClear}
            className={`h-13 sm:h-14 rounded-2xl text-xs sm:text-sm font-bold uppercase transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer border ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-900/50 text-rose-300'
            }`}
            title="Borrar todo"
          >
            Borrar
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className={`h-13 sm:h-14 rounded-2xl text-xl sm:text-2xl font-bold font-mono transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer border ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm'
                : 'bg-[#131d3b] hover:bg-[#1a2850] border-[#223568] text-white hover:border-orange-500/50 shadow-sm'
            }`}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className={`h-13 sm:h-14 rounded-2xl transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-[#131d3b] hover:bg-[#1a2850] border-[#223568] text-slate-300 hover:text-white'
            }`}
            title="Borrar último"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botón principal de Desbloqueo */}
        <div className="mt-5 max-w-[280px] mx-auto space-y-2">
          <button
            type="button"
            id="auth-unlock-btn"
            onClick={() => handleAttemptUnlock(pin)}
            disabled={pin.length < 4 || isSuccess}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              pin.length >= 4 && !isSuccess
                ? 'bg-orange-600 hover:bg-orange-500 text-white active:scale-98 shadow-orange-500/20'
                : 'bg-slate-700/40 text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Unlock className="w-4 h-4" />
            <span>Ingresar a Caja</span>
          </button>

          {/* Botón de Ayuda para Instalar App en Teléfono */}
          <button
            type="button"
            id="install-pwa-btn"
            onClick={handleInstallClick}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-500" />
            <span>Instalar RE28 en este Teléfono</span>
          </button>
        </div>
      </div>

      {/* Modal de Guía de Instalación para Teléfonos */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src="/app-icon.png" alt="RE28" className="w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-slate-700 shadow-xs" />
                <div>
                  <h3 className="font-bold text-sm">Instalar RE28</h3>
                  <p className="text-[11px] text-slate-500">Acceso directo en pantalla de inicio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-300">
                <strong className="block mb-1 text-[13px]">📱 En Android (Google Chrome):</strong>
                <p className="mb-1">En las versiones recientes de Chrome:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Toca el botón <strong>"Compartir..."</strong> (el que tiene el ícono de WhatsApp).</li>
                  <li>En el menú que se abre, baja y toca <strong>"Agregar a la pantalla principal"</strong> (o "Instalar aplicación").</li>
                  <li>Confirma el nombre <strong>RE28</strong> y listo.</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300">
                <strong className="block mb-1 text-[13px]">🍏 En iPhone (Safari):</strong>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba).</li>
                  <li>Selecciona <strong>"Agregar al inicio"</strong>.</li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
