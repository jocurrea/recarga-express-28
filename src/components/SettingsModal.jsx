'use client';

import React, { useState } from 'react';
import { OPERADORAS } from '@/lib/constants';
import { X, Trash2, Plus, Lock, KeyRound, ShieldCheck, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { formatBs } from '@/lib/calculator';
import { getSecurityPin, saveSecurityPin, verifySecurityPin } from '@/lib/storage';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  tarifas,
  onSaveTarifas,
  theme = 'dark'
}) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState('reglas'); // 'reglas' | 'tarifas' | 'nube'
  const [formData, setFormData] = useState({ ...config });
  const [localTarifas, setLocalTarifas] = useState([...tarifas]);

  // Form para nueva tarifa personalizada
  const [newTarifaOp, setNewTarifaOp] = useState('digitel');
  const [newTarifaRecarga, setNewTarifaRecarga] = useState('');
  const [newTarifaCobro, setNewTarifaCobro] = useState('');

  // Estado para gestión de PIN
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState({ type: '', text: '' });
  const [showCurrentPin, setShowCurrentPin] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(formData);
    onSaveTarifas(localTarifas);
    onClose();
  };

  const handleAddTarifa = (e) => {
    e.preventDefault();
    if (!newTarifaRecarga || !newTarifaCobro) return;

    const item = {
      id: 'custom-' + Date.now(),
      operadoraId: newTarifaOp,
      montoRecarga: Number(newTarifaRecarga),
      montoCobrar: Number(newTarifaCobro)
    };

    setLocalTarifas([...localTarifas, item]);
    setNewTarifaRecarga('');
    setNewTarifaCobro('');
  };

  const handleDeleteTarifa = (id) => {
    setLocalTarifas(localTarifas.filter(t => t.id !== id));
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    setPinFeedback({ type: '', text: '' });

    if (!verifySecurityPin(currentPinInput)) {
      setPinFeedback({ type: 'error', text: 'El PIN actual no es correcto' });
      return;
    }

    const cleanNew = String(newPinInput || '').trim();
    if (!/^\d{4,8}$/.test(cleanNew)) {
      setPinFeedback({ type: 'error', text: 'El nuevo PIN debe tener entre 4 y 8 números' });
      return;
    }

    if (cleanNew !== String(confirmPinInput || '').trim()) {
      setPinFeedback({ type: 'error', text: 'El nuevo PIN y su confirmación no coinciden' });
      return;
    }

    const res = saveSecurityPin(cleanNew);
    if (res.success) {
      setPinFeedback({ type: 'success', text: '✓ ¡PIN actualizado con éxito!' });
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => {
        setPinFeedback({ type: '', text: '' });
      }, 4000);
    } else {
      setPinFeedback({ type: 'error', text: res.error || 'Error al guardar el PIN' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0f172a]'
        }`}>
          <div>
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Configuración del Negocio
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Comisiones, costos bancarios y tabla de tarifas fijas
            </p>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b px-4 sm:px-6 text-xs sm:text-sm font-semibold ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'
        }`}>
          <button
            id="settings-tab-rules-btn"
            onClick={() => setActiveTab('reglas')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'reglas'
                ? 'border-orange-500 text-orange-600 font-bold'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Reglas y Comisiones
          </button>
          <button
            id="settings-tab-tariffs-btn"
            onClick={() => setActiveTab('tarifas')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'tarifas'
                ? 'border-orange-500 text-orange-600 font-bold'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Tabla de Tarifas Fijas ({localTarifas.length})
          </button>
          <button
            id="settings-tab-cloud-btn"
            onClick={() => setActiveTab('nube')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'nube'
                ? 'border-orange-500 text-orange-600 font-bold'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Nube / Respaldo
          </button>
          <button
            id="settings-tab-security-btn"
            onClick={() => setActiveTab('seguridad')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'seguridad'
                ? 'border-orange-500 text-orange-600 font-bold'
                : isLight
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Seguridad & PIN</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'reglas' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Comisión Base Telefonía */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <label className={`block text-xs font-bold uppercase mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Comisión Telefonía (%)
                </label>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Digitel, Movistar y Movilnet (15%)
                </p>
                <div className="relative">
                  <input
                    id="input-comision-pct"
                    type="number"
                    step="0.5"
                    value={formData.comisionPorcentaje ?? 15}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comisionPorcentaje: Number(e.target.value)
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* Comisión Servicios: SimpleTV, CANTV, Inter (20%) */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/30 border-purple-800/60'
              }`}>
                <label className={`block text-xs font-bold uppercase mb-1 ${
                  isLight ? 'text-purple-950' : 'text-purple-300'
                }`}>
                  Comisión Servicios (20%)
                </label>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                  Simple TV, CANTV e Inter (20%)
                </p>
                <div className="relative">
                  <input
                    id="input-comision-servicios-pct"
                    type="number"
                    step="0.5"
                    value={formData.comisionServiciosPorcentaje ?? 20}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comisionServiciosPorcentaje: Number(e.target.value)
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      isLight
                        ? 'bg-white border-purple-300 text-purple-950'
                        : 'bg-slate-950 border-purple-700 text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* Redondeo */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <label className={`block text-xs font-bold uppercase mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Múltiplo de Redondeo (Bs.)
                </label>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Redondear cobro a múltiplos (ej: 10 Bs.)
                </p>
                <div className="relative">
                  <input
                    id="input-redondeo-multiplo"
                    type="number"
                    step="5"
                    value={formData.redondeoMultiplo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redondeoMultiplo: Number(e.target.value)
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    Bs.
                  </span>
                </div>
              </div>

              {/* Comisión Bancaria Punto POS (0.75%) */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <label className={`block text-xs font-bold uppercase mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Comisión Banco Punto POS (%)
                </label>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Porcentaje que retiene el banco al pasar tarjeta (0.75%)
                </p>
                <div className="relative">
                  <input
                    id="input-comision-punto-pct"
                    type="number"
                    step="0.05"
                    value={formData.comisionPuntoPorcentaje ?? 0.75}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comisionPuntoPorcentaje: Number(e.target.value)
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* Comisión BioPago */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <label className={`block text-xs font-bold uppercase mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Descuento BioPago (%)
                </label>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Comisión bancaria retenida por huella digital (2.0%)
                </p>
                <div className="relative">
                  <input
                    id="input-biopago-pct"
                    type="number"
                    step="0.1"
                    value={formData.biopagoPorcentaje}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        biopagoPorcentaje: Number(e.target.value)
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* Alquiler Diario POS */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <label className={`block text-xs font-bold uppercase mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Alquiler Fijo Diario del Punto ($ USD)
                </label>
                <p className={`text-[11px] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Costo fijado por el banco (ej: $1.777 al día a tasa BCV)
                </p>
                <div className="relative mb-2">
                  <input
                    id="input-alquiler-punto"
                    type="number"
                    step="0.001"
                    value={formData.alquilerPuntoUsd}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alquilerPuntoUsd: Number(e.target.value)
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    USD
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    id="checkbox-deducir-punto"
                    type="checkbox"
                    checked={Boolean(formData.deducirAlquilerPunto)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deducirAlquilerPunto: e.target.checked
                      })
                    }
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className={`text-[11px] font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Deducir alquiler de ganancia neta
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'tarifas' && (
            <div className="space-y-4">
              {/* Formulario para agregar tarifa fija */}
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <h3 className={`text-xs font-bold uppercase mb-2 ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}>
                  Agregar Tarifa Personalizada
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    id="new-tarifa-op-select"
                    value={newTarifaOp}
                    onChange={(e) => setNewTarifaOp(e.target.value)}
                    className={`rounded-lg px-3 py-2 text-xs border focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {OPERADORAS.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    id="new-tarifa-recarga-input"
                    type="number"
                    placeholder="Recarga (Bs)"
                    value={newTarifaRecarga}
                    onChange={(e) => setNewTarifaRecarga(e.target.value)}
                    className={`rounded-lg px-3 py-2 text-xs border focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <input
                    id="new-tarifa-cobro-input"
                    type="number"
                    placeholder="Cobrar (Bs)"
                    value={newTarifaCobro}
                    onChange={(e) => setNewTarifaCobro(e.target.value)}
                    className={`rounded-lg px-3 py-2 text-xs border focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <button
                    id="add-tarifa-btn"
                    type="button"
                    onClick={handleAddTarifa}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>

              {/* Lista de tarifas existentes */}
              <div className={`max-h-64 overflow-y-auto rounded-xl border divide-y text-xs ${
                isLight
                  ? 'border-slate-200 divide-slate-100 bg-white'
                  : 'border-slate-800 divide-slate-800 bg-slate-900/40'
              }`}>
                {localTarifas.map((t) => {
                  const op = OPERADORAS.find(o => o.id === t.operadoraId);
                  return (
                    <div
                      key={t.id}
                      className={`p-2.5 flex items-center justify-between transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {op?.nombre || t.operadoraId}
                        </span>
                        <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Recarga: {t.montoRecarga} Bs.
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Cobro: {t.montoCobrar} Bs.
                        </span>
                        <button
                          onClick={() => handleDeleteTarifa(t.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                          title="Eliminar tarifa fija"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'nube' && (
            <div className={`p-4 rounded-xl border text-xs space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              <h4 className="font-bold uppercase tracking-wider text-[11px]">
                Almacenamiento Local y Respaldo
              </h4>
              <p className="leading-relaxed">
                Tus transacciones, configuraciones y tarifas se almacenan automáticamente de forma segura en este navegador (LocalStorage).
              </p>
              <p className="leading-relaxed">
                Para guardar una copia permanente, puedes usar el botón <strong>Excel (.xlsx)</strong> tanto en el <em>Registro Diario</em> como en el <em>Reporte Semanal</em>.
              </p>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-800/50 text-amber-300'
              }`}>
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Privacidad y Protección de Caja</p>
                  <p className="opacity-90">
                    El PIN numérico impide que clientes o personas no autorizadas vean el dinero en caja, el saldo en bolívares/dólares, ganancias o la lista de fiados.
                  </p>
                  <p className="font-mono text-[11px] pt-1">
                    PIN actual activo: <strong className="font-bold">{showCurrentPin ? getSecurityPin() : '••••'}</strong>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="ml-2 underline text-orange-500 hover:text-orange-600 cursor-pointer"
                    >
                      {showCurrentPin ? 'Ocultar' : 'Ver'}
                    </button>
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdatePin} className={`p-4 rounded-xl border space-y-3.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  Cambiar PIN de Acceso
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      PIN Actual
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 2828"
                      className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none transition ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-orange-500'
                          : 'bg-slate-800 border-slate-700 text-white focus:border-orange-500'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      Nuevo PIN (4 a 8 dígitos)
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nuevo PIN"
                      className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none transition ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-orange-500'
                          : 'bg-slate-800 border-slate-700 text-white focus:border-orange-500'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      Confirmar Nuevo PIN
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repite el nuevo PIN"
                      className={`w-full px-3 py-2 rounded-lg text-sm font-mono border focus:outline-none transition ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-orange-500'
                          : 'bg-slate-800 border-slate-700 text-white focus:border-orange-500'
                      }`}
                      required
                    />
                  </div>
                </div>

                {pinFeedback.text && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    pinFeedback.type === 'error'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {pinFeedback.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                    <span>{pinFeedback.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    id="submit-update-pin-btn"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Guardar Nuevo PIN</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-2 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#0f172a]'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Cancelar
          </button>
          <button
            id="save-settings-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
