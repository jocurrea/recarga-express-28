'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  Lock,
  User,
  Shield,
  RotateCcw
} from 'lucide-react';
import { formatBs } from '@/lib/calculator';
import CalendarModal from './CalendarModal';

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  tasaBcv,
  loadingBcv,
  onRefreshBcv,
  onSaveManualBcv,
  onOpenSettings,
  theme = 'dark',
  onToggleTheme,
  alquilerCount = 0,
  onLock,
  currentUser = null,
  dailyRates = {},
  allTransactions = []
}) {
  const isLight = theme === 'light';
  const isAdmin = currentUser ? currentUser.rol === 'admin' : true;
  const isVendedor = currentUser?.rol === 'vendedor';
  const [isEditingBcv, setIsEditingBcv] = useState(false);
  const [manualBcvInput, setManualBcvInput] = useState('');
  const [bcvFeedback, setBcvFeedback] = useState('');
  const [isAlmanaqueOpen, setIsAlmanaqueOpen] = useState(false);

  const handleRefreshClick = async () => {
    if (loadingBcv) return;
    try {
      const res = await onRefreshBcv?.();
      if (res?.tasa) {
        setBcvFeedback(`✓ BCV: ${formatBs(res.tasa)}`);
      } else {
        setBcvFeedback('✓ Actualizado');
      }
      setTimeout(() => setBcvFeedback(''), 3500);
    } catch {
      setBcvFeedback('⚠️ Error');
      setTimeout(() => setBcvFeedback(''), 3500);
    }
  };

  const getTodayStr = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const isToday = () => {
    return selectedDate === getTodayStr();
  };

  const shiftDate = (dateStr, deltaDays) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + deltaDays);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const handlePrevDay = () => {
    setSelectedDate(shiftDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(shiftDate(selectedDate, 1));
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayStr());
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-VE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const handleStartEditBcv = () => {
    setManualBcvInput(String(tasaBcv || 887.30));
    setIsEditingBcv(true);
  };

  const handleConfirmBcv = (e) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(manualBcvInput.replace(',', '.'));
    if (parsed > 0 && onSaveManualBcv) {
      onSaveManualBcv(parsed, selectedDate);
      setBcvFeedback(`✓ Guardado (${formatDateDisplay(selectedDate)}): ${formatBs(parsed)}`);
      setTimeout(() => setBcvFeedback(''), 3500);
    }
    setIsEditingBcv(false);
  };

  return (
    <header className={`sticky top-0 z-40 w-full px-3 py-2.5 sm:px-6 transition-colors border-b ${
      isLight
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-[#0f172a] border-slate-800 text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand: Insignia limpia oficial */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-14 sm:h-16 w-auto rounded-xl px-3 py-1.5 flex items-center justify-center border transition ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-white border-slate-700 shadow-sm'
            }`}>
              <img
                src="/logo.jpg"
                alt="Recarga Express 28"
                className="h-11 sm:h-13 w-auto object-contain"
              />
            </div>
          </div>

          {/* Tasa BCV con Edición Rápida */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900 border-slate-800'
          }`}>
            {isEditingBcv ? (
              <form onSubmit={handleConfirmBcv} className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-orange-600">
                  BCV ({formatDateDisplay(selectedDate)}):
                </span>
                <input
                  id="manual-bcv-input"
                  type="number"
                  step="0.01"
                  value={manualBcvInput}
                  onChange={(e) => setManualBcvInput(e.target.value)}
                  className={`w-20 text-xs font-bold px-2 py-0.5 rounded border border-orange-500 focus:outline-none ${
                    isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'
                  }`}
                  autoFocus
                />
                <button
                  type="submit"
                  title={`Guardar tasa para el día ${selectedDate}`}
                  className="p-1 rounded bg-orange-600 hover:bg-orange-700 text-white transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBcv(false)}
                  title="Cancelar"
                  className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  onClick={handleStartEditBcv}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition group"
                  title={`Tasa oficial BCV del día (${selectedDate}). Clic para editarla.`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    BCV:
                  </span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${
                    isLight ? 'text-slate-900' : 'text-amber-300'
                  }`}>
                    {formatBs(tasaBcv)}
                  </span>
                  {!isToday() && (
                    <span className="text-[9px] px-1 py-0.2 rounded font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {formatDateDisplay(selectedDate)}
                    </span>
                  )}
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-orange-500 transition" />
                </div>
                <button
                  id="refresh-bcv-btn"
                  type="button"
                  onClick={handleRefreshClick}
                  disabled={loadingBcv}
                  title="Consultar y actualizar tasa oficial en vivo desde el banco"
                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                    isLight
                      ? 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs'
                      : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shadow-2xs'
                  } ${loadingBcv ? 'opacity-70 cursor-wait' : ''}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBcv ? 'animate-spin text-orange-500' : ''}`} />
                </button>
                {bcvFeedback && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 animate-in fade-in duration-150">
                    {bcvFeedback}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date Selector con Almanaque, Theme Switcher & Settings */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5">
          {/* Day Navigator con Botón de Almanaque */}
          <div className={`flex items-center rounded-xl p-0.5 text-xs border ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              id="prev-day-btn"
              onClick={handlePrevDay}
              className={`p-1.5 rounded-lg transition ${
                isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Botón Central que abre el Almanaque Interactivo */}
            <button
              id="date-picker-btn"
              type="button"
              onClick={() => setIsAlmanaqueOpen(true)}
              className={`px-2.5 py-1 rounded-lg font-bold transition capitalize text-xs flex items-center gap-1.5 cursor-pointer ${
                isToday()
                  ? isLight
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                    : 'bg-orange-950/40 text-orange-300 border border-orange-800 hover:bg-orange-900/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Abrir almanaque para buscar cualquier día del mes"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>
                {isToday() ? 'Hoy: ' : ''}
                {formatDateDisplay(selectedDate)}
              </span>
            </button>

            <button
              id="next-day-btn"
              onClick={handleNextDay}
              disabled={isToday()}
              className={`p-1.5 rounded-lg transition ${
                isToday()
                  ? 'text-slate-400 cursor-not-allowed opacity-40'
                  : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón rápido para regresar a 'Hoy' si está navegando en el pasado */}
          {!isToday() && (
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                  : 'bg-orange-950/40 border-orange-800/60 text-orange-300 hover:bg-orange-900/60'
              }`}
              title="Volver al día de hoy inmediatamente"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoy</span>
            </button>
          )}

          {/* Botón selector de Tema: Blanco (Claro) vs Oscuro */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo blanco'}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span>Modo Blanco</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>

          {/* Badge del Usuario / Rol Activo */}
          {currentUser && (
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
              isVendedor
                ? isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : isLight
                ? 'bg-orange-50 border-orange-200 text-orange-800'
                : 'bg-orange-950/40 border-orange-800/60 text-orange-300'
            }`}>
              {isVendedor ? <User className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              <span>{currentUser.nombre}</span>
              <span className="text-[10px] opacity-75 font-normal">
                ({isVendedor ? 'Cajero' : 'Admin'})
              </span>
            </div>
          )}

          {/* Settings button (Solo Administradores) */}
          {isAdmin && (
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Configuración de tarifas, comisiones y claves"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Botón de Bloqueo / Cerrar Turno */}
          <button
            id="lock-screen-btn"
            onClick={onLock}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400 hover:bg-amber-900/60 hover:text-amber-300'
            }`}
            title="Bloquear pantalla y proteger caja"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bloquear</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className={`max-w-7xl mx-auto mt-2.5 flex items-center justify-start border-t pt-2 gap-1 overflow-x-auto no-scrollbar scroll-smooth ${
        isLight ? 'border-slate-100' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pb-1">
          <button
            id="tab-cashier-btn"
            onClick={() => setActiveTab('cajero')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'cajero'
                ? 'bg-orange-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Cajero Rápido
          </button>

          <button
            id="tab-daily-btn"
            onClick={() => setActiveTab('diario')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'diario'
                ? 'bg-orange-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Registro Diario
          </button>

          {/* Pestaña Alquiler Punto (Solo Dueño y Socio) */}
          {isAdmin && (
            <button
              id="tab-alquiler-btn"
              onClick={() => setActiveTab('alquiler')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'alquiler'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Alquiler Punto (10%)</span>
              {alquilerCount > 0 && (
                <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                  activeTab === 'alquiler'
                    ? 'bg-white text-orange-600'
                    : isLight
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-orange-950 text-orange-300'
                }`}>
                  {alquilerCount}
                </span>
              )}
            </button>
          )}

          {/* Pestaña Semanal / Excel (Solo Dueño y Socio) */}
          {isAdmin && (
            <button
              id="tab-weekly-btn"
              onClick={() => setActiveTab('semanal')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'semanal'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Semanal / Excel
            </button>
          )}
        </div>
      </div>

      {/* Almanaque Modal Desplegable */}
      <CalendarModal
        isOpen={isAlmanaqueOpen}
        onClose={() => setIsAlmanaqueOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        dailyRates={dailyRates}
        allTransactions={allTransactions}
        theme={theme}
      />
    </header>
  );
}
