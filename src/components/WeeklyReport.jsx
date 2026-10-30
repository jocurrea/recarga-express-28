'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { formatBs, formatUsd, calculateDailySummary } from '@/lib/calculator';
import { exportWeeklyReport } from '@/lib/excelExport';
import { ChevronLeft, ChevronRight, Sparkles, Calendar, DollarSign, Download, FileText, Clock, CheckCircle2, User, X, Wallet, TrendingUp } from 'lucide-react';
import ReportPdfModal from './ReportPdfModal';

export default function WeeklyReport({
  allTransactions = [],
  allAlquiler = [],
  tasaBcv = 0,
  dailyRates = {},
  config,
  theme = 'dark',
  onToggleEstadoPago,
  onAbonarDeuda
}) {
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual, -1 = semana anterior
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [payPendingTx, setPayPendingTx] = useState(null);
  const [payPendingMethod, setPayPendingMethod] = useState('efectivo');
  const [payMode, setPayMode] = useState('abono'); // 'abono' | 'total'
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoError, setAbonoError] = useState('');
  const [viewMode, setViewMode] = useState('neta'); // 'neta' (por defecto: Ganancia Neta Real diaria) o 'bruta'

  useEffect(() => {
    setMounted(true);
  }, []);

  // Obtener lunes y domingo de la semana correspondiente
  const { startOfWeek, daysOfWeek } = useMemo(() => {
    if (!mounted) {
      return { startOfWeek: null, daysOfWeek: [] };
    }
    const now = new Date();
    // Ajustar por offset de semana
    now.setDate(now.getDate() + weekOffset * 7);

    // Encontrar el lunes de esta semana (0 es domingo, 1 es lunes)
    const dayOfWeek = now.getDay(); // 0-6
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        nombre: dayNames[i],
        fechaIso: iso,
        dateObj: d
      });
    }

    return {
      startOfWeek: monday,
      daysOfWeek: days
    };
  }, [weekOffset, mounted]);

  // Agrupar transacciones por día de la semana con soporte para tasas diarias y Ganancia Neta Real
  const weekData = useMemo(() => {
    let grandTotalBs = 0;
    let grandTotalPayall = 0;
    let grandTotalPagoDirecto = 0;
    let grandTotalRecargas = 0;
    let grandTotalUsd = 0;
    let grandTotalNetaBs = 0;
    let grandTotalNetaUsd = 0;
    let grandTotalAlquilerGanancia = 0;
    let grandTotalDeduccionesBs = 0;
    let grandTotalConsolidadaBs = 0;

    const rows = daysOfWeek.map((day) => {
      const txs = allTransactions.filter((t) => t.fecha === day.fechaIso);
      const alqs = (allAlquiler || []).filter((a) => a.fecha === day.fechaIso);

      const dayRate = (dailyRates && Number(dailyRates[day.fechaIso]) > 0)
        ? Number(dailyRates[day.fechaIso])
        : Number(tasaBcv || 887.30);

      // Usamos calculateDailySummary para obtener arqueo, comisiones y deducciones reales del día
      const daySummary = calculateDailySummary(txs, config || {}, dayRate, alqs);

      const hasActivity = txs.length > 0 || alqs.length > 0;

      const dayTotalBs = daySummary.gananciaBruta;
      const dayPayall = daySummary.gananciaPayall;
      const dayPagoDirecto = daySummary.gananciaPagoDirecto;
      const dayAlquilerGananciaBs = daySummary.totalAlquilerGananciaBs;
      const dayDeduccionesBs = daySummary.totalDeduccionesBs;
      const dayNetaBs = daySummary.gananciaNetaBs;
      const dayNetaUsd = daySummary.gananciaNetaUsd;
      const dayBrutaUsd = dayRate > 0 ? (daySummary.gananciaBrutaConsolidada || dayTotalBs) / dayRate : 0;
      const dayRecargasUsd = dayRate > 0 ? dayTotalBs / dayRate : 0;

      grandTotalBs += dayTotalBs;
      grandTotalPayall += dayPayall;
      grandTotalPagoDirecto += dayPagoDirecto;
      grandTotalRecargas += txs.length;
      grandTotalUsd += dayRecargasUsd;
      grandTotalNetaBs += dayNetaBs;
      grandTotalNetaUsd += dayNetaUsd;
      grandTotalAlquilerGanancia += dayAlquilerGananciaBs;
      grandTotalDeduccionesBs += dayDeduccionesBs;
      grandTotalConsolidadaBs += (daySummary.gananciaBrutaConsolidada || dayTotalBs);

      return {
        ...day,
        hasActivity,
        totalGanancia: dayTotalBs,
        totalPayall: dayPayall,
        totalPagoDirecto: dayPagoDirecto,
        totalAlquilerGananciaBs: dayAlquilerGananciaBs,
        totalDeduccionesBs: dayDeduccionesBs,
        gananciaNetaBs: dayNetaBs,
        gananciaNetaUsd: dayNetaUsd,
        count: txs.length,
        dayRate,
        dayUsd: dayNetaUsd, // Por solicitud del usuario: la columna refleja la Ganancia Neta Real diaria
        dayBrutaUsd,
        dayRecargasUsd,
        summary: daySummary
      };
    });

    return {
      rows,
      grandTotalBs,
      grandTotalPayall,
      grandTotalPagoDirecto,
      grandTotalUsd,
      grandTotalRecargas,
      grandTotalNetaBs,
      grandTotalNetaUsd,
      grandTotalAlquilerGanancia,
      grandTotalDeduccionesBs,
      grandTotalConsolidadaBs
    };
  }, [daysOfWeek, allTransactions, allAlquiler, tasaBcv, dailyRates, config]);

  // Rango de fechas a mostrar en título
  const rangeTitle = useMemo(() => {
    if (!daysOfWeek.length) return '';
    const d1 = daysOfWeek[0].dateObj;
    const d2 = daysOfWeek[6].dateObj;
    return `${d1.getDate()} de ${d1.toLocaleDateString('es-VE', { month: 'short' })} - ${d2.getDate()} de ${d2.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' })}`;
  }, [daysOfWeek]);

  // Recargas fiadas pendientes dentro de esta semana
  const pendingWeeklyTxs = useMemo(() => {
    return allTransactions.filter(
      (t) => t.estadoPago === 'pendiente' && daysOfWeek.some((d) => d.fechaIso === t.fecha)
    );
  }, [allTransactions, daysOfWeek]);

  const totalPendienteSemanaBs = useMemo(() => {
    return pendingWeeklyTxs.reduce((sum, t) => sum + Number(t.montoCobrado || 0), 0);
  }, [pendingWeeklyTxs]);

  // Exportar reporte semanal nativo a Excel (.xlsx)
  const exportWeeklyExcel = () => {
    exportWeeklyReport(weekData, daysOfWeek, tasaBcv);
  };

  return (
    <div className="w-full space-y-6">
      {/* Controles de Semana y Botón Exportar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
          : 'bg-[#0f172a] border-slate-800 text-slate-100 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-base font-bold capitalize tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Ganancia por Semana
            </h2>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {rangeTitle || 'Cargando semana...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navegador de Semanas */}
          <div className={`flex items-center rounded-xl p-0.5 text-xs border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              id="prev-week-btn"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className={`p-1.5 rounded-lg transition ${
                isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="current-week-btn"
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1 font-bold rounded-lg transition ${
                weekOffset === 0
                  ? isLight
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-orange-950/40 text-orange-300 border border-orange-800'
                  : isLight ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white'
              }`}
            >
              Esta Semana
            </button>

            <button
              id="next-week-btn"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              disabled={weekOffset >= 0}
              className={`p-1.5 rounded-lg transition ${
                weekOffset >= 0
                  ? 'text-slate-400 opacity-40 cursor-not-allowed'
                  : isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botones de Exportación */}
          <div className="flex items-center gap-2">
            <button
              id="export-weekly-pdf-btn"
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer"
              title="Abrir vista previa y guardar reporte semanal en PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>

            <button
              id="export-weekly-excel-btn"
              onClick={exportWeeklyExcel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Descargar tabla semanal en Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DESTACADA: CLIENTES FIADOS PENDIENTES DE LA SEMANA */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm ${
        pendingWeeklyTxs.length > 0
          ? isLight
            ? 'bg-amber-50/70 border-amber-300 text-slate-800'
            : 'bg-amber-950/25 border-amber-700/60 text-slate-100'
          : isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              pendingWeeklyTxs.length > 0
                ? isLight ? 'bg-amber-500/20 text-amber-700' : 'bg-amber-500/20 text-amber-300'
                : isLight ? 'bg-emerald-500/20 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {pendingWeeklyTxs.length > 0 ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Clientes con Recargas Fiadas Pendientes esta Semana
                </h3>
                {pendingWeeklyTxs.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 shadow-xs">
                    {pendingWeeklyTxs.length} Pendiente{pendingWeeklyTxs.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {pendingWeeklyTxs.length > 0
                  ? 'Recuerda cobrar a estos clientes fijos para cerrar la semana con caja completa.'
                  : '✓ ¡Semana al día! No tienes recargas pendientes por cobrar a clientes.'}
              </p>
            </div>
          </div>

          {pendingWeeklyTxs.length > 0 && (
            <div className={`text-left sm:text-right font-mono px-4 py-2.5 rounded-xl border ${
              isLight
                ? 'bg-amber-100/90 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>
                Total por Cobrar
              </span>
              <span className={`text-xl font-black block ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                {formatBs(totalPendienteSemanaBs)}
              </span>
              {tasaBcv > 0 && (
                <span className={`text-xs font-bold block ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>
                  ≈ {formatUsd(totalPendienteSemanaBs / tasaBcv)}
                </span>
              )}
            </div>
          )}
        </div>

        {pendingWeeklyTxs.length > 0 && (
          <div className={`overflow-x-auto rounded-xl border mt-4 ${
            isLight ? 'border-amber-300 bg-white' : 'border-amber-800/60 bg-[#0f172a]'
          }`}>
            <table className="w-full text-left text-xs font-sans">
              <thead className={`text-[11px] uppercase font-bold border-b ${
                isLight
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-amber-950/50 text-amber-200 border-amber-900'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">Cliente Fiador</th>
                  <th className="py-2.5 px-3">Día / Fecha</th>
                  <th className="py-2.5 px-3">Operadora</th>
                  <th className="py-2.5 px-3">Teléfono / Contrato</th>
                  <th className="py-2.5 px-3 text-right">Monto a Cobrar</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800 bg-[#0f172a]'
              }`}>
                {pendingWeeklyTxs.map((tx) => {
                  const dayObj = daysOfWeek.find((d) => d.fechaIso === tx.fecha);
                  return (
                    <tr
                      key={tx.id}
                      className={`transition ${
                        isLight ? 'hover:bg-amber-50/80' : 'hover:bg-amber-950/20'
                      }`}
                    >
                      <td className={`py-3 px-3 font-sans font-bold text-xs ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        <span className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isLight ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm font-black">
                            {tx.clienteNombre || 'Cliente habitual'}
                          </span>
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-sans text-xs ${
                        isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        <span className="font-bold block">
                          {dayObj ? `${dayObj.nombre} (${tx.fecha})` : tx.fecha}
                        </span>
                        <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {tx.hora}
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <span className={`inline-block px-2 py-0.5 rounded-md font-black text-xs ${
                          isLight
                            ? 'bg-slate-200/80 text-slate-900 border border-slate-300'
                            : 'bg-slate-800 text-slate-100 border border-slate-700'
                        }`}>
                          {tx.operadoraNombre}
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-mono text-xs font-bold ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}>
                        {tx.telefono || '-'}
                      </td>
                      <td className={`py-3 px-3 text-right font-black font-mono text-base ${
                        isLight ? 'text-amber-900' : 'text-amber-300'
                      }`}>
                        <div>
                          <span>{formatBs(tx.montoCobrado)}</span>
                          {Number(tx.totalAbonado || 0) > 0 && (
                            <span className="block text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                              Abonado: +{formatBs(tx.totalAbonado)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPayPendingTx(tx);
                            setPayPendingMethod(tx.metodo === 'mixto' ? 'efectivo' : (tx.metodo || 'efectivo'));
                            setPayMode('abono');
                            setAbonoMonto('');
                            setAbonoError('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition cursor-pointer"
                          title="Cobrar total o registrar abono a esta deuda"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cobrar / Abonar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tarjeta tipo WPS Office "Ganancia Por semana P1" */}
      <div className={`rounded-xl overflow-hidden border shadow-xs transition-colors ${
        isLight
          ? 'bg-white border-slate-200'
          : 'bg-[#0f172a] border-slate-800'
      }`}>
        {/* Cabecera espiritual de bendición con Selector de Modo Neta Real vs Bruta */}
        <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              DIOS ES NUESTRO PROVEEDOR
            </span>
            <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-md border ${
              isLight ? 'bg-slate-200/60 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {weekData.grandTotalRecargas} Recargas esta semana
            </span>
          </div>

          {/* Toggle entre Ganancia Neta Real (En Bolsillo) y Ganancia Bruta */}
          <div className={`flex items-center p-0.5 rounded-lg border text-xs font-bold ${
            isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('neta')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'neta'
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-500 text-slate-950 shadow-xs'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
              title="Ver Ganancia Neta Real tras descontar comisiones bancarias y alquiler de punto"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Ganancia Neta Real (Diaria)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bruta')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'bruta'
                  ? isLight
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-700 text-white shadow-xs'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
              title="Ver Ganancia Bruta total de recargas"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ganancia Bruta</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-xs font-bold uppercase tracking-wider border-b ${
              isLight
                ? 'bg-slate-50 text-slate-700 border-slate-200'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}>
              <tr>
                <th className="py-3 px-5">Ganancia Diaria</th>
                <th className="py-3 px-5 text-right">Bolívares (Bs.)</th>
                <th className="py-3 px-5 text-right">Payall (Bs.)</th>
                <th className="py-3 px-5 text-right">PagoDirecto (Bs.)</th>
                <th className="py-3 px-5 text-right">
                  {viewMode === 'neta' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Equiv. $ BCV (Neta Real)
                    </span>
                  ) : (
                    <span>Equiv. $ BCV (Bruta)</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${
              isLight ? 'divide-slate-100' : 'divide-slate-800'
            }`}>
              {weekData.rows.map((row) => {
                const isNeta = viewMode === 'neta';
                const displayUsd = isNeta ? row.gananciaNetaUsd : row.dayBrutaUsd;
                return (
                  <tr
                    key={row.fechaIso}
                    className={`transition ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0f1c3d]'
                    }`}
                  >
                    <td className={`py-3 px-6 font-sans font-bold ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>{row.nombre}</span>
                        {row.dayRate > 0 && (
                          <span
                            className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            title={`Tasa oficial de este día: ${formatBs(row.dayRate)}`}
                          >
                            {formatBs(row.dayRate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-6 text-right font-black ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {row.hasActivity ? (
                        <div>
                          <span>{formatBs(row.totalGanancia)}</span>
                          {row.totalAlquilerGananciaBs > 0 && (
                            <span className="block text-[10px] font-normal text-orange-600 dark:text-orange-400 font-mono">
                              +{formatBs(row.totalAlquilerGananciaBs)} alq.
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-6 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {row.totalPayall > 0 ? formatBs(row.totalPayall) : '-'}
                    </td>
                    <td className="py-3 px-6 text-right text-blue-600 dark:text-blue-400 font-bold">
                      {row.totalPagoDirecto > 0 ? formatBs(row.totalPagoDirecto) : '-'}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {row.hasActivity ? (
                        <div>
                          <span className={`font-mono text-sm font-black block ${
                            isNeta
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                              : (isLight ? 'text-amber-900 font-bold' : 'text-amber-300')
                          }`}>
                            {formatUsd(displayUsd)}
                          </span>
                          {isNeta && (
                            <span className={`text-[10px] font-mono block ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              Neto: {formatBs(row.gananciaNetaBs)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* SECCIÓN DE TOTALES EXACTA AL EXCEL */}
            <tfoot className={`font-mono border-t-2 ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900 border-slate-800'
            }`}>
              {/* FILA 1: TOTAL GANANCIA BRUTA SEMANAL */}
              <tr className={isLight ? 'bg-amber-100/70 border-b border-amber-300' : 'bg-amber-500/10 border-b border-amber-500/20'}>
                <td className={`py-3.5 px-6 font-sans font-black uppercase text-xs ${
                  isLight ? 'text-amber-950' : 'text-amber-300'
                }`}>
                  TOTAL GANANCIA BRUTA SEMANAL
                </td>
                <td className={`py-3.5 px-6 text-right font-black text-xl ${
                  isLight ? 'text-amber-950' : 'text-amber-300'
                }`}>
                  {formatBs(weekData.grandTotalBs)}
                </td>
                <td className="py-3.5 px-6 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBs(weekData.grandTotalPayall)}
                </td>
                <td className="py-3.5 px-6 text-right font-bold text-blue-600 dark:text-blue-400">
                  {formatBs(weekData.grandTotalPagoDirecto)}
                </td>
                <td className={`py-3.5 px-6 text-right font-bold ${
                  isLight ? 'text-amber-950 font-black' : 'text-amber-300'
                }`}>
                  {formatUsd(weekData.grandTotalUsd)}
                </td>
              </tr>

              {/* FILA 2: TOTAL GANANCIA NETA REAL (EN BOLSILLO) */}
              <tr className={isLight ? 'bg-emerald-50 border-b border-emerald-200' : 'bg-emerald-950/30 border-b border-emerald-800/40'}>
                <td className={`py-3 px-6 font-sans font-black uppercase text-xs ${
                  isLight ? 'text-emerald-900' : 'text-emerald-300'
                }`}>
                  TOTAL GANANCIA NETA REAL (EN BOLSILLO)
                </td>
                <td className={`py-3 px-6 text-right font-black text-xl ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  +{formatBs(weekData.grandTotalNetaBs)}
                </td>
                <td colSpan={2} className={`py-3 px-6 text-center text-xs font-sans ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {weekData.grandTotalDeduccionesBs > 0
                    ? `Deducciones de la semana: -${formatBs(weekData.grandTotalDeduccionesBs)}`
                    : 'Sin deducciones aplicadas'}
                </td>
                <td className={`py-3 px-6 text-right font-black text-xl ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  +{formatUsd(weekData.grandTotalNetaUsd)}
                </td>
              </tr>

              {/* FILA 3: TOTAL DESTACADO EN DÓLARES */}
              <tr className="bg-orange-500/10 border-b border-orange-500/20">
                <td className="py-3 px-6 font-sans font-bold text-orange-600 dark:text-orange-300 uppercase text-xs">
                  {viewMode === 'neta' ? 'TOTAL NETA REAL SEMANAL ($ BCV)' : 'TOTAL BRUTA SEMANAL ($ BCV)'}
                </td>
                <td
                  colSpan={4}
                  className="py-3 px-6 text-right font-black text-2xl text-orange-600 dark:text-orange-300"
                >
                  {formatUsd(viewMode === 'neta' ? weekData.grandTotalNetaUsd : weekData.grandTotalUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Rápido para Cobrar o Abonar Recarga Fiada en Vista Semanal */}
      {payPendingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200 bg-emerald-50/50' : 'border-slate-800 bg-emerald-950/20'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {payMode === 'abono' ? 'Registrar Abono a Deuda' : 'Cobrar Recarga Fiada (100%)'}
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {payMode === 'abono'
                      ? 'Descuenta de la deuda pendiente e ingresa dinero a caja hoy'
                      : 'Saldar deuda completa y pasar a pagado (verde)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayPendingTx(null)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Selector de Modo: Abono Parcial vs Cobro Total */}
              <div className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-bold ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setPayMode('abono');
                    setAbonoError('');
                  }}
                  className={`py-2 px-3 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    payMode === 'abono'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Abono Parcial</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayMode('total');
                    setAbonoError('');
                  }}
                  className={`py-2 px-3 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    payMode === 'total'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cobro Total (100%)</span>
                </button>
              </div>

              {/* Resumen del cliente y deuda actual */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-semibold uppercase tracking-wider text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Cliente
                  </span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {payPendingTx.clienteNombre || 'Cliente frecuente'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-semibold text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Operadora / Fecha
                  </span>
                  <span className={`font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {payPendingTx.operadoraNombre} • {payPendingTx.fecha} {payPendingTx.hora}
                  </span>
                </div>
                {Number(payPendingTx.totalAbonado || 0) > 0 && (
                  <div className="flex items-center justify-between mb-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="font-semibold text-[11px]">Abonos Previos</span>
                    <span className="font-mono font-bold">+{formatBs(payPendingTx.totalAbonado)}</span>
                  </div>
                )}
                <div className={`pt-2 mt-2 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <span className={`font-bold text-xs uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Deuda Pendiente Actual
                  </span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-lg">
                    {formatBs(payPendingTx.montoCobrado)}
                  </span>
                </div>
              </div>

              {/* Input de Monto si es Abono Parcial */}
              {payMode === 'abono' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      ¿Cuánto abona el cliente hoy? (Bs)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Máx: {formatBs(payPendingTx.montoCobrado)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max={payPendingTx.montoCobrado}
                      autoFocus
                      placeholder={`Ej: 5000`}
                      value={abonoMonto}
                      onChange={(e) => {
                        setAbonoMonto(e.target.value);
                        setAbonoError('');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-base font-mono font-black border transition ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      Bs.
                    </span>
                  </div>

                  {/* Botones de sugerencia rápida */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Number(payPendingTx.montoCobrado) > 5000 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAbonoMonto('5000');
                          setAbonoError('');
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border transition cursor-pointer ${
                          abonoMonto === '5000'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        5.000 Bs
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const mitad = Math.round((Number(payPendingTx.montoCobrado) / 2) * 100) / 100;
                        setAbonoMonto(String(mitad));
                        setAbonoError('');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border transition cursor-pointer ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                    >
                      50% ({formatBs(Number(payPendingTx.montoCobrado) / 2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAbonoMonto(String(payPendingTx.montoCobrado));
                        setAbonoError('');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border transition cursor-pointer ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                    >
                      Total ({formatBs(payPendingTx.montoCobrado)})
                    </button>
                  </div>

                  {/* Cuadro de previsualización de saldo */}
                  {Number(abonoMonto) > 0 && (
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono ${
                      isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
                    }`}>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Ingreso a Caja Hoy</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                          +{formatBs(Number(abonoMonto))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Resta de Deuda</span>
                        <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                          {formatBs(Math.max(0, Number(payPendingTx.montoCobrado) - Number(abonoMonto)))}
                        </span>
                      </div>
                    </div>
                  )}

                  {abonoError && (
                    <p className="text-red-500 font-bold text-xs mt-1">
                      {abonoError}
                    </p>
                  )}
                </div>
              )}

              {/* Selección del método de pago con el que abona/paga hoy */}
              <div>
                <label className={`block font-bold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  ¿Cómo entrega el dinero hoy?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'efectivo', nombre: 'Efectivo', color: 'emerald' },
                    { id: 'pagomovil', nombre: 'Pago Móvil', color: 'violet' },
                    { id: 'punto', nombre: 'Punto POS', color: 'sky' },
                    { id: 'biopago', nombre: 'BioPago', color: 'amber' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayPendingMethod(m.id)}
                      className={`p-2.5 rounded-xl font-bold border text-center transition cursor-pointer text-xs ${
                        payPendingMethod === m.id
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {m.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de confirmación */}
              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                isLight ? 'border-slate-100' : 'border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setPayPendingTx(null)}
                  className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                    isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  id="confirm-weekly-pay-pending-btn"
                  type="button"
                  onClick={() => {
                    if (payMode === 'abono') {
                      const num = Number(abonoMonto);
                      if (!num || num <= 0) {
                        setAbonoError('Por favor ingresa un monto mayor a 0 Bs.');
                        return;
                      }
                      if (num >= Number(payPendingTx.montoCobrado)) {
                        // El abono cubre el total o más, liquidar deuda
                        onToggleEstadoPago?.(payPendingTx.id, payPendingMethod);
                      } else {
                        onAbonarDeuda?.(payPendingTx.id, num, payPendingMethod);
                      }
                      setPayPendingTx(null);
                    } else {
                      onToggleEstadoPago?.(payPendingTx.id, payPendingMethod);
                      setPayPendingTx(null);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-black text-white transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                    payMode === 'abono'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {payMode === 'abono'
                      ? Number(abonoMonto) > 0 ? `Registrar Abono (+${formatBs(Number(abonoMonto))})` : 'Registrar Abono'
                      : 'Saldar Deuda Completa'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reporte Semanal PDF */}
      <ReportPdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        type="semanal"
        weekData={weekData}
        daysOfWeek={daysOfWeek}
        tasaBcv={tasaBcv}
        pendingWeeklyTxs={pendingWeeklyTxs}
        totalPendienteSemanaBs={totalPendienteSemanaBs}
        theme={theme}
      />
    </div>
  );
}
