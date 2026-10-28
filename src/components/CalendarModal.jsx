'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Sparkles,
  ArrowRight,
  Check,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { formatBs } from '@/lib/calculator';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIso(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  dailyRates = {},
  allTransactions = [],
  theme = 'dark'
}) {
  const isLight = theme === 'light';

  const todayStr = useMemo(() => {
    const d = new Date();
    return toIso(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Fecha de referencia inicial para el mes visible
  const initialDate = useMemo(() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [tempDate, setTempDate] = useState(selectedDate || todayStr);
  const [directInput, setDirectInput] = useState(selectedDate || todayStr);

  useEffect(() => {
    if (isOpen && selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setTempDate(selectedDate);
      setDirectInput(selectedDate);
    }
  }, [isOpen, selectedDate]);

  // Mapa rápido de cantidad de transacciones por día
  const txCountMap = useMemo(() => {
    const map = {};
    for (const t of allTransactions) {
      if (t.fecha) {
        map[t.fecha] = (map[t.fecha] || 0) + 1;
      }
    }
    return map;
  }, [allTransactions]);

  // Generador de la cuadrícula mensual (Lunes a Domingo)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    // 0 es Domingo, 1 es Lunes en JS Date.getDay()
    // Convertimos a 0 = Lun, 1 = Mar, ... 6 = Dom
    let startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];

    // Días del mes anterior para rellenar la primera semana
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const iso = toIso(prevDate.getFullYear(), prevDate.getMonth(), dayNum);
      days.push({
        dayNum,
        iso,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const iso = toIso(viewYear, viewMonth, d);
      days.push({
        dayNum: d,
        iso,
        isCurrentMonth: true
      });
    }

    // Días del mes siguiente para completar cuadrícula (máximo 42 celdas o múltiplos de 7)
    const remainder = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const iso = toIso(nextDate.getFullYear(), nextDate.getMonth(), d);
      days.push({
        dayNum: d,
        iso,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => {
    setViewYear((y) => y - 1);
  };

  const handleNextYear = () => {
    setViewYear((y) => y + 1);
  };

  const handleSelectDay = (iso) => {
    setTempDate(iso);
    setDirectInput(iso);
    onSelectDate?.(iso);
    onClose?.();
  };

  const handleQuickJump = (iso) => {
    const [y, m] = iso.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setTempDate(iso);
    setDirectInput(iso);
    onSelectDate?.(iso);
    onClose?.();
  };

  // Atajos rápidos
  const handleJumpToday = () => handleQuickJump(todayStr);

  const handleJumpYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const iso = toIso(d.getFullYear(), d.getMonth(), d.getDate());
    handleQuickJump(iso);
  };

  const handleJumpMonday = () => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // 0 = Lun
    d.setDate(d.getDate() - day);
    const iso = toIso(d.getFullYear(), d.getMonth(), d.getDate());
    handleQuickJump(iso);
  };

  const handleJumpFirstOfMonth = () => {
    const d = new Date();
    const iso = toIso(d.getFullYear(), d.getMonth(), 1);
    handleQuickJump(iso);
  };

  const handleDirectSearch = (e) => {
    e.preventDefault();
    if (!directInput) return;
    const [y, m] = directInput.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
      setTempDate(directInput);
      onSelectDate?.(directInput);
      onClose?.();
    }
  };

  // Datos del día seleccionado temporal o activo
  const activeIso = tempDate || selectedDate || todayStr;
  const activeRate = dailyRates[activeIso];
  const activeTxCount = txCountMap[activeIso] || 0;

  const formatFullDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0f172a] border-slate-800 text-slate-100 shadow-orange-950/20'
        }`}
      >
        {/* Cabecera del Almanaque */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Almanaque de Control</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Busca cualquier fecha y consulta su tasa y operaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Cerrar almanaque"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controles de Navegación de Mes y Año */}
        <div className={`px-5 py-3 border-b flex items-center justify-between gap-2 ${
          isLight ? 'bg-white border-slate-100' : 'bg-[#0f172a] border-slate-800/80'
        }`}>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevYear}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Año anterior"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold capitalize">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleNextMonth}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextYear}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Año siguiente"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cuadrícula del Calendario */}
        <div className="p-4 overflow-y-auto">
          {/* Encabezados de días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAY_NAMES.map((d, idx) => (
              <span
                key={d}
                className={`text-[11px] font-bold uppercase py-1 ${
                  idx >= 5
                    ? 'text-orange-500'
                    : isLight
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Celdas de días */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isSelected = item.iso === tempDate;
              const isToday = item.iso === todayStr;
              const hasTx = Boolean(txCountMap[item.iso]);
              const dayRate = dailyRates[item.iso];

              return (
                <button
                  key={`${item.iso}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(item.iso)}
                  className={`relative min-h-[52px] sm:min-h-[58px] p-1 rounded-xl flex flex-col justify-between items-center transition border text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black shadow-md border-orange-400 ring-2 ring-orange-400/40'
                      : isToday
                      ? isLight
                        ? 'bg-orange-50/70 border-orange-300 text-orange-900 font-bold'
                        : 'bg-orange-950/30 border-orange-700/60 text-orange-300 font-bold'
                      : !item.isCurrentMonth
                      ? isLight
                        ? 'text-slate-300 border-transparent hover:bg-slate-100'
                        : 'text-slate-600 border-transparent hover:bg-slate-800/40'
                      : isLight
                      ? 'bg-white border-slate-100 hover:border-orange-300 hover:bg-slate-50 text-slate-800'
                      : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800 text-slate-200'
                  }`}
                  title={`${item.iso}${dayRate ? ` • Tasa: ${formatBs(dayRate)}` : ''}${hasTx ? ` • ${txCountMap[item.iso]} recargas` : ''}`}
                >
                  {/* Número del día y distintivo 'HOY' */}
                  <div className="w-full flex items-center justify-between px-1">
                    <span className={`text-xs ${isSelected ? 'text-white' : ''}`}>
                      {item.dayNum}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    )}
                  </div>

                  {/* Badges de Tasa y Operaciones */}
                  <div className="w-full flex flex-col items-center gap-0.5">
                    {/* Indicador de Tasa si existe */}
                    {dayRate ? (
                      <span
                        className={`text-[9px] font-mono font-bold px-1 rounded truncate max-w-full leading-tight ${
                          isSelected
                            ? 'bg-black/25 text-amber-100'
                            : isLight
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {Math.round(dayRate)}
                      </span>
                    ) : null}

                    {/* Indicador de Operaciones si hay */}
                    {hasTx && (
                      <span
                        className={`text-[9px] font-bold px-1 rounded flex items-center gap-0.5 leading-tight ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isLight
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                        {txCountMap[item.iso]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Atajos Rápidos */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-bold mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Saltos Rápidos:
            </span>
            <button
              type="button"
              onClick={handleJumpToday}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                isLight
                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                  : 'bg-orange-950/40 border-orange-800/60 text-orange-300 hover:bg-orange-900/50'
              }`}
            >
              ⚡ Hoy
            </button>
            <button
              type="button"
              onClick={handleJumpYesterday}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ⬅ Ayer
            </button>
            <button
              type="button"
              onClick={handleJumpMonday}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📅 Este Lunes
            </button>
            <button
              type="button"
              onClick={handleJumpFirstOfMonth}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📆 1° del Mes
            </button>
          </div>

          {/* Buscador Directo por selector nativo / teclado */}
          <form
            onSubmit={handleDirectSearch}
            className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-[11px] font-bold whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ir directo a fecha:
              </span>
              <input
                type="date"
                value={directInput}
                onChange={(e) => setDirectInput(e.target.value)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              Ir <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Panel Inferior: Resumen del Día Seleccionado y Botón de Acción */}
        <div className={`px-5 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <span className={`text-[10px] uppercase font-bold tracking-wider block ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Fecha Seleccionada
            </span>
            <div className="text-xs sm:text-sm font-black capitalize flex items-center gap-1.5">
              <span>{formatFullDate(activeIso)}</span>
              {activeIso === todayStr && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                  Hoy
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px]">
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <TrendingUp className="w-3 h-3" />
                Tasa: {activeRate ? formatBs(activeRate) : 'Sin fijar (Usa general)'}
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <Receipt className="w-3 h-3" />
                {activeTxCount} {activeTxCount === 1 ? 'recarga' : 'recargas'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(activeIso)}
              className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Ver este día
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
