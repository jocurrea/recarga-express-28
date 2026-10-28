'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  CheckCircle2,
  Clock,
  User,
  Ticket,
  DollarSign,
  ArrowRight,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/calculator';
import ReportPdfModal from '@/components/ReportPdfModal';

export default function AlquilerPuntoView({
  alquilerRecords = [],
  onAddRecord,
  onAddAlquiler,
  onUpdateRecord,
  onUpdateAlquiler,
  onDeleteRecord,
  onDeleteAlquiler,
  onToggleTransferido,
  selectedDate,
  tasaBcv = 0,
  puntoRecargasBs = 0,
  totalPuntoRecargas = 0,
  config = {},
  theme = 'dark',
  onOpenPdfModal,
  transactions = []
}) {
  const isLight = theme === 'light';
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Formulario nuevo comerciante
  const [nombre, setNombre] = useState('');
  const [tickets, setTickets] = useState('1');
  const [montoTotal, setMontoTotal] = useState('');
  const [error, setError] = useState('');

  // Estado para modal de edición
  const [editingItem, setEditingItem] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTickets, setEditTickets] = useState('1');
  const [editMonto, setEditMonto] = useState('');
  const [editComisionPct, setEditComisionPct] = useState('10');
  const [editTransferido, setEditTransferido] = useState(false);
  const [editError, setEditError] = useState('');

  const addHandler = onAddAlquiler || onAddRecord;
  const deleteHandler = onDeleteAlquiler || onDeleteRecord;
  const updateHandler = onUpdateAlquiler || onUpdateRecord;
  const puntoRecargas = totalPuntoRecargas || puntoRecargasBs;

  // Manejador para abrir modal de edición
  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditNombre(item.nombre || '');
    setEditTickets(String(item.tickets || 1));
    setEditMonto(String(item.montoTotal || ''));
    setEditComisionPct(String(item.comisionPorcentaje ?? 10));
    setEditTransferido(Boolean(item.transferido));
    setEditError('');
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editNombre.trim()) {
      setEditError('Ingresa el nombre del comerciante o negocio');
      return;
    }
    const numMonto = parseFloat(String(editMonto).replace(',', '.'));
    if (!numMonto || numMonto <= 0) {
      setEditError('Ingresa un monto válido mayor a cero');
      return;
    }
    const numTickets = parseInt(editTickets, 10) || 1;
    const numComision = parseFloat(String(editComisionPct).replace(',', '.')) || 10;

    if (updateHandler && editingItem) {
      updateHandler(editingItem.id, {
        nombre: editNombre.trim(),
        tickets: numTickets,
        montoTotal: numMonto,
        comisionPorcentaje: numComision,
        transferido: editTransferido
      });
    }

    setEditingItem(null);
  };

  // Comisión configurada (por defecto 10%)
  const comisionPct = 10;

  // Cálculo en vivo
  const montoNum = parseFloat(montoTotal.replace(',', '.')) || 0;
  const gananciaPreview = montoNum * (comisionPct / 100);
  const aPagarPreview = montoNum - gananciaPreview;

  // Totales del día
  const totalPasado = alquilerRecords.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0);
  const totalGanancia = alquilerRecords.reduce((acc, r) => acc + Number(r.comisionBs || 0), 0);
  const totalAPagar = alquilerRecords.reduce((acc, r) => acc + Number(r.montoPagar || 0), 0);
  const totalTickets = alquilerRecords.reduce((acc, r) => acc + Number(r.tickets || 1), 0);
  const totalPendientes = alquilerRecords.filter((r) => !r.transferido).length;

  // Lote consolidado del punto (Recargas propias + Pasado por vecinos)
  const totalLotePunto = puntoRecargas + totalPasado;
  const retencionBanco075 = totalLotePunto * 0.0075;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresa el nombre del comerciante o negocio');
      return;
    }
    if (!montoNum || montoNum <= 0) {
      setError('Ingresa el monto total pasado en el punto');
      return;
    }

    if (addHandler) {
      addHandler({
        fecha: selectedDate,
        nombre: nombre.trim(),
        tickets: parseInt(tickets, 10) || 1,
        montoTotal: montoNum,
        comisionPorcentaje: comisionPct
      });
    }

    setNombre('');
    setTickets('1');
    setMontoTotal('');
    setError('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* TARJETA INFORMATIVA PRINCIPAL */}
      <div className={`p-5 rounded-2xl border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-black tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  Alquiler de Punto POS a Terceros (10%)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Comisión 10%
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Registra los tickets externos pasados por comerciantes vecinos. El dinero se entrega al día siguiente.
              </p>
            </div>
          </div>

          <button
            id="alquiler-pdf-report-btn"
            onClick={() => (onOpenPdfModal ? onOpenPdfModal() : setShowPdfModal(true))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Ver Reporte PDF de Cierre</span>
          </button>
        </div>

        {/* 4 CARJAS DE ARQUEO DE ALQUILER Y CIERRE DE LOTE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tu Ganancia por Alquiler (10%) */}
          <div className={`p-4 rounded-xl border relative overflow-hidden ${
            isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/50'
          }`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
              Tu Ganancia 10% (Limpia)
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              +{formatBs(totalGanancia)}
            </div>
            <span className="text-[11px] font-bold font-mono text-emerald-800 dark:text-emerald-300 block mt-1">
              ≈ {formatUsd(tasaBcv > 0 ? totalGanancia / tasaBcv : 0)} USD
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Tu comisión retenida en el bolsillo
            </span>
          </div>

          {/* Total a Transferir Mañana (90%) */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              A Transferir Mañana (90%)
            </span>
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatBs(totalAPagar)}
            </div>
            <span className={`text-[11px] font-mono block mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              ≈ {formatUsd(tasaBcv > 0 ? totalAPagar / tasaBcv : 0)} USD
            </span>
            <span className={`text-[11px] block mt-1 font-bold flex items-center gap-1 ${
              isLight ? 'text-amber-900 font-extrabold' : 'text-amber-300'
            }`}>
              <Clock className="w-3.5 h-3.5 inline text-amber-600 shrink-0" /> {totalPendientes} pagos por transferir mañana
            </span>
          </div>

          {/* Total Pasado por Comerciantes */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Total Pasado por Vecinos
            </span>
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatBs(totalPasado)}
            </div>
            <span className={`text-[11px] font-mono block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {totalTickets} tickets • {alquilerRecords.length} comercios
            </span>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Suma de papelitos de afuera
            </span>
          </div>

          {/* Cierre Lote General de la Máquina */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Lote General del Punto
            </span>
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
              {formatBs(totalLotePunto)}
            </div>
            <span className="text-[11px] font-mono block mt-1 text-rose-600 font-bold">
              Banco 0.75%: -{formatBs(retencionBanco075)}
            </span>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Recargas ({formatBs(puntoRecargasBs)}) + Vecinos
            </span>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE REGISTRO RÁPIDO */}
      <div className={`p-5 rounded-2xl border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
          isLight ? 'text-slate-700' : 'text-slate-300'
        }`}>
          Registrar Tickets de Comerciante
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nombre del comerciante */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Nombre del Comerciante / Negocio:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-comerciante-nombre"
                  type="text"
                  placeholder="Ej: Juan, Carnicería María, etc."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Cantidad de Tickets */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                N° de Tickets Pasados:
              </label>
              <div className="relative">
                <Ticket className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-comerciante-tickets"
                  type="number"
                  min="1"
                  step="1"
                  value={tickets}
                  onChange={(e) => setTickets(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Monto Total Pasado */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Monto Total en el Punto (Bs.):
              </label>
              <div className="relative">
                <input
                  id="input-comerciante-monto"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 2000"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  Bs.
                </span>
              </div>
            </div>
          </div>

          {/* PREVIEW EN VIVO DEL CÁLCULO */}
          {montoNum > 0 && (
            <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Comerciante: <strong>{nombre || 'Vecino'}</strong></span>
                <span>•</span>
                <span className="text-slate-500">{tickets || 1} tickets</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 font-mono">
                <div>
                  <span className="text-slate-500 text-[11px] block">Tu Ganancia (10%):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    +{formatBs(gananciaPreview)}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 text-[11px] block">A transferir mañana (90%):</span>
                  <span className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatBs(aPagarPreview)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-500 font-semibold">{error}</p>
          )}

          <div className="flex justify-end">
            <button
              id="submit-comerciante-btn"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Tickets de Comerciante</span>
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE COMERCIANTES REGISTRADOS */}
      <div className={`rounded-2xl border overflow-hidden transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Comerciantes del Día ({alquilerRecords.length})
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Desglose de montos pasados, comisión retenida y estado de transferencia
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            Ganancia total: +{formatBs(totalGanancia)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b uppercase font-bold text-[10px] tracking-wider ${
              isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}>
              <tr>
                <th className="py-3 px-4 font-sans">Hora</th>
                <th className="py-3 px-4 font-sans">Comerciante / Negocio</th>
                <th className="py-3 px-4 text-center font-sans">Tickets</th>
                <th className="py-3 px-4 text-right">Monto Pasado</th>
                <th className="py-3 px-4 text-right">Tu Ganancia (10%)</th>
                <th className="py-3 px-4 text-right">A Transferir Mañana (90%)</th>
                <th className="py-3 px-4 text-center font-sans">Estado de Entrega</th>
                <th className="py-3 px-3 text-center font-sans">Acción</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
              {alquilerRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center font-sans">
                    <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      No hay alquileres de punto registrados en esta fecha.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Usa el formulario de arriba para ingresar los tickets de Juan, María u otros comerciantes.
                    </p>
                  </td>
                </tr>
              ) : (
                alquilerRecords.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.hora || '-'}
                    </td>
                    <td className={`py-3 px-4 font-sans font-bold text-sm ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {item.nombre}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                        isLight
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-orange-950/80 text-orange-200 border-orange-700'
                      }`}>
                        {item.tickets} {item.tickets === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatBs(item.montoTotal)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}>
                      +{formatBs(item.comisionBs)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      <span className={item.transferido ? 'line-through opacity-50' : ''}>
                        {formatBs(item.montoPagar)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => onToggleTransferido(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs ${
                          item.transferido
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                        title="Clic para cambiar estado de transferencia"
                      >
                        {item.transferido ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>Transferido</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>Por transferir mañana</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 transition cursor-pointer"
                          title="Editar comerciante y monto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteHandler && deleteHandler(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* FILA DE TOTALES */}
            {alquilerRecords.length > 0 && (
              <tfoot className={`border-t-2 font-bold ${
                isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <tr>
                  <td colSpan={2} className="py-3 px-4 font-sans uppercase text-xs">
                    TOTALES ({alquilerRecords.length} comercios)
                  </td>
                  <td className="py-3 px-4 text-center font-black">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      isLight
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}>
                      {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black">
                    {formatBs(totalPasado)}
                  </td>
                  <td className={`py-3 px-4 text-right font-black text-sm ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    +{formatBs(totalGanancia)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-sm">
                    {formatBs(totalAPagar)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL REPORTE PDF DE CIERRE CON ALQUILER DE PUNTO */}
      {showPdfModal && (
        <ReportPdfModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          transactions={transactions}
          alquilerRecords={alquilerRecords}
          selectedDate={selectedDate}
          tasaBcv={tasaBcv}
          config={config}
          theme={theme}
        />
      )}

      {/* MODAL DE EDICIÓN DE COMERCIANTE / ALQUILER DE PUNTO */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            {/* Header del modal */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Editar Comerciante / Registro</h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Modifica los datos del ticket pasado en el punto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario de edición */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Nombre Comerciante */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Comerciante / Negocio
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej: Brayan, Josue, Ramon..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                  autoFocus
                />
              </div>

              {/* Grid Tickets y Comisión */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Tickets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={editTickets}
                    onChange={(e) => setEditTickets(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editComisionPct}
                    onChange={(e) => setEditComisionPct(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Monto Pasado */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Monto Pasado en Punto (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editMonto}
                  onChange={(e) => setEditMonto(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-black font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Vista previa en vivo del cálculo */}
              {(() => {
                const monto = parseFloat(String(editMonto).replace(',', '.')) || 0;
                const pct = parseFloat(String(editComisionPct).replace(',', '.')) || 10;
                const ganancia = monto * (pct / 100);
                const aPagar = monto - ganancia;
                return (
                  <div className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
                    isLight ? 'bg-orange-50/60 border-orange-200 text-slate-800' : 'bg-orange-950/20 border-orange-900/60 text-slate-200'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-sans font-medium text-slate-500">Tu ganancia ({pct}%):</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatBs(ganancia)}</span>
                    </div>
                    <div className="flex justify-between border-t border-orange-200/50 dark:border-orange-800/40 pt-1">
                      <span className="font-sans font-medium text-slate-500">A transferir ({100 - pct}%):</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatBs(aPagar)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Estado de entrega toggle */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Estado de Entrega
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTransferido(false)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      !editTransferido
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Por transferir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTransferido(true)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editTransferido
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Transferido</span>
                  </button>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isLight
                      ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
