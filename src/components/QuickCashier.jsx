'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { OPERADORAS, METODOS_PAGO, OPERADORA_THEMES } from '@/lib/constants';
import { calculateMontoCobrar, formatBs, formatUsd, validateMontoOperadora } from '@/lib/calculator';
import {
  Banknote,
  CreditCard,
  Fingerprint,
  Phone,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Info,
  Split,
  User,
  Clock,
  Smartphone
} from 'lucide-react';

export default function QuickCashier({
  config,
  tarifas,
  selectedDate,
  onAddTransaction,
  recentTransactions = [],
  onDeleteTransaction,
  tasaBcv = 0,
  theme = 'dark'
}) {
  const isLight = theme === 'light';
  const [selectedOperadoraId, setSelectedOperadoraId] = useState('digitel');
  const [montoRecarga, setMontoRecarga] = useState(null);
  const [customMonto, setCustomMonto] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState('efectivo'); // 'efectivo' | 'punto' | 'biopago' | 'mixto'
  const [montoMixtoEfectivo, setMontoMixtoEfectivo] = useState('');
  const [montoMixtoDigital, setMontoMixtoDigital] = useState('');
  const [metodoMixtoDigital, setMetodoMixtoDigital] = useState('punto'); // 'punto' | 'biopago'
  const [estadoPago, setEstadoPago] = useState('pagado'); // 'pagado' | 'pendiente'
  const [clienteNombre, setClienteNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [plataforma, setPlataforma] = useState('payall'); // 'payall' | 'pagodirecto'
  const [justRegistered, setJustRegistered] = useState(null);
  const [platformNotice, setPlatformNotice] = useState('');

  // Función de reinicio completo del formulario
  const handleResetForm = () => {
    setMontoRecarga(null);
    setCustomMonto('');
    setIsCustomMode(false);
    setSelectedMetodo('efectivo');
    setMontoMixtoEfectivo('');
    setMontoMixtoDigital('');
    setEstadoPago('pagado');
    setClienteNombre('');
    setTelefono('');
  };

  const currentOperadora = useMemo(() => {
    return OPERADORAS.find(op => op.id === selectedOperadoraId) || OPERADORAS[0];
  }, [selectedOperadoraId]);

  const currentTheme = useMemo(() => {
    return OPERADORA_THEMES[selectedOperadoraId] || OPERADORA_THEMES.digitel;
  }, [selectedOperadoraId]);

  // Función de parseo robusto para montos enteros o con decimales (soporta coma ',' y punto '.')
  const parseMontoDecimal = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = String(val).replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Al cambiar de operadora, resetear el monto si el que estaba seleccionado no es válido en la nueva operadora
  useEffect(() => {
    if (currentOperadora) {
      if (!currentOperadora.esLibre && montoRecarga !== null) {
        if (!currentOperadora.montosDefault?.includes(montoRecarga)) {
          setMontoRecarga(null);
        }
      }
    }
  }, [selectedOperadoraId, currentOperadora]);

  // Monto final activo a procesar
  const activeMontoRecarga = (currentOperadora.esLibre || isCustomMode)
    ? parseMontoDecimal(customMonto)
    : Number(montoRecarga || 0);

  // Validación estricta del monto según la operadora y sus múltiplos
  const montoValidation = useMemo(() => {
    return validateMontoOperadora(activeMontoRecarga, currentOperadora);
  }, [activeMontoRecarga, currentOperadora]);

  const isValidMonto = montoValidation.isValid;
  const montoError = montoValidation.error;
  const sugeridoMonto = montoValidation.sugerido;

  // Monto a cobrar calculado con reglas de negocio y redondeo
  const montoCobrado = useMemo(() => {
    return calculateMontoCobrar(
      activeMontoRecarga,
      config,
      selectedOperadoraId,
      tarifas
    );
  }, [activeMontoRecarga, config, selectedOperadoraId, tarifas]);

  // Ganancia estimada de esta transacción individual
  const ganancia = Math.max(0, montoCobrado - activeMontoRecarga);
  const margenPct = activeMontoRecarga > 0
    ? ((ganancia / activeMontoRecarga) * 100).toFixed(1)
    : '0';

  // Manejo de cambio en campo de efectivo en pago mixto
  const handleMixtoEfectivoChange = (val) => {
    setMontoMixtoEfectivo(val);
    const efec = parseMontoDecimal(val);
    const cob = montoCobrado || 0;
    const diff = Math.max(0, Math.round((cob - efec) * 100) / 100);
    setMontoMixtoDigital(diff > 0 ? String(diff) : '0');
  };

  const handleMixtoDigitalChange = (val) => {
    setMontoMixtoDigital(val);
  };

  // Sincronizar montos de pago mixto cuando cambia el total a cobrar
  useEffect(() => {
    if (selectedMetodo === 'mixto' && montoCobrado > 0) {
      if (!montoMixtoEfectivo && !montoMixtoDigital) {
        const mitad = Math.round((montoCobrado / 2) * 100) / 100;
        setMontoMixtoEfectivo(String(mitad));
        setMontoMixtoDigital(String(Math.round((montoCobrado - mitad) * 100) / 100));
      } else {
        const efec = parseMontoDecimal(montoMixtoEfectivo);
        const rest = Math.max(0, Math.round((montoCobrado - efec) * 100) / 100);
        setMontoMixtoDigital(String(rest));
      }
    }
  }, [montoCobrado, selectedMetodo]);

  const parsedEfectivo = parseMontoDecimal(montoMixtoEfectivo);
  const parsedDigital = parseMontoDecimal(montoMixtoDigital);
  const isMixtoValido = selectedMetodo !== 'mixto' || (
    parsedEfectivo >= 0 &&
    parsedDigital >= 0 &&
    (parsedEfectivo > 0 || parsedDigital > 0) &&
    Math.abs((parsedEfectivo + parsedDigital) - montoCobrado) < 0.05
  );

  // Sonido suave de confirmación al registrar (Web Audio API)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch {
      // Audio silencioso
    }
  };

  const handleSelectOperadora = (opId) => {
    setSelectedOperadoraId(opId);
    // Reiniciar selección de monto para que la cajera escoja expresamente
    setMontoRecarga(null);
    setCustomMonto('');
    const opObj = OPERADORAS.find(o => o.id === opId);
    if (opObj?.esLibre) {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
    }

    // Simple TV solo está disponible en PagoDirecto (Payall no lo tiene)
    if (opId === 'simpletv') {
      setPlataforma('pagodirecto');
      setPlatformNotice('Simple TV procesa exclusivamente por PagoDirecto (Payall no lo soporta).');
      setTimeout(() => setPlatformNotice(''), 4000);
    }
  };

  const handleSelectPlatform = (plat) => {
    if (plat === 'payall' && selectedOperadoraId === 'simpletv') {
      setSelectedOperadoraId('digitel');
      setPlatformNotice('Payall no tiene Simple TV. Se cambió automáticamente a Digitel.');
      setTimeout(() => setPlatformNotice(''), 4000);
    }
    setPlataforma(plat);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (activeMontoRecarga <= 0 || montoCobrado <= 0 || !isValidMonto) return;
    if (selectedMetodo === 'mixto' && !isMixtoValido) return;

    let finalMontoEfectivo = 0;
    let finalMontoPunto = 0;
    let finalMontoBiopago = 0;
    let finalMontoPagoMovil = 0;

    if (selectedMetodo === 'efectivo') {
      finalMontoEfectivo = montoCobrado;
    } else if (selectedMetodo === 'punto') {
      finalMontoPunto = montoCobrado;
    } else if (selectedMetodo === 'biopago') {
      finalMontoBiopago = montoCobrado;
    } else if (selectedMetodo === 'pagomovil') {
      finalMontoPagoMovil = montoCobrado;
    } else if (selectedMetodo === 'mixto') {
      finalMontoEfectivo = parsedEfectivo;
      if (metodoMixtoDigital === 'punto') {
        finalMontoPunto = parsedDigital;
      } else if (metodoMixtoDigital === 'biopago') {
        finalMontoBiopago = parsedDigital;
      } else if (metodoMixtoDigital === 'pagomovil') {
        finalMontoPagoMovil = parsedDigital;
      }
    }

    const finalPlataforma = selectedOperadoraId === 'simpletv' ? 'pagodirecto' : plataforma;

    if (estadoPago === 'pendiente' && !clienteNombre.trim()) {
      setPlatformNotice('Por favor indica el nombre de la persona que fía para tenerla registrada.');
      setTimeout(() => setPlatformNotice(''), 4500);
      return;
    }

    const tx = onAddTransaction({
      operadoraId: selectedOperadoraId,
      operadoraNombre: currentOperadora.nombre,
      montoRecarga: activeMontoRecarga,
      montoCobrado: montoCobrado,
      metodo: selectedMetodo,
      montoEfectivo: finalMontoEfectivo,
      montoPunto: finalMontoPunto,
      montoBiopago: finalMontoBiopago,
      montoPagoMovil: finalMontoPagoMovil,
      estadoPago: estadoPago, // 'pagado' | 'pendiente'
      clienteNombre: clienteNombre.trim(),
      telefono: telefono.trim(),
      plataforma: finalPlataforma,
      fecha: selectedDate
    });

    playChime();
    setJustRegistered(tx);
    // Reiniciar formulario para evitar confusiones y dobles recargas accidentales
    handleResetForm();

    setTimeout(() => {
      setJustRegistered(null);
    }, 4000);
  };

  return (
    <div className="w-full space-y-4">
      {/* Aviso informativo de plataforma */}
      {platformNotice && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between border animate-in fade-in duration-150 ${
          isLight
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-amber-950/40 border-amber-800 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{platformNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPlatformNotice('')}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/10 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner de confirmación rápida */}
      {justRegistered && (
        <div className={`px-4 py-3 rounded-xl flex items-center justify-between gap-3 border animate-in fade-in duration-200 ${
          isLight
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Recarga guardada:</span> {justRegistered.operadoraNombre} de{' '}
              <span className="font-semibold">{formatBs(justRegistered.montoRecarga)}</span> (Cobro:{' '}
              <span className="font-semibold">{formatBs(justRegistered.montoCobrado)}</span>) • {justRegistered.metodo} ({justRegistered.plataforma})
            </div>
          </div>
          <button
            id="undo-last-tx-btn"
            onClick={() => {
              onDeleteTransaction(justRegistered.id);
              setJustRegistered(null);
            }}
            className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-semibold cursor-pointer ${
              isLight
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Deshacer
          </button>
        </div>
      )}

      {/* Main Cashier Card */}
      <div className={`rounded-2xl p-5 sm:p-6 border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        {/* Top Header: Operadora & Plataforma Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center transition-colors ${currentTheme.stepBadge}`}>
              1
            </span>
            <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Operadora y Plataforma
            </h2>
          </div>

          {/* Selector de Plataforma Principal: Payall vs PagoDirecto */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <span className={`text-[11px] font-medium px-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Origen:
            </span>
            <button
              id="platform-payall-btn"
              type="button"
              onClick={() => handleSelectPlatform('payall')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                plataforma === 'payall'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Payall
            </button>
            <button
              id="platform-pagodirecto-btn"
              type="button"
              onClick={() => handleSelectPlatform('pagodirecto')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                plataforma === 'pagodirecto'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              PagoDirecto
            </button>
          </div>
        </div>

        {/* STEP 1: OPERADORA GRID */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {OPERADORAS.map((op) => {
            const isSelected = op.id === selectedOperadoraId;
            const isSimpleTv = op.id === 'simpletv';
            const opTheme = OPERADORA_THEMES[op.id] || OPERADORA_THEMES.digitel;

            return (
              <button
                key={op.id}
                id={`operator-${op.id}-btn`}
                type="button"
                onClick={() => handleSelectOperadora(op.id)}
                className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition border cursor-pointer ${
                  isSelected
                    ? isLight
                      ? `${opTheme.bgSelectedLight} ${opTheme.borderSelected}`
                      : `${opTheme.bgSelectedDark} ${opTheme.borderSelected}`
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full mb-1.5 shadow-xs"
                  style={{ backgroundColor: op.color }}
                />
                <span className="text-xs sm:text-sm font-bold truncate max-w-full">
                  {op.nombre}
                </span>
                <span className="text-[10px] opacity-80 truncate max-w-full">
                  {isSimpleTv ? (
                    <span className="text-purple-600 dark:text-purple-400 font-bold">20% • PagoDirecto</span>
                  ) : op.categoria === 'servicios' ? (
                    <span className="text-teal-600 dark:text-teal-400 font-bold">20% • Servicio</span>
                  ) : (
                    '15% • Móvil'
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP 2: MONTO DE RECARGA */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center transition-colors ${currentTheme.stepBadge}`}>
                2
              </span>
              <div>
                <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Monto en {currentOperadora.nombre}
                </h2>
                {currentOperadora.reglaTexto && (
                  <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {currentOperadora.reglaTexto}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {(activeMontoRecarga > 0 || clienteNombre || telefono || selectedMetodo !== 'efectivo' || estadoPago !== 'pagado') && (
                <button
                  id="reset-form-btn"
                  type="button"
                  onClick={handleResetForm}
                  className={`text-xs flex items-center gap-1 font-semibold transition px-2.5 py-1 rounded-lg border cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Reiniciar selección y campos del formulario"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
              {!currentOperadora.esLibre && (
                <button
                  id="toggle-custom-amount-btn"
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className={`text-xs hover:underline font-semibold cursor-pointer transition-colors ${currentTheme.accentText}`}
                >
                  {isCustomMode ? 'Ver montos predefinidos' : 'Otro monto manual'}
                </button>
              )}
            </div>
          </div>

          {/* VISTA 1: OPERADORA LIBRE (Simple TV, Inter, Cantv con soporte de decimales y 20% de comisión) */}
          {currentOperadora.esLibre ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                isLight ? 'bg-purple-50/80 border-purple-200 text-purple-950' : 'bg-purple-950/30 border-purple-800 text-purple-200'
              }`}>
                <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{currentOperadora.nombre} (Comisión 20%):</span> Acepta cualquier monto a partir de{' '}
                  <span className="font-bold underline">{currentOperadora.minMonto || 500} Bs.</span> Aplica automáticamente el 20% de comisión. Puedes colocar los decimales exactos de la factura o deuda (ej: <span className="font-mono font-bold">575,50</span> ó <span className="font-mono font-bold">986.36</span> Bs.).
                </div>
              </div>

              {/* Input libre de monto con soporte de decimales */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    id="custom-amount-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="Monto libre con decimales (ej: 575,50 ó 986.36)"
                    value={customMonto}
                    onChange={(e) => setCustomMonto(e.target.value)}
                    className={`w-full rounded-xl pl-4 pr-12 py-3 text-base sm:text-lg font-mono font-bold border focus:outline-none transition ${
                      !isValidMonto && activeMontoRecarga > 0
                        ? isLight
                          ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400'
                          : 'bg-rose-950/40 border-rose-700 text-rose-200 ring-1 ring-rose-600'
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-orange-500'
                        : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-orange-500'
                    }`}
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold font-mono">
                    Bs.
                  </span>
                </div>
              </div>

              {/* Alerta de validación en caso de error */}
              {!isValidMonto && activeMontoRecarga > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚠️</span>
                    <span>{montoError}</span>
                  </div>
                  {sugeridoMonto && sugeridoMonto !== activeMontoRecarga && (
                    <button
                      type="button"
                      onClick={() => setCustomMonto(String(sugeridoMonto))}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Corregir a {sugeridoMonto} Bs.
                    </button>
                  )}
                </div>
              )}

              {/* Botones de sugerencias rápidas para montos redondos comunes con precio al 20% */}
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  O selecciona un monto sugerido rápido (Cobro al 20%):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentOperadora.montosDefault.map((monto) => {
                    const isSelected = parseMontoDecimal(customMonto) === monto;
                    const cobroCalculado = calculateMontoCobrar(
                      monto,
                      config,
                      selectedOperadoraId,
                      tarifas
                    );
                    return (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => setCustomMonto(String(monto))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{monto} Bs.</span>
                        <span className={`text-[10px] ${isSelected ? 'text-purple-200 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}`}>
                          ({cobroCalculado} Bs.)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : !isCustomMode ? (
            /* VISTA 2: PRESETS TELEFONÍA (Digitel 500 en 500, Movistar 400 en 400, Movilnet 450 y pasos de 150) */
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {currentOperadora.montosDefault.map((monto) => {
                const isSelected = montoRecarga === monto;
                const cobroPreview = calculateMontoCobrar(
                  monto,
                  config,
                  selectedOperadoraId,
                  tarifas
                );
                return (
                  <button
                    key={monto}
                    id={`amount-preset-${monto}-btn`}
                    type="button"
                    onClick={() => setMontoRecarga(monto)}
                    className={`p-2.5 rounded-xl text-center border transition cursor-pointer ${
                      isSelected
                        ? currentTheme.presetSelected
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className={`text-sm sm:text-base font-black font-mono ${
                      isSelected ? 'text-white' : isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {monto} Bs.
                    </div>
                    <div className={`text-[10px] font-semibold font-mono ${
                      isSelected
                        ? currentTheme.presetSubtitleSelected
                        : isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Cobrar: {cobroPreview} Bs.
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* VISTA 3: MONTO MANUAL PARA TELEFONÍA CON VALIDACIÓN ESTRICTA */
            <div className="space-y-2.5">
              <div className="relative flex-1">
                <input
                  id="custom-amount-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={`Monto múltiplo de ${currentOperadora.paso} (ej: ${currentOperadora.minMonto})`}
                  value={customMonto}
                  onChange={(e) => setCustomMonto(e.target.value)}
                  className={`w-full rounded-xl pl-4 pr-12 py-3 text-base sm:text-lg font-mono font-bold border focus:outline-none transition ${
                    !isValidMonto && activeMontoRecarga > 0
                      ? isLight
                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400'
                        : 'bg-rose-950/40 border-rose-700 text-rose-200 ring-1 ring-rose-600'
                      : isValidMonto && activeMontoRecarga > 0
                      ? isLight
                        ? 'bg-emerald-50/50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400'
                        : 'bg-emerald-950/20 border-emerald-700 text-emerald-100 ring-1 ring-emerald-600'
                      : isLight
                      ? `bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-1 ${currentTheme.ringFocus}`
                      : `bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:ring-1 ${currentTheme.ringFocus}`
                  }`}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold font-mono">
                  Bs.
                </span>
              </div>

              {/* Mensaje de error o sugerencia de corrección */}
              {!isValidMonto && activeMontoRecarga > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚠️</span>
                    <span>{montoError}</span>
                  </div>
                  {sugeridoMonto && sugeridoMonto !== activeMontoRecarga && (
                    <button
                      type="button"
                      onClick={() => setCustomMonto(String(sugeridoMonto))}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm shrink-0 self-start sm:self-auto"
                    >
                      Corregir a {sugeridoMonto} Bs.
                    </button>
                  )}
                </div>
              )}

              {/* Mensaje de éxito si el monto es múltiplo válido */}
              {isValidMonto && activeMontoRecarga > 0 && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span>✓</span> Monto válido: {activeMontoRecarga} Bs. (Múltiplo permitido para {currentOperadora.nombre})
                </p>
              )}

              {/* Nota informativa en reposo */}
              {activeMontoRecarga === 0 && (
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Recuerda que {currentOperadora.nombre} opera en pasos de {currentOperadora.paso} Bs (mínimo {currentOperadora.minMonto} Bs).
                </p>
              )}
            </div>
          )}
        </div>

        {/* STEP 3: MÉTODO DE PAGO */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center transition-colors ${currentTheme.stepBadge}`}>
              3
            </span>
            <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Medio de Cobro
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {METODOS_PAGO.map((metodo) => {
              const isSelected = selectedMetodo === metodo.id;
              const IconComponent =
                metodo.id === 'efectivo'
                  ? Banknote
                  : metodo.id === 'punto'
                  ? CreditCard
                  : metodo.id === 'biopago'
                  ? Fingerprint
                  : metodo.id === 'pagomovil'
                  ? Smartphone
                  : Split;

              return (
                <button
                  key={metodo.id}
                  id={`method-${metodo.id}-btn`}
                  type="button"
                  onClick={() => setSelectedMetodo(metodo.id)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition border cursor-pointer ${
                    isSelected
                      ? isLight
                        ? `${currentTheme.bgSelectedLight} ${currentTheme.borderSelected}`
                        : `${currentTheme.bgSelectedDark} ${currentTheme.borderSelected}`
                      : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mb-1" />
                  <span className="text-xs sm:text-sm font-bold">
                    {metodo.nombre}
                  </span>
                  <span className="text-[10px] opacity-75">
                    {metodo.id === 'efectivo'
                      ? 'En efectivo'
                      : metodo.id === 'punto'
                      ? 'Tarjeta'
                      : metodo.id === 'biopago'
                      ? 'Huella'
                      : metodo.id === 'pagomovil'
                      ? 'Transferencia'
                      : 'Dividido'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* PANEL INTERACTIVO DE PAGO MIXTO */}
          {selectedMetodo === 'mixto' && (
            <div className={`mt-3 p-3.5 sm:p-4 rounded-xl border transition-colors shadow-xs ${
              isLight ? 'bg-purple-50/70 border-purple-200 text-slate-800' : 'bg-purple-950/20 border-purple-800/60 text-purple-100'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  <Split className="w-4 h-4" />
                  <span>Desglose de Pago Mixto</span>
                </div>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Total a Cobrar: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatBs(montoCobrado)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PARTE EN EFECTIVO */}
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    💵 Parte en Efectivo (Bs.)
                  </label>
                  <input
                    id="mixto-efectivo-input"
                    type="number"
                    step="any"
                    value={montoMixtoEfectivo}
                    onChange={(e) => handleMixtoEfectivoChange(e.target.value)}
                    placeholder="Ej: 200"
                    className={`w-full py-2 px-3 rounded-lg font-mono font-bold text-sm border focus:outline-none transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-purple-400'
                    }`}
                  />
                </div>

                {/* PARTE DIGITAL: PUNTO, BIOPAGO O PAGO MÓVIL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {metodoMixtoDigital === 'punto' ? '💳 Por Punto POS (Bs.)' : metodoMixtoDigital === 'biopago' ? '👆 Por BioPago (Bs.)' : '📱 Por Pago Móvil (Bs.)'}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMetodoMixtoDigital('punto')}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          metodoMixtoDigital === 'punto'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Punto
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodoMixtoDigital('biopago')}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          metodoMixtoDigital === 'biopago'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        BioPago
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodoMixtoDigital('pagomovil')}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          metodoMixtoDigital === 'pagomovil'
                            ? 'bg-violet-600 text-white shadow-xs'
                            : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Pago Móvil
                      </button>
                    </div>
                  </div>
                  <input
                    id="mixto-digital-input"
                    type="number"
                    step="any"
                    value={montoMixtoDigital}
                    onChange={(e) => handleMixtoDigitalChange(e.target.value)}
                    placeholder="Restante"
                    className={`w-full py-2 px-3 rounded-lg font-mono font-bold text-sm border focus:outline-none transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-purple-400'
                    }`}
                  />
                </div>
              </div>

              {/* BOTONES RÁPIDOS Y VALIDACIÓN */}
              <div className="mt-2.5 pt-2 border-t border-purple-200/60 dark:border-purple-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className={isMixtoValido ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                  {isMixtoValido
                    ? `✓ Cuadra: ${formatBs(parsedEfectivo)} Efec + ${formatBs(parsedDigital)} ${metodoMixtoDigital === 'punto' ? 'Punto' : metodoMixtoDigital === 'biopago' ? 'Bio' : 'P.Móvil'} = ${formatBs(montoCobrado)}`
                    : `⚠ Diferencia: ${(montoCobrado - (parsedEfectivo + parsedDigital)).toFixed(2)} Bs (debe dar exactamente ${formatBs(montoCobrado)})`
                  }
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const mitad = Math.round((montoCobrado / 2) * 100) / 100;
                    setMontoMixtoEfectivo(String(mitad));
                    setMontoMixtoDigital(String(Math.round((montoCobrado - mitad) * 100) / 100));
                  }}
                  className={`text-[11px] font-sans font-semibold underline cursor-pointer ${
                    isLight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  Dividir 50% / 50%
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONDICIÓN DE COBRO Y DATOS DEL CLIENTE (PAGADO VS FIADO/PENDIENTE) */}
        <div className={`mb-5 p-3.5 sm:p-4 rounded-xl border transition-colors shadow-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center ${currentTheme.stepBadge}`}>
                4
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Cliente y Estado de Cobro
              </span>
            </div>

            {/* Selector: Pagado vs Fiado / Pendiente */}
            <div className={`flex items-center p-0.5 rounded-lg border text-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setEstadoPago('pagado')}
                className={`px-3 py-1 rounded-md font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  estadoPago === 'pagado'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pagado al momento</span>
              </button>
              <button
                type="button"
                onClick={() => setEstadoPago('pendiente')}
                className={`px-3 py-1 rounded-md font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  estadoPago === 'pendiente'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:opacity-80'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Fiado / Pendiente</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* NOMBRE DEL CLIENTE */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="customer-name-input"
                type="text"
                placeholder={estadoPago === 'pendiente' ? 'Nombre de la persona (Ej: Juan mecánico, Doña Rosa)' : 'Nombre del cliente (opcional)'}
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className={`w-full rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm border focus:outline-none transition ${
                  estadoPago === 'pendiente' && !clienteNombre.trim()
                    ? isLight
                      ? 'border-amber-500 bg-amber-50 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-amber-500'
                      : 'border-amber-500 bg-amber-950/30 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500'
                    : isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                    : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-400'
                }`}
              />
            </div>

            {/* TELÉFONO O REFERENCIA */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="customer-phone-input"
                type="tel"
                placeholder="Número de teléfono o contrato (opcional)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm border focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                    : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-400'
                }`}
              />
            </div>
          </div>

          {estadoPago === 'pendiente' && (
            <div className={`mt-2.5 flex items-center gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
              isLight
                ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-medium shadow-xs'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-100 font-medium'
            }`}>
              <div className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'bg-amber-300 text-amber-950' : 'bg-amber-500/20 text-amber-300'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <span className={isLight ? 'text-amber-950 font-semibold' : 'text-amber-100 font-medium'}>
                <strong className={`font-black ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>Aviso de Fiado:</strong> Se registrará como deuda pendiente. En la tabla podrás ver quién debe y cambiarlo a verde con un clic al cobrarle.
              </span>
            </div>
          )}
        </div>

        {/* RESUMEN DE COBRO */}
        <div className={`rounded-xl p-4 mb-4 border transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Recarga solicitada:</span>
              <div className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                {activeMontoRecarga > 0 ? formatBs(activeMontoRecarga) : '—'}
              </div>
              <span className={`text-[10px] font-bold uppercase ${
                selectedOperadoraId === 'simpletv' || plataforma === 'pagodirecto'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                Vía {selectedOperadoraId === 'simpletv' ? 'PagoDirecto' : (plataforma === 'pagodirecto' ? 'PagoDirecto' : 'Payall')}
              </span>
            </div>

            <div className="hidden sm:block text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className={`rounded-lg px-4 py-2 border ${
              isLight
                ? 'bg-white border-slate-300'
                : 'bg-slate-900 border-slate-700'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider block transition-colors ${currentTheme.accentText}`}>
                Total a Cobrar:
              </span>
              <div className={`text-2xl sm:text-3xl font-black font-mono ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {activeMontoRecarga > 0 ? formatBs(montoCobrado) : '0,00 Bs.'}
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ganancia bruta:</span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {activeMontoRecarga > 0 ? `+${formatBs(ganancia)} (${margenPct}%)` : '+0,00 Bs. (0.0%)'}
              </div>
              {tasaBcv > 0 && activeMontoRecarga > 0 && (
                <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ≈ {formatUsd(ganancia / tasaBcv)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN REGISTRAR VENTA */}
        <button
          id="submit-recharge-btn"
          type="button"
          onClick={handleSubmit}
          disabled={activeMontoRecarga <= 0 || montoCobrado <= 0 || !isValidMonto || (selectedMetodo === 'mixto' && !isMixtoValido)}
          className={`w-full py-3.5 rounded-xl font-bold text-base tracking-wide transition cursor-pointer ${
            activeMontoRecarga > 0 && montoCobrado > 0 && isValidMonto && (selectedMetodo !== 'mixto' || isMixtoValido)
              ? `${currentTheme.btnPrimary} active:scale-[0.99]`
              : !isValidMonto && activeMontoRecarga > 0
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 cursor-not-allowed'
              : (selectedMetodo === 'mixto' && !isMixtoValido)
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 cursor-not-allowed'
              : isLight
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          {activeMontoRecarga <= 0
            ? 'Selecciona un monto para recargar'
            : !isValidMonto && activeMontoRecarga > 0
            ? (montoError || `Monto no permitido para ${currentOperadora.nombre}`)
            : (selectedMetodo === 'mixto' && !isMixtoValido)
            ? `Ajusta el Pago Mixto para que sume ${formatBs(montoCobrado)}`
            : `Registrar Recarga · ${formatBs(montoCobrado)}`}
        </button>
      </div>
    </div>
  );
}
