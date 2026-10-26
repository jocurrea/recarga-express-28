'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { formatBs, formatUsd } from '@/lib/calculator';
import { exportWeeklyReport } from '@/lib/excelExport';
import { ChevronLeft, ChevronRight, Sparkles, Calendar, DollarSign, Download, FileText, Clock, CheckCircle2, User, X } from 'lucide-react';
import ReportPdfModal from './ReportPdfModal';

export default function WeeklyReport({
  allTransactions = [],
  tasaBcv = 0,
  config,
  theme = 'dark',
  onToggleEstadoPago
}) {
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual, -1 = semana anterior
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [payPendingTx, setPayPendingTx] = useState(null);
  const [payPendingMethod, setPayPendingMethod] = useState('efectivo');

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

  // Agrupar transacciones por día de la semana
  const weekData = useMemo(() => {
    let grandTotalBs = 0;
    let grandTotalPayall = 0;
    let grandTotalPagoDirecto = 0;
    let grandTotalRecargas = 0;

    const rows = daysOfWeek.map((day) => {
      const txs = allTransactions.filter((t) => t.fecha === day.fechaIso);
      let dayTotalBs = 0;
      let dayPayall = 0;
      let dayPagoDirecto = 0;

      txs.forEach((tx) => {
        const ganancia = Number(tx.montoCobrado || 0) - Number(tx.montoRecarga || 0);
        dayTotalBs += ganancia;

        const plat = (tx.plataforma || 'payall').toLowerCase();
        if (plat === 'pagodirecto') {
          dayPagoDirecto += ganancia;
        } else {
          dayPayall += ganancia;
        }
      });

      grandTotalBs += dayTotalBs;
      grandTotalPayall += dayPayall;
      grandTotalPagoDirecto += dayPagoDirecto;
      grandTotalRecargas += txs.length;

      return {
        ...day,
        totalGanancia: dayTotalBs,
        totalPayall: dayPayall,
        totalPagoDirecto: dayPagoDirecto,
        count: txs.length
      };
    });

    const grandTotalUsd = tasaBcv > 0 ? grandTotalBs / tasaBcv : 0;

    return {
      rows,
      grandTotalBs,
      grandTotalPayall,
      grandTotalPagoDirecto,
      grandTotalUsd,
      grandTotalRecargas
    };
  }, [daysOfWeek, allTransactions, tasaBcv]);

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
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              {pendingWeeklyTxs.length > 0 ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Clientes con Recargas Fiadas Pendientes esta Semana
                </h3>
                {pendingWeeklyTxs.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                    {pendingWeeklyTxs.length} Pendiente{pendingWeeklyTxs.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pendingWeeklyTxs.length > 0
                  ? 'Recuerda cobrar a estos clientes fijos para cerrar la semana con caja completa.'
                  : '✓ ¡Semana al día! No tienes recargas pendientes por cobrar a clientes.'}
              </p>
            </div>
          </div>

          {pendingWeeklyTxs.length > 0 && (
            <div className="text-left sm:text-right font-mono bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
              <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Total por Cobrar
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {formatBs(totalPendienteSemanaBs)}
              </span>
              {tasaBcv > 0 && (
                <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  ≈ {formatUsd(totalPendienteSemanaBs / tasaBcv)}
                </span>
              )}
            </div>
          )}
        </div>

        {pendingWeeklyTxs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-amber-300/50 dark:border-amber-700/50 mt-4">
            <table className="w-full text-left text-xs font-sans">
              <thead className={`text-[11px] uppercase font-bold border-b ${
                isLight ? 'bg-amber-100/70 text-slate-800 border-amber-200' : 'bg-amber-950/40 text-amber-200 border-amber-900/50'
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
                isLight ? 'divide-amber-200/50 bg-white' : 'divide-amber-900/40 bg-[#0f172a]'
              }`}>
                {pendingWeeklyTxs.map((tx) => {
                  const dayObj = daysOfWeek.find((d) => d.fechaIso === tx.fecha);
                  return (
                    <tr key={tx.id} className="transition hover:bg-amber-500/10">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{tx.clienteNombre || 'Cliente habitual'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-xs text-slate-600 dark:text-slate-300">
                        {dayObj ? `${dayObj.nombre} (${tx.fecha})` : tx.fecha} • {tx.hora}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                        {tx.operadoraNombre}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {tx.telefono || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                        {formatBs(tx.montoCobrado)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPayPendingTx(tx);
                            setPayPendingMethod(tx.metodo === 'mixto' ? 'efectivo' : (tx.metodo || 'efectivo'));
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                          title="Cobrar ahora y pasar a pagado (verde)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cobrar (Verde)</span>
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
        {/* Cabecera espiritual de bendición */}
        <div className={`px-5 py-3 border-b flex items-center justify-between ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            DIOS ES NUESTRO PROVEEDOR
          </span>
          <span className={`text-xs font-semibold font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {weekData.grandTotalRecargas} Recargas esta semana
          </span>
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
                <th className="py-3 px-5 text-right">Equiv. $ BCV</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${
              isLight ? 'divide-slate-100' : 'divide-slate-800'
            }`}>
              {weekData.rows.map((row) => {
                const usd = tasaBcv > 0 ? row.totalGanancia / tasaBcv : 0;
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
                      {row.nombre}
                    </td>
                    <td className={`py-3 px-6 text-right font-black ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {row.totalGanancia > 0 ? formatBs(row.totalGanancia) : '-'}
                    </td>
                    <td className="py-3 px-6 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {row.totalPayall > 0 ? formatBs(row.totalPayall) : '-'}
                    </td>
                    <td className="py-3 px-6 text-right text-blue-600 dark:text-blue-400 font-bold">
                      {row.totalPagoDirecto > 0 ? formatBs(row.totalPagoDirecto) : '-'}
                    </td>
                    <td className="py-3 px-6 text-right text-amber-700 dark:text-amber-300 font-bold">
                      {row.totalGanancia > 0 ? formatUsd(usd) : '-'}
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
              <tr className="bg-amber-500/10 border-b border-amber-500/20">
                <td className="py-3.5 px-6 font-sans font-black text-amber-700 dark:text-amber-300 uppercase text-xs">
                  TOTAL GANANCIA SEMANAL
                </td>
                <td className="py-3.5 px-6 text-right font-black text-xl text-amber-700 dark:text-amber-300">
                  {formatBs(weekData.grandTotalBs)}
                </td>
                <td className="py-3.5 px-6 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBs(weekData.grandTotalPayall)}
                </td>
                <td className="py-3.5 px-6 text-right font-bold text-blue-600 dark:text-blue-400">
                  {formatBs(weekData.grandTotalPagoDirecto)}
                </td>
                <td className="py-3.5 px-6 text-right text-amber-700 dark:text-amber-300 font-bold">
                  {formatUsd(weekData.grandTotalUsd)}
                </td>
              </tr>

              <tr className="bg-orange-500/10 border-b border-orange-500/20">
                <td className="py-3 px-6 font-sans font-bold text-orange-600 dark:text-orange-300 uppercase text-xs">
                  TOTAL DE LA SEMANA ($ BCV)
                </td>
                <td
                  colSpan={4}
                  className="py-3 px-6 text-right font-black text-xl text-orange-600 dark:text-orange-300"
                >
                  {formatUsd(weekData.grandTotalUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Rápido para Cobrar Recarga Fiada en Vista Semanal */}
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
                    Cobrar Recarga Fiada (Cierre Semanal)
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Pasar a Pagado y liquidar saldo de cliente
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
              {/* Resumen del cliente y monto */}
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
                <div className={`pt-2 mt-2 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <span className={`font-bold text-xs uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Monto a Cobrar
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                    {formatBs(payPendingTx.montoCobrado)}
                  </span>
                </div>
              </div>

              {/* Selección del método con el que está pagando hoy */}
              <div>
                <label className={`block font-bold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  ¿Cómo paga el cliente al saldar la deuda?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'efectivo', nombre: 'Efectivo', color: 'emerald' },
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
                    onToggleEstadoPago?.(payPendingTx.id, payPendingMethod);
                    setPayPendingTx(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Cobro (Pasar a Verde)</span>
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
