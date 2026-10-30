import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { formatBs, formatUsd, validateMontoOperadora, compareTransactionsByTime } from '@/lib/calculator';
import { exportDailyTransactions } from '@/lib/excelExport';
import { OPERADORAS, METODOS_PAGO } from '@/lib/constants';
import { Trash2, Edit2, Search, Filter, Download, AlertTriangle, FileSpreadsheet, X, Check, FileText, Clock, CheckCircle2, User, ArrowDownUp, ArrowUp, ArrowDown } from 'lucide-react';
import ReportPdfModal from './ReportPdfModal';

export default function DailyTable({
  transactions = [],
  onDeleteTransaction,
  onUpdateTransaction,
  onToggleEstadoPago,
  onAbonarDeuda,
  onClearDateTransactions,
  selectedDate,
  theme = 'dark',
  tasaBcv = 0,
  alquilerRecords = [],
  currentUser = null
}) {
  const isLight = theme === 'light';
  const isVendedor = currentUser?.rol === 'vendedor';
  const [filterOperadora, setFilterOperadora] = useState('todas');
  const [filterPlataforma, setFilterPlataforma] = useState('todas'); // 'todas' | 'payall' | 'pagodirecto'
  const [filterMetodo, setFilterMetodo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos'); // 'todos' | 'pagados' | 'pendientes'
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [payPendingTx, setPayPendingTx] = useState(null);
  const [payPendingMethod, setPayPendingMethod] = useState('efectivo');
  const [payMode, setPayMode] = useState('abono'); // 'abono' | 'total'
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoError, setAbonoError] = useState('');
  const [deletingTx, setDeletingTx] = useState(null);

  // Ordenamiento cronológico de recargas: 'desc' (de abajo hacia arriba) o 'asc' (de arriba hacia abajo)
  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('recargas_sort_order') || 'desc';
    }
    return 'desc';
  });

  const handleToggleSort = () => {
    const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(nextOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recargas_sort_order', nextOrder);
    }
  };

  // Estado para el modal de edición
  const [editingTx, setEditingTx] = useState(null);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    telefono: '',
    clienteNombre: '',
    estadoPago: 'pagado',
    metodo: 'efectivo',
    plataforma: 'payall',
    montoRecarga: 0,
    montoCobrado: 0,
    operadoraId: 'digitel'
  });

  // Métricas de fiados pendientes de la fecha
  const pendientesCount = useMemo(() => {
    return transactions.filter(t => t.estadoPago === 'pendiente').length;
  }, [transactions]);

  const pendientesTotalBs = useMemo(() => {
    return transactions
      .filter(t => t.estadoPago === 'pendiente')
      .reduce((acc, t) => acc + Number(t.montoCobrado || 0), 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      if (filterOperadora !== 'todas' && tx.operadoraId !== filterOperadora) {
        return false;
      }
      if (filterPlataforma !== 'todas') {
        const plat = (tx.plataforma || 'payall').toLowerCase();
        if (plat !== filterPlataforma) return false;
      }
      if (filterMetodo !== 'todos' && tx.metodo !== filterMetodo) {
        return false;
      }
      if (filterEstado === 'pendientes' && tx.estadoPago !== 'pendiente') {
        return false;
      }
      if (filterEstado === 'pagados' && tx.estadoPago === 'pendiente') {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesPhone = tx.telefono && tx.telefono.toLowerCase().includes(term);
        const matchesClient = tx.clienteNombre && tx.clienteNombre.toLowerCase().includes(term);
        const matchesOp = tx.operadoraNombre?.toLowerCase().includes(term);
        if (!matchesPhone && !matchesClient && !matchesOp) return false;
      }
      return true;
    });

    // Ordenamiento cronológico de mañana a noche (soporta 'desc': de abajo hacia arriba, 'asc': de arriba hacia abajo)
    return list.slice().sort((a, b) => compareTransactionsByTime(a, b, sortOrder));
  }, [transactions, filterOperadora, filterPlataforma, filterMetodo, filterEstado, searchTerm, sortOrder]);

  // Totales de la tabla filtrada
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const rec = Number(tx.montoRecarga || 0);
        const cob = Number(tx.montoCobrado || 0);
        const gan = cob - rec;

        acc.montoRecarga += rec;
        acc.montoCobrado += cob;
        acc.ganancia += gan;

        if (tx.metodo === 'mixto') {
          acc.efectivo += Number(tx.montoEfectivo || 0);
          acc.punto += Number(tx.montoPunto || 0);
          acc.biopago += Number(tx.montoBiopago || 0);
          acc.pagoMovil += Number(tx.montoPagoMovil || 0);
        } else if (tx.metodo === 'efectivo') {
          acc.efectivo += cob;
        } else if (tx.metodo === 'punto') {
          acc.punto += cob;
        } else if (tx.metodo === 'biopago') {
          acc.biopago += cob;
        } else if (tx.metodo === 'pagomovil') {
          acc.pagoMovil += cob;
        }

        return acc;
      },
      {
        montoRecarga: 0,
        montoCobrado: 0,
        efectivo: 0,
        punto: 0,
        biopago: 0,
        pagoMovil: 0,
        ganancia: 0
      }
    );
  }, [filteredTransactions]);

  // Exportar archivo .XLSX nativo con la librería XLSX (Abre directo en Excel con icono verde)
  const exportToExcelNative = () => {
    if (filteredTransactions.length === 0) return;
    exportDailyTransactions(filteredTransactions, selectedDate, totals);
  };

  // Funciones para abrir y guardar edición
  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditError('');
    setEditForm({
      telefono: tx.telefono || '',
      clienteNombre: tx.clienteNombre || '',
      estadoPago: tx.estadoPago || 'pagado',
      metodo: tx.metodo || 'efectivo',
      montoEfectivo: tx.montoEfectivo ?? (tx.metodo === 'efectivo' ? tx.montoCobrado : 0),
      montoPunto: tx.montoPunto ?? (tx.metodo === 'punto' ? tx.montoCobrado : 0),
      montoBiopago: tx.montoBiopago ?? (tx.metodo === 'biopago' ? tx.montoCobrado : 0),
      montoPagoMovil: tx.montoPagoMovil ?? (tx.metodo === 'pagomovil' ? tx.montoCobrado : 0),
      plataforma: (tx.plataforma || 'payall').toLowerCase(),
      montoRecarga: tx.montoRecarga || 0,
      montoCobrado: tx.montoCobrado || 0,
      operadoraId: tx.operadoraId || 'digitel'
    });
  };

  const parseDecimal = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = String(val).replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editingTx || !onUpdateTransaction) return;

    const opObj = OPERADORAS.find((o) => o.id === editForm.operadoraId);
    const recargaNum = parseDecimal(editForm.montoRecarga);
    const cobradoNum = parseDecimal(editForm.montoCobrado);

    // Validación estricta del monto
    const val = validateMontoOperadora(recargaNum, opObj);
    if (!val.isValid) {
      setEditError(val.error);
      return;
    }
    setEditError('');

    let finalEfectivo = 0;
    let finalPunto = 0;
    let finalBiopago = 0;
    let finalPagoMovil = 0;

    if (editForm.metodo === 'efectivo') {
      finalEfectivo = cobradoNum;
    } else if (editForm.metodo === 'punto') {
      finalPunto = cobradoNum;
    } else if (editForm.metodo === 'biopago') {
      finalBiopago = cobradoNum;
    } else if (editForm.metodo === 'pagomovil') {
      finalPagoMovil = cobradoNum;
    } else if (editForm.metodo === 'mixto') {
      finalEfectivo = parseDecimal(editForm.montoEfectivo);
      finalPunto = parseDecimal(editForm.montoPunto);
      finalBiopago = parseDecimal(editForm.montoBiopago);
      finalPagoMovil = parseDecimal(editForm.montoPagoMovil);
      const totalSuma = finalEfectivo + finalPunto + finalBiopago + finalPagoMovil;
      if (Math.abs(totalSuma - cobradoNum) > 0.05) {
        setEditError(`En pago mixto, la suma (${totalSuma.toFixed(2)} Bs) debe ser igual al total cobrado (${cobradoNum.toFixed(2)} Bs).`);
        return;
      }
    }

    // Si la operadora seleccionada es Simple TV, siempre debe ir por PagoDirecto
    const finalPlat = editForm.operadoraId === 'simpletv' ? 'pagodirecto' : editForm.plataforma;

    onUpdateTransaction(editingTx.id, {
      telefono: editForm.telefono.trim(),
      clienteNombre: editForm.clienteNombre.trim(),
      estadoPago: editForm.estadoPago,
      metodo: editForm.metodo,
      montoEfectivo: finalEfectivo,
      montoPunto: finalPunto,
      montoBiopago: finalBiopago,
      montoPagoMovil: finalPagoMovil,
      plataforma: finalPlat,
      montoRecarga: recargaNum,
      montoCobrado: cobradoNum,
      operadoraId: editForm.operadoraId,
      operadoraNombre: opObj?.nombre || editingTx.operadoraNombre
    });

    setEditingTx(null);
  };

  return (
    <div className="space-y-4">
      {/* Controles y Filtros */}
      <div className={`rounded-xl p-4 border flex flex-col gap-3 shadow-xs transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        {/* Fila 1: Filtro por Plataforma y Operadora */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filtros: Origen y Estado de Cobro */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Plataforma (Payall / PagoDirecto) */}
            <div className={`flex items-center border rounded-xl p-0.5 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-[10px] uppercase font-bold px-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Origen:</span>
              <button
                onClick={() => setFilterPlataforma('todas')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterPlataforma === 'todas'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterPlataforma('payall')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterPlataforma === 'payall'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : isLight ? 'text-emerald-900 font-extrabold hover:opacity-80' : 'text-emerald-400 hover:opacity-80'
                }`}
              >
                Payall
              </button>
              <button
                onClick={() => setFilterPlataforma('pagodirecto')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterPlataforma === 'pagodirecto'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isLight ? 'text-blue-900 font-extrabold hover:opacity-80' : 'text-blue-400 hover:opacity-80'
                }`}
              >
                PagoDirecto
              </button>
            </div>

            {/* Filtro Estado: Todos / Pagados / Fiados Pendientes */}
            <div className={`flex items-center border rounded-xl p-0.5 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-[10px] uppercase font-bold px-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Estado:</span>
              <button
                onClick={() => setFilterEstado('todos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterEstado === 'todos'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterEstado('pagados')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterEstado === 'pagados'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : isLight ? 'text-emerald-900 font-extrabold hover:opacity-80' : 'text-emerald-400 hover:opacity-80'
                }`}
              >
                Pagados
              </button>
              <button
                onClick={() => setFilterEstado('pendientes')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterEstado === 'pendientes'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : pendientesCount > 0
                    ? isLight ? 'text-amber-950 bg-amber-200/80 border border-amber-300 font-black' : 'text-amber-200 bg-amber-500/30 font-black'
                    : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Fiados ({pendientesCount})</span>
              </button>
            </div>
          </div>

          {/* Búsqueda, Exportar y Limpiar */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[140px] sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-transactions-input"
                type="text"
                placeholder="Buscar por cliente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                }`}
              />
            </div>

            {/* Botones de Acción Agrupados */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Botón de Secuencia Cronológica */}
              <button
                type="button"
                onClick={handleToggleSort}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
                  isLight
                    ? 'bg-orange-50 hover:bg-orange-100/80 border-orange-200 text-orange-800'
                    : 'bg-orange-950/40 hover:bg-orange-900/50 border-orange-800/60 text-orange-300'
                }`}
                title="Cambiar secuencia de orden cronológico"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                <span>
                  {sortOrder === 'desc'
                    ? 'Secuencia: Mañana ➔ Noche (De abajo hacia arriba)'
                    : 'Secuencia: Mañana ➔ Noche (De arriba hacia abajo)'}
                </span>
              </button>

              {!isVendedor && (
                <>
                  {/* Botón Principal: Exportar PDF / Imprimir */}
                  <button
                    id="export-pdf-btn"
                    onClick={() => setShowPdfModal(true)}
                    disabled={filteredTransactions.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 transition shadow-xs cursor-pointer"
                    title="Abrir vista previa e imprimir o guardar en PDF directo"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  {/* Botón Secundario: Excel */}
                  <button
                    id="export-csv-btn"
                    onClick={exportToExcelNative}
                    disabled={filteredTransactions.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer shadow-xs"
                    title="Descargar tabla en formato Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Excel</span>
                  </button>
                </>
              )}

              {transactions.length > 0 && onClearDateTransactions && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                    isLight
                      ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                  }`}
                  title="Vaciar las recargas registradas de este día a cero"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fila 2: Filtro rápido por Operadora */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterOperadora('todas')}
            className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              filterOperadora === 'todas'
                ? isLight
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-900'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas ({transactions.length})
          </button>
          {OPERADORAS.map((op) => (
            <button
              key={op.id}
              onClick={() => setFilterOperadora(op.id)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap font-medium cursor-pointer ${
                filterOperadora === op.id
                  ? op.badgeBg + ' font-black'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {op.nombre}
            </button>
          ))}
        </div>

        {/* BANNER DE CLIENTES CON RECARGAS FIADAS PENDIENTES */}
        {pendientesCount > 0 && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-sm transition-all ${
            isLight
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl shrink-0 ${
                isLight ? 'bg-amber-200/80 text-amber-900 shadow-xs' : 'bg-amber-500/20 text-amber-300'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className={isLight ? 'text-amber-950 font-semibold' : 'text-amber-200 font-medium'}>
                  Hay <strong className={`font-black ${isLight ? 'text-amber-950 underline decoration-amber-400' : 'text-white'}`}>{pendientesCount}</strong> {pendientesCount === 1 ? 'cliente con recarga fiada pendiente' : 'clientes con recargas fiadas pendientes'} por cobrar:
                </span>{' '}
                <span className={`inline-block font-mono font-black text-sm sm:text-base px-2.5 py-0.5 rounded-lg ml-1 shadow-xs ${
                  isLight
                    ? 'bg-amber-200 text-amber-950 border border-amber-300'
                    : 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                }`}>
                  {formatBs(pendientesTotalBs)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterEstado(filterEstado === 'pendientes' ? 'todos' : 'pendientes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto ${
                filterEstado === 'pendientes'
                  ? 'bg-amber-800 hover:bg-amber-900 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {filterEstado === 'pendientes' ? 'Ver Todas las Recargas' : 'Ver Solo Fiados Pendientes'}
            </button>
          </div>
        )}
      </div>

      {/* Modal Confirmación de Vaciar Día */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold">¿Vaciar registros de este día?</h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Esto borrará las transacciones del día seleccionado para comenzar en cero.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onClearDateTransactions();
                  setShowClearConfirm(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
              >
                Sí, vaciar en cero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminar Recarga Individual */}
      {deletingTx && (
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
                  ¿Eliminar esta recarga?
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Verifica los datos para evitar eliminar una transacción por error.
                </p>
              </div>
            </div>

            {/* Ficha de datos de la recarga a eliminar */}
            <div className={`rounded-xl p-3.5 border space-y-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Operadora y Plataforma:</span>
                <span className="font-bold flex items-center gap-1.5 font-sans">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        OPERADORAS.find((o) => o.id === deletingTx.operadoraId)?.color || '#94a3b8'
                    }}
                  />
                  <span>{deletingTx.operadoraNombre}</span>
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                    (deletingTx.plataforma || 'payall').toLowerCase() === 'pagodirecto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}>
                    {deletingTx.plataforma || 'Payall'}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Número / Teléfono:</span>
                <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400 tracking-wider">
                  {deletingTx.telefono || 'Sin número especificado'}
                </span>
              </div>

              {deletingTx.clienteNombre && (
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cliente:</span>
                  <span className="font-bold">{deletingTx.clienteNombre}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Hora de registro:</span>
                <span className="font-mono">{deletingTx.hora || '-'}</span>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div>
                  <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Monto Recarga
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {formatBs(deletingTx.montoRecarga)}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Total Cobrado ({deletingTx.metodo === 'pagomovil' ? 'Pago Móvil' : deletingTx.metodo})
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {formatBs(deletingTx.montoCobrado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                id="confirm-delete-tx-btn"
                type="button"
                onClick={() => {
                  onDeleteTransaction(deletingTx.id);
                  setDeletingTx(null);
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

      {/* Modal para Editar Transacción */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}>
            {/* Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f172a]'
            }`}>
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Editar Recarga
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Hora: {editingTx.hora} • {editingTx.operadoraNombre}
                </p>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Estado de Cobro y Nombre del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Nombre del Cliente (Fiador)
                  </label>
                  <input
                    id="edit-tx-client-input"
                    type="text"
                    placeholder="Ej: Carlos mecánico"
                    value={editForm.clienteNombre}
                    onChange={(e) => setEditForm({ ...editForm, clienteNombre: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-medium border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Número de Teléfono / Contrato
                  </label>
                  <input
                    id="edit-tx-phone-input"
                    type="text"
                    placeholder="Ej: 0412-1234567"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-medium border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Condición de Pago: Pagado vs Fiado/Pendiente */}
              <div>
                <label className={`block font-bold uppercase tracking-wider mb-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Condición de Cobro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, estadoPago: 'pagado' })}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer text-xs ${
                      (editForm.estadoPago || 'pagado') === 'pagado'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pagado
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, estadoPago: 'pendiente' })}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer text-xs ${
                      editForm.estadoPago === 'pendiente'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Fiado / Pendiente
                  </button>
                </div>
              </div>

              {/* Origen / Plataforma: Payall vs PagoDirecto */}
              <div>
                <label className={`block font-bold uppercase tracking-wider mb-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Origen / Plataforma
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editForm.operadoraId === 'simpletv') {
                        setEditForm({ ...editForm, operadoraId: 'digitel', plataforma: 'payall' });
                      } else {
                        setEditForm({ ...editForm, plataforma: 'payall' });
                      }
                    }}
                    className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      editForm.plataforma === 'payall'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Payall
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, plataforma: 'pagodirecto' })}
                    className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      editForm.plataforma === 'pagodirecto'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    PagoDirecto
                  </button>
                </div>
                {editForm.operadoraId === 'simpletv' && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 block font-semibold">
                    * Simple TV solo está disponible por PagoDirecto (Payall no lo tiene).
                  </span>
                )}
              </div>

              {/* Medio de Cobro */}
              <div>
                <label className={`block font-bold uppercase tracking-wider mb-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Modo de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, metodo: m.id })}
                      className={`p-2.5 rounded-xl font-bold border text-center transition cursor-pointer ${
                        editForm.metodo === m.id
                          ? isLight
                            ? 'border-orange-500 bg-orange-50 text-orange-900 ring-1 ring-orange-500'
                            : 'border-orange-500 bg-orange-950/40 text-orange-300 ring-1 ring-orange-500'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {m.nombre}
                    </button>
                  ))}
                </div>

                {editForm.metodo === 'mixto' && (
                  <div className={`mt-2.5 p-3 rounded-xl border ${
                    isLight ? 'bg-purple-50/60 border-purple-200 text-slate-800' : 'bg-purple-950/20 border-purple-800/50 text-purple-200'
                  }`}>
                    <span className="block text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase mb-2">
                      Desglose de Pago Mixto:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Efectivo (Bs)</label>
                        <input
                          type="number"
                          step="any"
                          value={editForm.montoEfectivo}
                          onChange={(e) => setEditForm({ ...editForm, montoEfectivo: e.target.value })}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Punto POS (Bs)</label>
                        <input
                          type="number"
                          step="any"
                          value={editForm.montoPunto}
                          onChange={(e) => setEditForm({ ...editForm, montoPunto: e.target.value })}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">BioPago (Bs)</label>
                        <input
                          type="number"
                          step="any"
                          value={editForm.montoBiopago}
                          onChange={(e) => setEditForm({ ...editForm, montoBiopago: e.target.value })}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pago Móvil (Bs)</label>
                        <input
                          type="number"
                          step="any"
                          value={editForm.montoPagoMovil}
                          onChange={(e) => setEditForm({ ...editForm, montoPagoMovil: e.target.value })}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Operadora */}
              <div>
                <label className={`block font-bold uppercase tracking-wider mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Operadora
                </label>
                <select
                  id="edit-tx-operadora-select"
                  value={editForm.operadoraId}
                  onChange={(e) => {
                    const newOp = e.target.value;
                    if (newOp === 'simpletv') {
                      setEditForm({ ...editForm, operadoraId: newOp, plataforma: 'pagodirecto' });
                    } else {
                      setEditForm({ ...editForm, operadoraId: newOp });
                    }
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-sm font-semibold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  {OPERADORAS.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre} {op.id === 'simpletv' ? '(Solo PagoDirecto)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Montos: Recarga y Cobrado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Monto Recarga (Bs.)
                  </label>
                  <input
                    id="edit-tx-recarga-input"
                    type="number"
                    step="any"
                    value={editForm.montoRecarga}
                    onChange={(e) => setEditForm({ ...editForm, montoRecarga: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    Monto Cobrado (Bs.)
                  </label>
                  <input
                    id="edit-tx-cobrado-input"
                    type="number"
                    step="any"
                    value={editForm.montoCobrado}
                    onChange={(e) => setEditForm({ ...editForm, montoCobrado: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Resumen de ganancia recalculada (Oculto a vendedor) */}
              {!isVendedor && (
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Ganancia estimada con este cobro:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    +{formatBs(Math.max(0, Number(editForm.montoCobrado || 0) - Number(editForm.montoRecarga || 0)))}
                  </span>
                </div>
              )}

              {/* Alerta de error de validación */}
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                isLight ? 'border-slate-100' : 'border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                    isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  id="save-edit-tx-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white transition shadow-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla estilo WPS Office / Excel */}
      <div className={`rounded-xl overflow-hidden border shadow-xs transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b uppercase font-bold text-[11px] tracking-wider ${
              isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}>
              <tr>
                <th
                  onClick={handleToggleSort}
                  className="py-3 px-3 cursor-pointer select-none hover:text-orange-500 transition-colors"
                  title="Haz clic para alternar la secuencia: de abajo hacia arriba o de arriba hacia abajo"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hora</span>
                    <span className="text-[11px] font-black font-mono text-orange-500">
                      {sortOrder === 'desc' ? '⬆' : '⬇'}
                    </span>
                  </div>
                </th>
                <th className="py-3 px-3">Operadora</th>
                <th className="py-3 px-3">Origen</th>
                <th className="py-3 px-3">Cliente / Teléfono</th>
                <th className="py-3 px-3 text-right">Monto Recarga</th>
                <th className="py-3 px-3 text-right">Monto Cobrado</th>
                <th className="py-3 px-2 text-center">Estado</th>
                <th className="py-3 px-3 text-right">Efectivo</th>
                <th className="py-3 px-3 text-right">Punto</th>
                <th className="py-3 px-3 text-right">BioPago</th>
                <th className="py-3 px-3 text-right">Pago Móvil</th>
                {!isVendedor && <th className="py-3 px-3 text-right">Ganancia</th>}
                <th className="py-3 px-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isVendedor ? 12 : 13} className="py-10 text-center font-sans">
                    <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>No hay recargas registradas para este filtro o fecha.</p>
                    <p className="text-xs text-slate-500 mt-1">Usa la pestaña &quot;Cajero Rápido&quot; para registrar nuevas recargas.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const gan = tx.montoCobrado - tx.montoRecarga;
                  const isPagoDirecto = (tx.plataforma || 'payall').toLowerCase() === 'pagodirecto';
                  const isPendiente = tx.estadoPago === 'pendiente';

                  return (
                    <tr
                      key={tx.id}
                      className={`transition group ${
                        isPendiente
                          ? isLight
                            ? 'bg-amber-50/70 hover:bg-amber-100/70'
                            : 'bg-amber-950/20 hover:bg-amber-950/40'
                          : isLight
                          ? 'hover:bg-slate-50'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className={`py-2.5 px-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{tx.hora}</td>
                      <td className={`py-2.5 px-3 font-sans font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                OPERADORAS.find((o) => o.id === tx.operadoraId)?.color || '#94a3b8'
                            }}
                          />
                          <span>{tx.operadoraNombre}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs ${
                            isPagoDirecto
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {isPagoDirecto ? 'PagoDirecto' : 'Payall'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {tx.clienteNombre ? (
                          <div>
                            <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {tx.clienteNombre}
                            </span>
                            <span className={`text-[11px] block font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                              {tx.telefono || '-'}
                            </span>
                          </div>
                        ) : (
                          <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>
                            {tx.telefono || '-'}
                          </span>
                        )}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {formatBs(tx.montoRecarga)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${isLight ? 'text-slate-950 font-black' : 'text-white font-bold'}`}>
                        <div>
                          <span>{formatBs(tx.montoCobrado)}</span>
                          {Number(tx.totalAbonado || 0) > 0 && (
                            <span className="block text-[9px] font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                              Abonado: +{formatBs(tx.totalAbonado)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {isPendiente ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPayPendingTx(tx);
                              setPayPendingMethod(tx.metodo === 'mixto' ? 'efectivo' : (tx.metodo || 'efectivo'));
                              setPayMode('abono');
                              setAbonoMonto('');
                              setAbonoError('');
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs group ${
                              isLight
                                ? 'bg-amber-600 hover:bg-emerald-600 text-white shadow-amber-600/20'
                                : 'bg-amber-600 hover:bg-emerald-600 text-white shadow-amber-900/30'
                            }`}
                            title="Recarga fiada pendiente. Clic para registrar abono o saldar total"
                          >
                            <Clock className="w-3.5 h-3.5 text-white shrink-0" />
                            <span className="group-hover:hidden font-black">Pendiente</span>
                            <span className="hidden group-hover:inline font-black">Cobrar / Abonar</span>
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLight
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            Pagado
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {tx.metodo === 'mixto' && Number(tx.montoEfectivo || 0) > 0 ? (
                          <div>
                            <span>{formatBs(tx.montoEfectivo)}</span>
                            <span className="block text-[9px] font-sans font-medium text-emerald-700 dark:text-emerald-300 opacity-80">efectivo</span>
                          </div>
                        ) : tx.metodo === 'efectivo' ? (
                          formatBs(tx.montoCobrado)
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-sky-600 dark:text-sky-400 font-bold">
                        {tx.metodo === 'mixto' && Number(tx.montoPunto || 0) > 0 ? (
                          <div>
                            <span>{formatBs(tx.montoPunto)}</span>
                            <span className="block text-[9px] font-sans font-medium text-sky-700 dark:text-sky-300 opacity-80">punto</span>
                          </div>
                        ) : tx.metodo === 'punto' ? (
                          formatBs(tx.montoCobrado)
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${isLight ? 'text-amber-900 font-bold' : 'text-amber-400'}`}>
                        {tx.metodo === 'mixto' && Number(tx.montoBiopago || 0) > 0 ? (
                          <div>
                            <span>{formatBs(tx.montoBiopago)}</span>
                            <span className={`block text-[9px] font-sans font-medium ${isLight ? 'text-amber-950 font-bold' : 'text-amber-300'}`}>biopago</span>
                          </div>
                        ) : tx.metodo === 'biopago' ? (
                          formatBs(tx.montoCobrado)
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${isLight ? 'text-violet-900 font-bold' : 'text-violet-400'}`}>
                        {tx.metodo === 'mixto' && Number(tx.montoPagoMovil || 0) > 0 ? (
                          <div>
                            <span>{formatBs(tx.montoPagoMovil)}</span>
                            <span className={`block text-[9px] font-sans font-medium ${isLight ? 'text-violet-950 font-bold' : 'text-violet-300'}`}>p.móvil</span>
                          </div>
                        ) : tx.metodo === 'pagomovil' ? (
                          formatBs(tx.montoCobrado)
                        ) : (
                          '-'
                        )}
                      </td>
                      {!isVendedor && (
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                            +{formatBs(gan)}
                          </span>
                          {tasaBcv > 0 && (
                            <span className={`text-[10px] block font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              ≈ {formatUsd(gan / tasaBcv)}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`edit-tx-${tx.id}-btn`}
                            onClick={() => handleOpenEdit(tx)}
                            title="Editar recarga"
                            className={`p-1 rounded transition cursor-pointer ${
                              isLight
                                ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-tx-${tx.id}-btn`}
                            onClick={() => setDeletingTx(tx)}
                            title="Eliminar recarga"
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
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
            {filteredTransactions.length > 0 && (
              <tfoot className={`border-t-2 font-bold font-mono ${
                isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <tr>
                  <td colSpan={4} className={`py-3 px-3 font-sans uppercase text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    TOTALES ({filteredTransactions.length})
                  </td>
                  <td className="py-3 px-3 text-right">
                    {formatBs(totals.montoRecarga)}
                  </td>
                  <td className="py-3 px-3 text-right font-black">
                    {formatBs(totals.montoCobrado)}
                  </td>
                  <td className="py-3 px-2 text-center text-xs">
                    {pendientesCount > 0 ? (
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isLight
                          ? 'bg-amber-200 text-amber-950 border border-amber-300 font-black'
                          : 'bg-amber-500/30 text-amber-200 border border-amber-500/40 font-black'
                      }`}>
                        {pendientesCount} fiado{pendientesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className={`text-[11px] font-black uppercase ${
                        isLight ? 'text-emerald-700' : 'text-emerald-400'
                      }`}>
                        Al día
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatBs(totals.efectivo)}
                  </td>
                  <td className="py-3 px-3 text-right text-sky-600 dark:text-sky-400 font-bold">
                    {formatBs(totals.punto)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${
                    isLight ? 'text-amber-900 font-extrabold' : 'text-amber-300'
                  }`}>
                    {formatBs(totals.biopago)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${
                    isLight ? 'text-violet-900 font-extrabold' : 'text-violet-300'
                  }`}>
                    {formatBs(totals.pagoMovil)}
                  </td>
                  {!isVendedor && (
                    <td className="py-3 px-3 text-right">
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black block font-mono">
                        +{formatBs(totals.ganancia)}
                      </span>
                      {tasaBcv > 0 && (
                        <span className={`text-[11px] block font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          ≈ {formatUsd(totals.ganancia / tasaBcv)}
                        </span>
                      )}
                    </td>
                  )}
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Rápido para Cobrar Recarga Fiada (Pendiente -> Pagado) */}
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
                  <Clock className="w-3.5 h-3.5" />
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
                    Operadora / Teléfono
                  </span>
                  <span className={`font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {payPendingTx.operadoraNombre} • {payPendingTx.telefono || 'Sin número'}
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

              {/* Selección del método con el que está pagando hoy */}
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
                  id="confirm-pay-pending-btn"
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

      {/* Modal de Reporte Imprimible / PDF */}
      <ReportPdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        type="diario"
        selectedDate={selectedDate}
        transactions={filteredTransactions}
        totals={totals}
        tasaBcv={tasaBcv}
        alquilerRecords={alquilerRecords}
        theme={theme}
      />
    </div>
  );
}
