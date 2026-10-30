'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Fingerprint,
  Shuffle,
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

  // Filtro de visualización: 'todos' | 'mixto' | 'punto' | 'biopago'
  const [filterTipo, setFilterTipo] = useState('todos');

  // Formulario nuevo comerciante
  const [tipo, setTipo] = useState('mixto'); // 'mixto' | 'punto' | 'biopago'
  const [nombre, setNombre] = useState('');
  
  // Campos individuales (para modo individual 'punto' o 'biopago')
  const [tickets, setTickets] = useState('1');
  const [montoTotal, setMontoTotal] = useState('');

  // Campos para modo Mixto
  const [ticketsPunto, setTicketsPunto] = useState('1');
  const [montoPunto, setMontoPunto] = useState('');
  const [ticketsBiopago, setTicketsBiopago] = useState('1');
  const [montoBiopago, setMontoBiopago] = useState('');

  const [error, setError] = useState('');

  // Estado para modal de edición
  const [editingItem, setEditingItem] = useState(null);
  const [editTipo, setEditTipo] = useState('punto');
  const [editNombre, setEditNombre] = useState('');
  const [editTickets, setEditTickets] = useState('1');
  const [editMonto, setEditMonto] = useState('');
  const [editTicketsPunto, setEditTicketsPunto] = useState('1');
  const [editMontoPunto, setEditMontoPunto] = useState('');
  const [editTicketsBiopago, setEditTicketsBiopago] = useState('1');
  const [editMontoBiopago, setEditMontoBiopago] = useState('');
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
    const itemTipo = item.tipo || 'punto';
    setEditTipo(itemTipo);
    setEditNombre(item.nombre || '');
    setEditComisionPct(String(item.comisionPorcentaje ?? 10));
    setEditTransferido(Boolean(item.transferido));
    setEditError('');

    if (itemTipo === 'mixto') {
      setEditTicketsPunto(String(item.ticketsPunto || 1));
      setEditMontoPunto(String(item.montoPunto || ''));
      setEditTicketsBiopago(String(item.ticketsBiopago || 1));
      setEditMontoBiopago(String(item.montoBiopago || ''));
      setEditMonto(String(item.montoTotal || ''));
      setEditTickets(String(item.tickets || 1));
    } else {
      setEditTickets(String(item.tickets || 1));
      setEditMonto(String(item.montoTotal || ''));
      setEditTicketsPunto(String(item.ticketsPunto || item.tickets || 1));
      setEditMontoPunto(String(item.montoPunto || item.montoTotal || ''));
      setEditTicketsBiopago(String(item.ticketsBiopago || 1));
      setEditMontoBiopago(String(item.montoBiopago || ''));
    }
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editNombre.trim()) {
      setEditError('Ingresa el nombre del comerciante o negocio');
      return;
    }

    const numComision = parseFloat(String(editComisionPct).replace(',', '.')) || 10;

    if (editTipo === 'mixto') {
      const numMontoP = parseFloat(String(editMontoPunto).replace(',', '.')) || 0;
      const numMontoB = parseFloat(String(editMontoBiopago).replace(',', '.')) || 0;
      const totalM = Math.round((numMontoP + numMontoB) * 100) / 100;
      if (totalM <= 0) {
        setEditError('Ingresa al menos un monto válido en Punto o BioPago');
        return;
      }
      const numTixP = parseInt(editTicketsPunto, 10) || 0;
      const numTixB = parseInt(editTicketsBiopago, 10) || 0;

      if (updateHandler && editingItem) {
        updateHandler(editingItem.id, {
          tipo: 'mixto',
          nombre: editNombre.trim(),
          ticketsPunto: numTixP,
          montoPunto: numMontoP,
          ticketsBiopago: numTixB,
          montoBiopago: numMontoB,
          tickets: numTixP + numTixB || 1,
          montoTotal: totalM,
          comisionPorcentaje: numComision,
          transferido: editTransferido
        });
      }
    } else {
      const numMonto = parseFloat(String(editMonto).replace(',', '.'));
      if (!numMonto || numMonto <= 0) {
        setEditError('Ingresa un monto válido mayor a cero');
        return;
      }
      const numTickets = parseInt(editTickets, 10) || 1;

      if (updateHandler && editingItem) {
        updateHandler(editingItem.id, {
          tipo: editTipo,
          nombre: editNombre.trim(),
          tickets: numTickets,
          montoTotal: numMonto,
          montoPunto: editTipo === 'punto' ? numMonto : 0,
          montoBiopago: editTipo === 'biopago' ? numMonto : 0,
          ticketsPunto: editTipo === 'punto' ? numTickets : 0,
          ticketsBiopago: editTipo === 'biopago' ? numTickets : 0,
          comisionPorcentaje: numComision,
          transferido: editTransferido
        });
      }
    }

    setEditingItem(null);
  };

  // Comisión configurada (10%)
  const comisionPct = 10;

  // Cálculo en vivo del formulario
  const numMontoSimple = parseFloat(montoTotal.replace(',', '.')) || 0;
  const numMontoP = parseFloat(montoPunto.replace(',', '.')) || 0;
  const numMontoB = parseFloat(montoBiopago.replace(',', '.')) || 0;
  const numMontoTotalMixto = Math.round((numMontoP + numMontoB) * 100) / 100;

  const montoEfectivoForm = tipo === 'mixto' ? numMontoTotalMixto : numMontoSimple;
  const gananciaPreview = montoEfectivoForm * (comisionPct / 100);
  const aPagarPreview = montoEfectivoForm - gananciaPreview;

  // Desglose por tipo de alquiler (incluyendo las porciones de registros mixtos)
  const recordsPunto = alquilerRecords.filter((r) => r.tipo === 'punto');
  const recordsBiopago = alquilerRecords.filter((r) => r.tipo === 'biopago');
  const recordsMixto = alquilerRecords.filter((r) => r.tipo === 'mixto');

  const puntoPasado = alquilerRecords.reduce((acc, r) => {
    if (r.tipo === 'mixto') return acc + Number(r.montoPunto || 0);
    if (r.tipo !== 'biopago') return acc + Number(r.montoTotal || 0);
    return acc;
  }, 0);

  const biopagoPasado = alquilerRecords.reduce((acc, r) => {
    if (r.tipo === 'mixto') return acc + Number(r.montoBiopago || 0);
    if (r.tipo === 'biopago') return acc + Number(r.montoTotal || 0);
    return acc;
  }, 0);

  const puntoTickets = alquilerRecords.reduce((acc, r) => {
    if (r.tipo === 'mixto') return acc + Number(r.ticketsPunto || 0);
    if (r.tipo !== 'biopago') return acc + Number(r.tickets || 1);
    return acc;
  }, 0);

  const biopagoTickets = alquilerRecords.reduce((acc, r) => {
    if (r.tipo === 'mixto') return acc + Number(r.ticketsBiopago || 0);
    if (r.tipo === 'biopago') return acc + Number(r.tickets || 1);
    return acc;
  }, 0);

  const puntoGanancia = puntoPasado * 0.10;
  const biopagoGanancia = biopagoPasado * 0.10;

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
    if (filterTipo === 'mixto') return r.tipo === 'mixto';
    if (filterTipo === 'punto') return r.tipo === 'punto' || (r.tipo === 'mixto' && Number(r.montoPunto) > 0);
    if (filterTipo === 'biopago') return r.tipo === 'biopago' || (r.tipo === 'mixto' && Number(r.montoBiopago) > 0);
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresa el nombre del comerciante o negocio');
      return;
    }

    if (tipo === 'mixto') {
      if (numMontoTotalMixto <= 0) {
        setError('Ingresa el monto pasado en Punto POS o en BioPago');
        return;
      }

      if (addHandler) {
        addHandler({
          tipo: 'mixto',
          fecha: selectedDate,
          nombre: nombre.trim(),
          ticketsPunto: parseInt(ticketsPunto, 10) || 0,
          montoPunto: numMontoP,
          ticketsBiopago: parseInt(ticketsBiopago, 10) || 0,
          montoBiopago: numMontoB,
          tickets: (parseInt(ticketsPunto, 10) || 0) + (parseInt(ticketsBiopago, 10) || 0) || 1,
          montoTotal: numMontoTotalMixto,
          comisionPorcentaje: comisionPct
        });
      }
    } else {
      if (!numMontoSimple || numMontoSimple <= 0) {
        setError(`Ingresa el monto total pasado en ${tipo === 'biopago' ? 'BioPago' : 'el Punto'}`);
        return;
      }

      if (addHandler) {
        addHandler({
          tipo: tipo,
          fecha: selectedDate,
          nombre: nombre.trim(),
          tickets: parseInt(tickets, 10) || 1,
          montoTotal: numMontoSimple,
          montoPunto: tipo === 'punto' ? numMontoSimple : 0,
          montoBiopago: tipo === 'biopago' ? numMontoSimple : 0,
          ticketsPunto: tipo === 'punto' ? (parseInt(tickets, 10) || 1) : 0,
          ticketsBiopago: tipo === 'biopago' ? (parseInt(tickets, 10) || 1) : 0,
          comisionPorcentaje: comisionPct
        });
      }
    }

    setNombre('');
    setTickets('1');
    setMontoTotal('');
    setTicketsPunto('1');
    setMontoPunto('');
    setTicketsBiopago('1');
    setMontoBiopago('');
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  Modo Mixto Activo
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Registra comerciantes con tickets de Punto POS, BioPago o <strong>Mixto</strong> (ambos aparatos juntos en un solo registro y una sola transferencia).
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
              <Clock className="w-3.5 h-3.5 inline text-amber-600 shrink-0" /> {totalPendientes} comerciantes por pagar
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
              {totalTickets} tickets • {alquilerRecords.length} registros
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

      {/* FORMULARIO DE REGISTRO CON SOPORTE MIXTO */}
      <div className={`p-5 rounded-2xl border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Registrar Tickets de Comerciante
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Elige si es mixto (ambos aparatos) o solo un dispositivo
            </p>
          </div>

          {/* SELECTOR DE MEDIO: MIXTO vs BIOPAGO vs PUNTO POS */}
          <div className={`inline-flex rounded-xl p-1 border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              type="button"
              id="select-tipo-mixto"
              onClick={() => setTipo('mixto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipo === 'mixto'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Mixto (Punto + BioPago)</span>
            </button>

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
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Solo BioPago</span>
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
              <CreditCard className="w-3.5 h-3.5" />
              <span>Solo Punto</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Ej: Mailet, Josue, Carnicería María..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                  tipo === 'mixto'
                    ? 'focus:ring-indigo-500'
                    : tipo === 'biopago'
                    ? 'focus:ring-amber-500'
                    : 'focus:ring-blue-500'
                } ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* SI EL MODO ES MIXTO: DOS CUADROS PARALELOS (PUNTO Y BIOPAGO) */}
          {tipo === 'mixto' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Sección Punto POS */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-950/20 border-blue-900/40'
              }`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    1. Tarjetas Pasadas en Punto POS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      N° Tickets Punto:
                    </label>
                    <input
                      id="input-mixto-tickets-punto"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 8"
                      value={ticketsPunto}
                      onChange={(e) => setTicketsPunto(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Monto en Punto (Bs.):
                    </label>
                    <div className="relative">
                      <input
                        id="input-mixto-monto-punto"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 15000"
                        value={montoPunto}
                        onChange={(e) => setMontoPunto(e.target.value)}
                        className={`w-full pl-3 pr-8 py-1.5 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                        Bs.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección BioPago */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'
              }`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Fingerprint className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    2. Huellas Pasadas en BioPago
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      N° Tickets Manuales:
                    </label>
                    <input
                      id="input-mixto-tickets-biopago"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 2"
                      value={ticketsBiopago}
                      onChange={(e) => setTicketsBiopago(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Monto en BioPago (Bs.):
                    </label>
                    <div className="relative">
                      <input
                        id="input-mixto-monto-biopago"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 3000"
                        value={montoBiopago}
                        onChange={(e) => setMontoBiopago(e.target.value)}
                        className={`w-full pl-3 pr-8 py-1.5 text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                        Bs.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SI ES MODO INDIVIDUAL (SOLO PUNTO O SOLO BIOPAGO) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          )}

          {/* PREVIEW EN VIVO DEL CÁLCULO */}
          {montoEfectivoForm > 0 && (
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    tipo === 'mixto'
                      ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30'
                      : tipo === 'biopago'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                  }`}>
                    {tipo === 'mixto' ? <Shuffle className="w-3 h-3" /> : tipo === 'biopago' ? <Fingerprint className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                    {tipo === 'mixto' ? 'Alquiler Mixto' : tipo === 'biopago' ? 'BioPago' : 'Punto POS'}
                  </span>
                  <span className="text-slate-500">Comerciante: <strong>{nombre || 'Vecino'}</strong></span>
                </div>

                {tipo === 'mixto' ? (
                  <p className="text-[11px] text-slate-500 font-mono">
                    💳 Punto: {formatBs(numMontoP)} ({ticketsPunto || 0} tix) + 👆 BioPago: {formatBs(numMontoB)} ({ticketsBiopago || 0} man.)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-mono">
                    Total: {formatBs(montoEfectivoForm)} • {tickets || 1} tickets
                  </p>
                )}
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
                  <span className="text-[9px] text-slate-400 block font-sans">
                    1 sola transferencia consolidada
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
                tipo === 'mixto'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : tipo === 'biopago'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {tipo === 'mixto'
                  ? '+ Registrar Alquiler Mixto (Punto + BioPago)'
                  : tipo === 'biopago'
                  ? '+ Registrar Tickets de BioPago'
                  : '+ Registrar Tickets de Punto POS'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE COMERCIANTES REGISTRADOS CON FILTROS */}
      <div className={`rounded-2xl border overflow-hidden transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Comerciantes del Día ({alquilerRecords.length})
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Desglose de tickets pasados por comerciantes en Punto POS, BioPago y Mixto
            </p>
          </div>

          {/* BOTONES DE FILTRO: TODOS, MIXTOS, PUNTO POS, BIOPAGO */}
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
              onClick={() => setFilterTipo('mixto')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterTipo === 'mixto'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : isLight
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  : 'bg-indigo-950/40 text-indigo-300 border border-indigo-800 hover:bg-indigo-900/50'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Mixtos ({recordsMixto.length})</span>
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
                        : filterTipo === 'mixto'
                        ? 'No hay registros Mixtos para esta fecha.'
                        : filterTipo === 'biopago'
                        ? 'No hay registros de BioPago para esta fecha.'
                        : 'No hay registros de Punto POS para esta fecha.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Usa el formulario de arriba para ingresar los tickets en modo Mixto, Punto POS o BioPago.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRecords.map((item) => {
                  const isItemMixto = item.tipo === 'mixto';
                  const isItemBiopago = item.tipo === 'biopago';

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}
                    >
                      <td className={`py-3 px-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.hora || '-'}
                      </td>

                      {/* Insignia de Medio / Dispositivo */}
                      <td className="py-3 px-4 font-sans">
                        {isItemMixto ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isLight
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                          }`}>
                            <Shuffle className="w-3.5 h-3.5" />
                            <span>Mixto</span>
                          </span>
                        ) : isItemBiopago ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isLight
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-amber-950/80 text-amber-300 border-amber-700'
                          }`}>
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>BioPago</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isLight
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-blue-950/80 text-blue-300 border-blue-700'
                          }`}>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Punto POS</span>
                          </span>
                        )}
                      </td>

                      {/* Nombre Comerciante */}
                      <td className={`py-3 px-4 font-sans font-bold text-sm ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {item.nombre}
                      </td>

                      {/* Tickets (con desglose si es Mixto) */}
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {item.tickets} {item.tickets === 1 ? 'ticket' : 'tickets'}
                        </span>
                        {isItemMixto && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.ticketsPunto || 0} POS + {item.ticketsBiopago || 0} Bio
                          </div>
                        )}
                      </td>

                      {/* Monto Pasado (con desglose si es Mixto) */}
                      <td className={`py-3 px-4 text-right font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <div>{formatBs(item.montoTotal)}</div>
                        {isItemMixto && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            POS: {formatBs(item.montoPunto || 0)} • Bio: {formatBs(item.montoBiopago || 0)}
                          </div>
                        )}
                      </td>

                      {/* Tu Ganancia */}
                      <td className={`py-3 px-4 text-right font-bold ${
                        isLight ? 'text-emerald-700' : 'text-emerald-400'
                      }`}>
                        +{formatBs(item.comisionBs)}
                      </td>

                      {/* A Transferir Mañana */}
                      <td className={`py-3 px-4 text-right font-bold ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        <span className={item.transferido ? 'line-through opacity-50' : ''}>
                          {formatBs(item.montoPagar)}
                        </span>
                      </td>

                      {/* Estado de Entrega (1 solo botón para pagar todo junto) */}
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

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 transition cursor-pointer"
                            title="Editar comerciante y montos"
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
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
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
                    Modifica los datos del pase de Punto POS, BioPago o Mixto
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

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
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
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTipo('mixto')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      editTipo === 'mixto'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Mixto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipo('biopago')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      editTipo === 'biopago'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>BioPago</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipo('punto')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      editTipo === 'punto'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
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
                  placeholder="Ej: Mailet, Brayan, Josue..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                  autoFocus
                />
              </div>

              {/* Campos condicionales de edición */}
              {editTipo === 'mixto' ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-950/20 border-blue-900/40'}`}>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-2">
                      💳 Porción Punto POS
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold block mb-1">Tickets Punto:</label>
                        <input
                          type="number"
                          value={editTicketsPunto}
                          onChange={(e) => setEditTicketsPunto(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold block mb-1">Monto Punto (Bs.):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editMontoPunto}
                          onChange={(e) => setEditMontoPunto(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'}`}>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-2">
                      👆 Porción BioPago
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold block mb-1">Tickets BioPago:</label>
                        <input
                          type="number"
                          value={editTicketsBiopago}
                          onChange={(e) => setEditTicketsBiopago(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold block mb-1">Monto BioPago (Bs.):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editMontoBiopago}
                          onChange={(e) => setEditMontoBiopago(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {editTipo === 'biopago' ? 'Tickets Manuales' : 'Tickets / Vouchers'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editTickets}
                      onChange={(e) => setEditTickets(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm font-bold font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Monto Pasado (Bs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm font-black font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Comisión % */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Comisión Retenida (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editComisionPct}
                  onChange={(e) => setEditComisionPct(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-bold font-mono transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Vista previa en vivo del cálculo */}
              {(() => {
                const totalM = editTipo === 'mixto'
                  ? (parseFloat(String(editMontoPunto).replace(',', '.')) || 0) + (parseFloat(String(editMontoBiopago).replace(',', '.')) || 0)
                  : (parseFloat(String(editMonto).replace(',', '.')) || 0);
                const pct = parseFloat(String(editComisionPct).replace(',', '.')) || 10;
                const ganancia = totalM * (pct / 100);
                const aPagar = totalM - ganancia;
                return (
                  <div className={`p-3 rounded-xl border space-y-1 text-xs font-mono ${
                    isLight ? 'bg-orange-50/60 border-orange-200 text-slate-800' : 'bg-orange-950/20 border-orange-900/60 text-slate-200'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-sans font-medium text-slate-500">Monto total:</span>
                      <span className="font-bold">{formatBs(totalM)}</span>
                    </div>
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
                  Se eliminará este registro del arqueo del día.
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-3.5 border space-y-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Medio:</span>
                <span className={`font-bold font-sans text-xs px-2 py-0.5 rounded-full ${
                  deletingRecord.tipo === 'mixto'
                    ? 'bg-indigo-500/10 text-indigo-600'
                    : deletingRecord.tipo === 'biopago'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {deletingRecord.tipo === 'mixto'
                    ? '🔀 Mixto (Punto + BioPago)'
                    : deletingRecord.tipo === 'biopago'
                    ? '👆 BioPago (Huella)'
                    : '💳 Punto POS (Tarjeta)'}
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
                  {deletingRecord.tickets || 1} tickets
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
