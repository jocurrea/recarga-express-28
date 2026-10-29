'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Fingerprint,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  CheckCircle2,
  Clock,
  User,
  Ticket,
  ArrowRight,
  FileText,
  BadgeAlert,
  AlertTriangle,
  Layers
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
  totalBiopagoRecargas = 0,
  config = {},
  theme = 'dark',
  onOpenPdfModal,
  transactions = []
}) {
  const isLight = theme === 'light';
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Filtro de visualización: 'todos' | 'punto' | 'biopago'
  const [filterTipo, setFilterTipo] = useState('todos');

  // Formulario nuevo comerciante
  const [tipo, setTipo] = useState('biopago'); // 'punto' | 'biopago' (por defecto biopago o punto)
  const [nombre, setNombre] = useState('');
  const [tickets, setTickets] = useState('1');
  const [montoTotal, setMontoTotal] = useState('');
  const [error, setError] = useState('');

  // Estado para modal de edición
  const [editingItem, setEditingItem] = useState(null);
  const [editTipo, setEditTipo] = useState('punto');
  const [editNombre, setEditNombre] = useState('');
  const [editTickets, setEditTickets] = useState('1');
  const [editMonto, setEditMonto] = useState('');
  const [editComisionPct, setEditComisionPct] = useState('10');
  const [editTransferido, setEditTransferido] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingRecord, setDeletingRecord] = useState(null);

  const addHandler = onAddAlquiler || onAddRecord;
  const deleteHandler = onDeleteAlquiler || onDeleteRecord;
  const updateHandler = onUpdateAlquiler || onUpdateRecord;

  const puntoRecargas = totalPuntoRecargas || puntoRecargasBs || 0;
  const biopagoRecargas = totalBiopagoRecargas || 0;

  // Manejador para abrir modal de edición
  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditTipo(item.tipo === 'biopago' ? 'biopago' : 'punto');
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
        tipo: editTipo,
        nombre: editNombre.trim(),
        tickets: numTickets,
        montoTotal: numMonto,
        comisionPorcentaje: numComision,
        transferido: editTransferido
      });
    }

    setEditingItem(null);
  };

  // Comisión configurada (10%)
  const comisionPct = 10;

  // Cálculo en vivo del formulario
  const montoNum = parseFloat(montoTotal.replace(',', '.')) || 0;
  const gananciaPreview = montoNum * (comisionPct / 100);
  const aPagarPreview = montoNum - gananciaPreview;

  // Desglose por tipo de alquiler
  const recordsPunto = alquilerRecords.filter((r) => r.tipo !== 'biopago');
  const recordsBiopago = alquilerRecords.filter((r) => r.tipo === 'biopago');

  const puntoPasado = recordsPunto.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0);
  const puntoGanancia = recordsPunto.reduce((acc, r) => acc + Number(r.comisionBs || 0), 0);
  const puntoAPagar = recordsPunto.reduce((acc, r) => acc + Number(r.montoPagar || 0), 0);
  const puntoTickets = recordsPunto.reduce((acc, r) => acc + Number(r.tickets || 1), 0);

  const biopagoPasado = recordsBiopago.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0);
  const biopagoGanancia = recordsBiopago.reduce((acc, r) => acc + Number(r.comisionBs || 0), 0);
  const biopagoAPagar = recordsBiopago.reduce((acc, r) => acc + Number(r.montoPagar || 0), 0);
  const biopagoTickets = recordsBiopago.reduce((acc, r) => acc + Number(r.tickets || 1), 0);

  // Totales consolidados del día
  const totalPasado = alquilerRecords.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0);
  const totalGanancia = alquilerRecords.reduce((acc, r) => acc + Number(r.comisionBs || 0), 0);
  const totalAPagar = alquilerRecords.reduce((acc, r) => acc + Number(r.montoPagar || 0), 0);
  const totalTickets = alquilerRecords.reduce((acc, r) => acc + Number(r.tickets || 1), 0);
  const totalPendientes = alquilerRecords.filter((r) => !r.transferido).length;

  // Cierre de lotes bancarios
  const comisionPuntoBancariaPct = Number(config.comisionPuntoPorcentaje ?? 0.75);
  const comisionBiopagoBancariaPct = Number(config.biopagoPorcentaje ?? 2.0);

  // Lote Punto POS: recargas propias + vecinos en punto
  const totalLotePunto = puntoRecargas + puntoPasado;
  const retencionBancoPunto = totalLotePunto * (comisionPuntoBancariaPct / 100);

  // Lote BioPago: recargas propias + vecinos en biopago
  const totalLoteBiopago = biopagoRecargas + biopagoPasado;
  const retencionBancoBiopago = totalLoteBiopago * (comisionBiopagoBancariaPct / 100);

  // Lista filtrada según pestaña seleccionada
  const displayedRecords = alquilerRecords.filter((r) => {
    if (filterTipo === 'punto') return r.tipo !== 'biopago';
    if (filterTipo === 'biopago') return r.tipo === 'biopago';
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresa el nombre del comerciante o negocio');
      return;
    }
    if (!montoNum || montoNum <= 0) {
      setError(`Ingresa el monto total pasado en ${tipo === 'biopago' ? 'BioPago' : 'el Punto'}`);
      return;
    }

    if (addHandler) {
      addHandler({
        tipo: tipo, // 'punto' | 'biopago'
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg font-black tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  Alquiler de Punto POS & BioPago a Terceros (10%)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Comisión 10%
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Registra los tickets externos pasados por comerciantes (tarjeta en punto o huella en BioPago). El dinero se transfiere al día siguiente.
              </p>
            </div>
          </div>

          <button
            id="alquiler-pdf-report-btn"
            onClick={() => (onOpenPdfModal ? onOpenPdfModal() : setShowPdfModal(true))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Ver Reporte PDF de Cierre</span>
          </button>
        </div>

        {/* 4 CARJAS DE ARQUEO DE ALQUILER Y CIERRE DE LOTES */}
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

            {/* Desglose Punto vs BioPago */}
            {(puntoGanancia > 0 || biopagoGanancia > 0) && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="text-blue-700 dark:text-blue-300 font-bold">
                  💳 Punto: +{formatBs(puntoGanancia)}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-700 dark:text-amber-300 font-bold">
                  👆 BioPago: +{formatBs(biopagoGanancia)}
                </span>
              </div>
            )}
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
            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
              <div>💳 Punto: {puntoTickets} tix ({formatBs(puntoPasado)})</div>
              <div>👆 BioPago: {biopagoTickets} tix ({formatBs(biopagoPasado)})</div>
            </div>
          </div>

          {/* Cierres de Lotes Bancarios (Punto POS y BioPago) */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-blue-800' : 'text-blue-300'
                }`}>
                  💳 Lote Punto POS
                </span>
                <span className="text-[10px] text-rose-600 font-mono font-bold">
                  -{formatBs(retencionBancoPunto)} ({comisionPuntoBancariaPct}%)
                </span>
              </div>
              <div className={`text-base font-black font-mono ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                {formatBs(totalLotePunto)}
              </div>
              <span className={`text-[9px] block text-slate-400 font-mono`}>
                Recargas ({formatBs(puntoRecargas)}) + Vecinos ({formatBs(puntoPasado)})
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-amber-800' : 'text-amber-300'
                }`}>
                  👆 Lote BioPago
                </span>
                <span className="text-[10px] text-rose-600 font-mono font-bold">
                  -{formatBs(retencionBancoBiopago)} ({comisionBiopagoBancariaPct}%)
                </span>
              </div>
              <div className={`text-base font-black font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                {formatBs(totalLoteBiopago)}
              </div>
              <span className={`text-[9px] block text-slate-400 font-mono`}>
                Recargas ({formatBs(biopagoRecargas)}) + Vecinos ({formatBs(biopagoPasado)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE REGISTRO RÁPIDO */}
      <div className={`p-5 rounded-2xl border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            Registrar Tickets de Comerciante
          </h3>

          {/* SELECTOR DE MEDIO: PUNTO POS VS BIOPAGO */}
          <div className={`inline-flex rounded-xl p-1 border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              type="button"
              id="select-tipo-biopago"
              onClick={() => setTipo('biopago')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipo === 'biopago'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>BioPago (Huella)</span>
            </button>

            <button
              type="button"
              id="select-tipo-punto"
              onClick={() => setTipo('punto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipo === 'punto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Punto POS (Tarjeta)</span>
            </button>
          </div>
        </div>

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
                  className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                    tipo === 'biopago' ? 'focus:ring-amber-500' : 'focus:ring-blue-500'
                  } ${
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
                {tipo === 'biopago'
                  ? 'N° de Tickets Manuales (BioPago):'
                  : 'N° de Vouchers / Tickets (Punto):'}
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
                  className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                    tipo === 'biopago' ? 'focus:ring-amber-500' : 'focus:ring-blue-500'
                  } ${
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
                {tipo === 'biopago'
                  ? 'Monto Total Pasado en BioPago (Bs.):'
                  : 'Monto Total Pasado en el Punto (Bs.):'}
              </label>
              <div className="relative">
                <input
                  id="input-comerciante-monto"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 2000"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                    tipo === 'biopago' ? 'focus:ring-amber-500' : 'focus:ring-blue-500'
                  } ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  tipo === 'biopago'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                }`}>
                  {tipo === 'biopago' ? <Fingerprint className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                  {tipo === 'biopago' ? 'BioPago' : 'Punto POS'}
                </span>
                <span className="text-slate-500">Comerciante: <strong>{nombre || 'Vecino'}</strong></span>
                <span>•</span>
                <span className="text-slate-500">
                  {tickets || 1} {tipo === 'biopago' ? 'tickets manuales' : 'tickets'}
                </span>
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
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm cursor-pointer ${
                tipo === 'biopago'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {tipo === 'biopago'
                  ? '+ Registrar Tickets de BioPago'
                  : '+ Registrar Tickets de Punto POS'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE COMERCIANTES REGISTRADOS CON FILTRO */}
      <div className={`rounded-2xl border overflow-hidden transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Comerciantes del Día ({alquilerRecords.length})
              </h3>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Desglose de tickets pasados por comerciantes en Punto POS y BioPago
            </p>
          </div>

          {/* BOTONES DE FILTRO: TODOS, PUNTO POS, BIOPAGO */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterTipo('todos')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterTipo === 'todos'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : isLight
                  ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos ({alquilerRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTipo('punto')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterTipo === 'punto'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isLight
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  : 'bg-blue-950/40 text-blue-300 border border-blue-800 hover:bg-blue-900/50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Punto ({recordsPunto.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTipo('biopago')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterTipo === 'biopago'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : isLight
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800 hover:bg-amber-900/50'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>BioPago ({recordsBiopago.length})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b uppercase font-bold text-[10px] tracking-wider ${
              isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}>
              <tr>
                <th className="py-3 px-4 font-sans">Hora</th>
                <th className="py-3 px-4 font-sans">Medio</th>
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
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center font-sans">
                    <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {filterTipo === 'todos'
                        ? 'No hay alquileres registrados en esta fecha.'
                        : filterTipo === 'biopago'
                        ? 'No hay registros de BioPago para esta fecha.'
                        : 'No hay registros de Punto POS para esta fecha.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Usa el formulario de arriba para ingresar los tickets manuales de BioPago o del Punto POS.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRecords.map((item) => {
                  const isItemBiopago = item.tipo === 'biopago';
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}
                    >
                      <td className={`py-3 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.hora || '-'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isItemBiopago
                            ? isLight
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-amber-950/80 text-amber-300 border-amber-700'
                            : isLight
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-blue-950/80 text-blue-300 border-blue-700'
                        }`}>
                          {isItemBiopago ? <Fingerprint className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                          <span>{isItemBiopago ? 'BioPago' : 'Punto POS'}</span>
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-sans font-bold text-sm ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {item.nombre}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {item.tickets} {isItemBiopago ? (item.tickets === 1 ? 'manual' : 'manuales') : (item.tickets === 1 ? 'ticket' : 'tickets')}
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
                          title="Clic para alternar estado de entrega"
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
                            onClick={() => setDeletingRecord(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* FILA DE TOTALES */}
            {displayedRecords.length > 0 && (
              <tfoot className={`border-t-2 font-bold ${
                isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-sans uppercase text-xs">
                    TOTALES ({displayedRecords.length} {displayedRecords.length === 1 ? 'registro' : 'registros'})
                  </td>
                  <td className="py-3 px-4 text-center font-black">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      isLight
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}>
                      {displayedRecords.reduce((acc, r) => acc + Number(r.tickets || 1), 0)} tix
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black">
                    {formatBs(displayedRecords.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0))}
                  </td>
                  <td className={`py-3 px-4 text-right font-black text-sm ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    +{formatBs(displayedRecords.reduce((acc, r) => acc + Number(r.comisionBs || 0), 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-sm">
                    {formatBs(displayedRecords.reduce((acc, r) => acc + Number(r.montoPagar || 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL REPORTE PDF DE CIERRE */}
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

      {/* MODAL DE EDICIÓN DE COMERCIANTE */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Editar Registro de Alquiler</h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Modifica los datos del pase de Punto POS o BioPago
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

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Selector Dispositivo */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Dispositivo / Medio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTipo('biopago')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editTipo === 'biopago'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>BioPago (Huella)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipo('punto')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editTipo === 'punto'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Punto POS</span>
                  </button>
                </div>
              </div>

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
                    {editTipo === 'biopago' ? 'Tickets Manuales' : 'Tickets / Vouchers'}
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
                  Monto Pasado en {editTipo === 'biopago' ? 'BioPago' : 'Punto'} (Bs.)
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

      {/* MODAL CONFIRMACIÓN DE ELIMINAR REGISTRO */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`border rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ¿Eliminar registro de alquiler?
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Se eliminará este pase de {deletingRecord.tipo === 'biopago' ? 'BioPago' : 'Punto POS'} del arqueo del día.
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-3.5 border space-y-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Medio:</span>
                <span className={`font-bold font-sans text-xs px-2 py-0.5 rounded-full ${
                  deletingRecord.tipo === 'biopago' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {deletingRecord.tipo === 'biopago' ? '👆 BioPago (Huella)' : '💳 Punto POS (Tarjeta)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Comerciante / Vecino:</span>
                <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                  {deletingRecord.nombre || 'Sin nombre'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tickets:</span>
                <span className="font-mono font-bold">
                  {deletingRecord.tickets || 1} {deletingRecord.tipo === 'biopago' ? 'manuales' : 'vouchers'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monto Total Pasado:</span>
                <span className="font-mono font-bold">
                  {formatBs(deletingRecord.montoTotal)}
                </span>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div>
                  <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Comisión Ganada ({deletingRecord.comisionPorcentaje || 10}%)
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    +{formatBs(deletingRecord.comisionBs || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Monto a Transferir
                  </span>
                  <span className="font-mono font-black text-sm text-sky-600 dark:text-sky-400">
                    {formatBs(deletingRecord.montoPagar || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                id="confirm-delete-alquiler-btn"
                type="button"
                onClick={() => {
                  deleteHandler && deleteHandler(deletingRecord.id);
                  setDeletingRecord(null);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
