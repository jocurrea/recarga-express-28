'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatBs, formatUsd } from '@/lib/calculator';
import { getPayallManualProfits, savePayallManualProfit, getTodayDateStr } from '@/lib/storage';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, Sparkles } from 'lucide-react';

export default function PayallManualCard({ tasaBcv = 0, theme = 'dark' }) {
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual
  const [manualProfits, setManualProfits] = useState({});

  useEffect(() => {
    setMounted(true);
    setManualProfits(getPayallManualProfits());
  }, []);

  const todayStr = useMemo(() => getTodayDateStr(), []);

  // Calcular los días de la semana (Lunes a Domingo) según el weekOffset
  const daysOfWeek = useMemo(() => {
    if (!mounted) return [];
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);

    const dayOfWeek = now.getDay(); // 0 domingo, 1 lunes...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const result = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const diaNum = d.getDate();
      const mesCorto = d.toLocaleDateString('es-VE', { month: 'short' });

      result.push({
        nombre: dayNames[i],
        fechaIso: iso,
        etiquetaCorta: `${dayNames[i].slice(0, 3)} ${diaNum}`,
        etiquetaCompleta: `${dayNames[i]} ${diaNum} ${mesCorto}`,
        isToday: iso === todayStr
      });
    }

    return result;
  }, [weekOffset, mounted, todayStr]);

  // Rango de la semana en el encabezado
  const weekRangeTitle = useMemo(() => {
    if (!daysOfWeek.length) return '';
    const d1 = daysOfWeek[0];
    const d2 = daysOfWeek[6];
    return `${d1.etiquetaCorta} - ${d2.etiquetaCorta}`;
  }, [daysOfWeek]);

  // Manejar cambio en el input de un día
  const handleChangeProfit = (fechaIso, value) => {
    const updated = savePayallManualProfit(fechaIso, value);
    setManualProfits({ ...updated });
  };

  // Totales de la semana
  const totals = useMemo(() => {
    let sumBs = 0;
    daysOfWeek.forEach((d) => {
      const val = Number(manualProfits[d.fechaIso] || 0);
      if (val > 0) sumBs += val;
    });
    const sumUsd = tasaBcv > 0 ? sumBs / tasaBcv : 0;
    return { sumBs, sumUsd };
  }, [daysOfWeek, manualProfits, tasaBcv]);

  if (!mounted) return null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}
    >
      {/* Encabezado con marca Payall y Navegador de Semanas */}
      <div className="flex items-center justify-between mb-3 border-b pb-3 border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs animate-pulse"></span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ganancia Payall
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                App Manual
              </span>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Copia lo que da tu app Payall por día
            </p>
          </div>
        </div>

        {/* Navegador de Semanas */}
        <div className={`flex items-center rounded-lg p-0.5 text-xs border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            id="payall-prev-week-btn"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className={`p-1 rounded-md transition cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Semana anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className={`px-1.5 text-[10px] font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            {weekOffset === 0 ? 'Esta Semana' : weekRangeTitle}
          </span>
          <button
            id="payall-next-week-btn"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className={`p-1 rounded-md transition cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Semana siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabla de los 7 Días */}
      <div className="space-y-1.5">
        <div className={`grid grid-cols-12 text-[10px] uppercase font-bold tracking-wider px-2 py-1 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span className="col-span-4">Día</span>
          <span className="col-span-4 text-right pr-2">Ganancia Bs.</span>
          <span className="col-span-4 text-right">Divisa ($)</span>
        </div>

        <div className="space-y-1">
          {daysOfWeek.map((d) => {
            const rawVal = manualProfits[d.fechaIso];
            const currentBs = rawVal !== undefined ? rawVal : '';
            const usd = currentBs > 0 && tasaBcv > 0 ? Number(currentBs) / tasaBcv : 0;

            return (
              <div
                key={d.fechaIso}
                className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-xl border transition ${
                  d.isToday
                    ? isLight
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-emerald-950/20 border-emerald-800/80 shadow-xs'
                    : isLight
                    ? 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80'
                }`}
              >
                {/* Nombre del Día */}
                <div className="col-span-4 flex items-center gap-1.5">
                  <span className={`text-xs font-bold capitalize ${
                    d.isToday ? 'text-emerald-700 dark:text-emerald-400' : isLight ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    {d.nombre}
                  </span>
                  {d.isToday && (
                    <span className="text-[8px] font-black uppercase px-1 rounded bg-emerald-500 text-slate-950">
                      Hoy
                    </span>
                  )}
                </div>

                {/* Input Manual de Ganancia en Bs */}
                <div className="col-span-4 pr-1">
                  <div className="relative flex items-center">
                    <input
                      id={`payall-input-${d.fechaIso}`}
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={currentBs}
                      onChange={(e) => handleChangeProfit(d.fechaIso, e.target.value)}
                      className={`w-full text-right font-mono font-bold text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isLight
                          ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          : 'bg-slate-900 border-slate-700 text-white placeholder-slate-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Cálculo Automático en Divisa ($ BCV) */}
                <div className="col-span-4 text-right font-mono">
                  {usd > 0 ? (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {formatUsd(usd)}
                    </span>
                  ) : (
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                      -
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fila de Totales de la Semana */}
      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between font-mono text-xs ${
        isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-900/30'
      } p-2 rounded-xl`}>
        <div className="font-sans">
          <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Total Semana Payall
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Tasa: {formatBs(tasaBcv)}
          </span>
        </div>

        <div className="text-right">
          <span className="font-black text-sm text-slate-900 dark:text-white block">
            {formatBs(totals.sumBs)}
          </span>
          <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 block">
            ≈ {formatUsd(totals.sumUsd)}
          </span>
        </div>
      </div>
    </div>
  );
}
