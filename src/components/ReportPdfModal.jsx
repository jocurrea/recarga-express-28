'use client';

import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/calculator';

export default function ReportPdfModal({
  isOpen,
  onClose,
  type = 'diario', // 'diario' | 'semanal'
  selectedDate = '',
  transactions = [],
  totals = {},
  weekData = null,
  daysOfWeek = [],
  tasaBcv = 0,
  alquilerRecords = [],
  pendingWeeklyTxs = [],
  totalPendienteSemanaBs = 0,
  theme = 'dark'
}) {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const now = new Date();
  const printTimestamp = now.toLocaleDateString('es-VE') + ' ' + now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

  // Cálculos de alquiler de punto a terceros (10%)
  const totalAlquilerPasado = (alquilerRecords || []).reduce((acc, r) => acc + Number(r.montoTotal || 0), 0);
  const totalAlquilerGanancia = (alquilerRecords || []).reduce((acc, r) => acc + Number(r.comisionBs || 0), 0);
  const totalAlquilerPagar = (alquilerRecords || []).reduce((acc, r) => acc + Number(r.montoPagar || 0), 0);
  const totalAlquilerTickets = (alquilerRecords || []).reduce((acc, r) => acc + Number(r.tickets || 1), 0);

  // Cálculos de saldo vendido y cobrado por plataforma (Payall vs PagoDirecto)
  const payallTxs = (transactions || []).filter(t => (t.plataforma || 'payall').toLowerCase() !== 'pagodirecto');
  const pagodirectoTxs = (transactions || []).filter(t => (t.plataforma || 'payall').toLowerCase() === 'pagodirecto');

  const payallSaldoVendido = payallTxs.reduce((acc, t) => acc + Number(t.montoRecarga || 0), 0);
  const payallCobrado = payallTxs.reduce((acc, t) => acc + Number(t.montoCobrado || 0), 0);
  const payallGanancia = payallCobrado - payallSaldoVendido;

  const pagodirectoSaldoVendido = pagodirectoTxs.reduce((acc, t) => acc + Number(t.montoRecarga || 0), 0);
  const pagodirectoCobrado = pagodirectoTxs.reduce((acc, t) => acc + Number(t.montoCobrado || 0), 0);
  const pagodirectoGanancia = pagodirectoCobrado - pagodirectoSaldoVendido;

  // Cálculos consolidados para el reporte diario
  const lotePuntoTotal = Number(totals.punto || 0) + totalAlquilerPasado;
  const comisionPuntoBs = lotePuntoTotal * 0.0075; // 0.75% del banco sobre el lote total
  const comisionBiopagoBs = Number(totals.biopago || 0) * 0.02;
  const totalDeducciones = comisionPuntoBs + comisionBiopagoBs;

  const gananciaBrutaTotal = Number(totals.ganancia || 0) + totalAlquilerGanancia;
  const gananciaNeta = gananciaBrutaTotal - totalDeducciones;
  const gananciaNetaUsd = tasaBcv > 0 ? gananciaNeta / tasaBcv : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 no-print">
      <div className={`w-full max-w-4xl max-h-[95vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        {/* Header no imprimible */}
        <div className={`p-4 border-b flex items-center justify-between no-print ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Reporte PDF / Cierre de Operaciones
              </h2>
              <p className="text-xs text-slate-500">
                {type === 'semanal' ? 'Consolidado semanal de comisiones' : `Cierre diario del ${selectedDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="confirm-print-pdf-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ÁREA IMPRIMIBLE (Se imprime exactamente esto en el PDF) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900">
          <div id="printable-report-area" className="space-y-6 max-w-3xl mx-auto bg-white text-slate-900">
            {/* Encabezado del Negocio */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                  Recarga Express 28
                </h1>
                <p className="text-xs text-slate-600 font-semibold tracking-wide uppercase">
                  {type === 'semanal' ? 'Reporte Financiero Semanal' : 'Reporte de Cierre y Arqueo Diario'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fecha de Cierre: <strong className="text-slate-800">{selectedDate || 'Semana'}</strong> • Emisión: {printTimestamp}
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">Tasa Oficial BCV</span>
                <span className="text-base font-black text-slate-900">{formatBs(tasaBcv)}</span>
              </div>
            </div>

            {/* RESUMEN DE CAJA (KPIs) PARA REPORTE DIARIO */}
            {type === 'diario' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Recargas Propias</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{transactions.length} ops</span>
                    <span className="text-[10px] text-slate-500 block font-sans">Cobrado: {formatBs(totals.montoCobrado)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Efectivo en Caja</span>
                    <span className="text-lg font-black text-slate-900">{formatBs(totals.efectivo)}</span>
                    <span className="text-[10px] text-emerald-700 block font-sans font-bold">Gaveta física</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Lote Punto General</span>
                    <span className="text-lg font-black text-slate-900">{formatBs(lotePuntoTotal)}</span>
                    <span className="text-[10px] text-rose-600 block font-sans">Banco 0.75%: -{formatBs(comisionPuntoBs)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Alquiler Punto (10%)</span>
                    <span className="text-lg font-black text-emerald-700">+{formatBs(totalAlquilerGanancia)}</span>
                    <span className="text-[10px] text-slate-600 block font-sans">Pagar mañana: {formatBs(totalAlquilerPagar)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border-2 border-emerald-500 bg-emerald-50 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-emerald-900 block uppercase font-black font-sans">Ganancia Neta Real</span>
                    <span className="text-lg font-black text-emerald-700">+{formatBs(gananciaNeta)}</span>
                    <span className="text-[10px] text-emerald-800 block font-bold font-mono">≈ {formatUsd(gananciaNetaUsd)} USD</span>
                  </div>
                </div>

                {/* DESGLOSE POR APLICACIÓN: SALDO VENDIDO PAYALL VS PAGODIRECTO */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 uppercase font-black font-sans block">
                        Payall ({payallTxs.length} {payallTxs.length === 1 ? 'recarga' : 'recargas'})
                      </span>
                      <span className="text-xs font-black text-slate-900 block">
                        Saldo Vendido: {formatBs(payallSaldoVendido)}
                      </span>
                      <span className="text-[10px] text-slate-600 font-sans block">
                        Cobrado: {formatBs(payallCobrado)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-sans block">Ganancia</span>
                      <span className="text-sm font-black text-emerald-700">+{formatBs(payallGanancia)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-800 uppercase font-black font-sans block">
                        PagoDirecto ({pagodirectoTxs.length} {pagodirectoTxs.length === 1 ? 'recarga' : 'recargas'})
                      </span>
                      <span className="text-xs font-black text-slate-900 block">
                        Saldo Vendido: {formatBs(pagodirectoSaldoVendido)}
                      </span>
                      <span className="text-[10px] text-slate-600 font-sans block">
                        Cobrado: {formatBs(pagodirectoCobrado)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-sans block">Ganancia</span>
                      <span className="text-sm font-black text-blue-700">+{formatBs(pagodirectoGanancia)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* RESUMEN SEMANAL */}
            {type === 'semanal' && weekData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Total Recargas</span>
                  <span className="text-xl font-black text-slate-900">{weekData.grandTotalRecargas}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Ganancia Payall</span>
                  <span className="text-xl font-black text-slate-900">+{formatBs(weekData.grandTotalPayall)}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold font-sans">Ganancia PagoDirecto</span>
                  <span className="text-xl font-black text-slate-900">+{formatBs(weekData.grandTotalPagoDirecto)}</span>
                </div>
                <div className="p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50">
                  <span className="text-[10px] text-emerald-900 block uppercase font-black font-sans">Total Semanal</span>
                  <span className="text-xl font-black text-emerald-700">+{formatBs(weekData.grandTotalBs)}</span>
                  <span className="text-[10px] text-emerald-800 block font-bold font-mono">≈ {formatUsd(weekData.grandTotalUsd)}</span>
                </div>
              </div>
            )}

            {/* TABLA DE DETALLE DIARIO */}
            {type === 'diario' && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 font-sans">
                  Detalle de Transacciones Registradas ({transactions.length})
                </h3>

                <table className="w-full text-left text-[11px] font-mono border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2">Hora</th>
                      <th className="py-2 px-2">Operadora</th>
                      <th className="py-2 px-2">Origen</th>
                      <th className="py-2 px-2">Cliente / Teléfono</th>
                      <th className="py-2 px-2 text-right">Recarga</th>
                      <th className="py-2 px-2 text-right">Cobrado</th>
                      <th className="py-2 px-2 text-center">Estado</th>
                      <th className="py-2 px-2">Método</th>
                      <th className="py-2 px-2 text-right">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((tx, idx) => {
                      const gan = Number(tx.montoCobrado || 0) - Number(tx.montoRecarga || 0);
                      const plat = (tx.plataforma || 'payall').toLowerCase() === 'pagodirecto' ? 'PagoDirecto' : 'Payall';
                      const isPendiente = tx.estadoPago === 'pendiente';
                      return (
                        <tr key={tx.id || idx} className={isPendiente ? 'bg-amber-50/80' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-1.5 px-2">{tx.hora || '-'}</td>
                          <td className="py-1.5 px-2 font-bold text-slate-900 font-sans">{tx.operadoraNombre}</td>
                          <td className="py-1.5 px-2 font-sans text-[10px]">{plat}</td>
                          <td className="py-1.5 px-2 font-sans">
                            {tx.clienteNombre ? (
                              <div>
                                <span className="font-bold text-slate-900 block">{tx.clienteNombre}</span>
                                <span className="text-[10px] text-slate-500 font-mono block">{tx.telefono || '-'}</span>
                              </div>
                            ) : (
                              <span>{tx.telefono || '-'}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right">{formatBs(tx.montoRecarga)}</td>
                          <td className="py-1.5 px-2 text-right font-bold">{formatBs(tx.montoCobrado)}</td>
                          <td className="py-1.5 px-2 text-center font-sans text-[9px] font-bold">
                            {isPendiente ? (
                              <span className="text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                ⏳ FIADO
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">
                                ✓ PAGADO
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-[10px] font-sans">
                            {tx.metodo === 'mixto' ? (
                              <span className="text-purple-800 font-bold">
                                MIXTO ({formatBs(tx.montoEfectivo)} Efec / {formatBs(tx.montoPunto > 0 ? tx.montoPunto : tx.montoBiopago)} {tx.montoPunto > 0 ? 'Punto' : 'Bio'})
                              </span>
                            ) : (
                              <span className="uppercase">{tx.metodo}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-700">+{formatBs(gan)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-800 bg-slate-100 font-bold">
                    <tr>
                      <td colSpan={4} className="py-2 px-2 uppercase font-sans text-[10px]">TOTALES</td>
                      <td className="py-2 px-2 text-right">{formatBs(totals.montoRecarga)}</td>
                      <td className="py-2 px-2 text-right text-slate-950 font-black">{formatBs(totals.montoCobrado)}</td>
                      <td></td>
                      <td></td>
                      <td className="py-2 px-2 text-right text-emerald-800 font-black">+{formatBs(totals.ganancia)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* SECCIÓN ALQUILER DE PUNTO DE VENTA A TERCEROS (10%) */}
            {type === 'diario' && alquilerRecords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                    Alquiler de Punto POS a Terceros (Comisión 10%)
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-800">
                    Tu Ganancia: +{formatBs(totalAlquilerGanancia)}
                  </span>
                </div>

                <table className="w-full text-left text-[11px] font-mono border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2">Comerciante / Negocio</th>
                      <th className="py-2 px-2 text-center">N° Tickets</th>
                      <th className="py-2 px-2 text-right">Total Pasado en Punto</th>
                      <th className="py-2 px-2 text-right">Tu Comisión (10%)</th>
                      <th className="py-2 px-2 text-right">A Transferir Mañana (90%)</th>
                      <th className="py-2 px-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {alquilerRecords.map((r, idx) => (
                      <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-1.5 px-2 font-bold font-sans text-slate-900">{r.nombre}</td>
                        <td className="py-1.5 px-2 text-center font-bold">{r.tickets}</td>
                        <td className="py-1.5 px-2 text-right font-black">{formatBs(r.montoTotal)}</td>
                        <td className="py-1.5 px-2 text-right font-bold text-emerald-700">+{formatBs(r.comisionBs)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">{formatBs(r.montoPagar)}</td>
                        <td className="py-1.5 px-2 text-center font-sans text-[10px]">
                          {r.transferido ? '✅ Transferido' : '⏳ Por transferir mañana'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-800 bg-slate-100 font-bold">
                    <tr>
                      <td className="py-2 px-2 uppercase font-sans text-[10px]">TOTALES EXTERNOS</td>
                      <td className="py-2 px-2 text-center font-black">{totalAlquilerTickets} tickets</td>
                      <td className="py-2 px-2 text-right text-slate-950 font-black">{formatBs(totalAlquilerPasado)}</td>
                      <td className="py-2 px-2 text-right text-emerald-800 font-black">+{formatBs(totalAlquilerGanancia)}</td>
                      <td className="py-2 px-2 text-right font-black">{formatBs(totalAlquilerPagar)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TABLA SEMANAL */}
            {type === 'semanal' && weekData && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 font-sans">
                  Desglose de Ganancias por Día de la Semana
                </h3>
                <table className="w-full text-left text-xs font-mono border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2">Día</th>
                      <th className="py-2 px-2">Fecha</th>
                      <th className="py-2 px-2 text-center">Recargas</th>
                      <th className="py-2 px-2 text-right">Payall</th>
                      <th className="py-2 px-2 text-right">PagoDirecto</th>
                      <th className="py-2 px-2 text-right">Ganancia Recargas (Bs)</th>
                      <th className="py-2 px-2 text-right">Equiv. $ BCV (Neta Real)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {weekData.rows.map((r, idx) => {
                      const usd = r.gananciaNetaUsd ?? (tasaBcv > 0 ? r.totalGanancia / tasaBcv : 0);
                      return (
                        <tr key={r.fechaIso} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-2 px-2 font-bold font-sans">{r.nombre}</td>
                          <td className="py-2 px-2">{r.fechaIso}</td>
                          <td className="py-2 px-2 text-center font-bold">{r.count}</td>
                          <td className="py-2 px-2 text-right">{formatBs(r.totalPayall)}</td>
                          <td className="py-2 px-2 text-right">{formatBs(r.totalPagoDirecto)}</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-700">+{formatBs(r.totalGanancia)}</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-800">
                            {r.hasActivity ? formatUsd(usd) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-800 bg-slate-100 font-bold">
                    <tr>
                      <td colSpan={2} className="py-2 px-2 uppercase font-sans text-xs">TOTAL SEMANAL</td>
                      <td className="py-2 px-2 text-center font-black">{weekData.grandTotalRecargas}</td>
                      <td className="py-2 px-2 text-right">{formatBs(weekData.grandTotalPayall)}</td>
                      <td className="py-2 px-2 text-right">{formatBs(weekData.grandTotalPagoDirecto)}</td>
                      <td className="py-2 px-2 text-right text-emerald-800 font-black">+{formatBs(weekData.grandTotalBs)}</td>
                      <td className="py-2 px-2 text-right text-emerald-900 font-black">
                        {formatUsd(weekData.grandTotalNetaUsd ?? weekData.grandTotalUsd)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* SECCIÓN SEMANAL DE CLIENTES CON CUENTAS PENDIENTES */}
            {type === 'semanal' && pendingWeeklyTxs && pendingWeeklyTxs.length > 0 && (
              <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-300">
                <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-sans flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Recargas Fiadas Pendientes por Cobrar ({pendingWeeklyTxs.length})</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    Total Deuda: {formatBs(totalPendienteSemanaBs)}
                  </span>
                </div>
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="text-[10px] uppercase font-bold text-amber-900 border-b border-amber-200">
                    <tr>
                      <th className="py-1">Cliente Fiador</th>
                      <th className="py-1">Fecha</th>
                      <th className="py-1">Operadora / Contrato</th>
                      <th className="py-1 text-right">Monto a Cobrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200">
                    {pendingWeeklyTxs.map((t) => (
                      <tr key={t.id}>
                        <td className="py-1 font-bold text-slate-900 font-sans">{t.clienteNombre || 'Cliente habitual'}</td>
                        <td className="py-1 text-slate-700">{t.fecha} {t.hora}</td>
                        <td className="py-1 text-slate-700">{t.operadoraNombre} ({t.telefono || '-'})</td>
                        <td className="py-1 text-right font-black text-amber-900">{formatBs(t.montoCobrado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECCIÓN DE FIRMAS DE CIERRE DE CAJA */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs font-sans text-center">
              <div>
                <div className="border-b border-slate-400 pb-8 mb-2"></div>
                <span className="font-bold uppercase text-[11px] text-slate-800 block">Firma del Cajero / Operador</span>
                <span className="text-[10px] text-slate-500">Recarga Express 28</span>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-8 mb-2"></div>
                <span className="font-bold uppercase text-[11px] text-slate-800 block">Conforme Auditoría / Gerencia</span>
                <span className="text-[10px] text-slate-500">Arqueo Verificado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
