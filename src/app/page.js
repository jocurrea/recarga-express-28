'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import QuickCashier from '@/components/QuickCashier';
import DailySummaryCards from '@/components/DailySummaryCards';
import DailyTable from '@/components/DailyTable';
import WeeklyReport from '@/components/WeeklyReport';
import AlquilerPuntoView from '@/components/AlquilerPuntoView';
import PayallManualCard from '@/components/PayallManualCard';
import SettingsModal from '@/components/SettingsModal';
import AuthLockScreen from '@/components/AuthLockScreen';
import { getTasaBcv, saveManualBcvRate, getManualBcvRate } from '@/lib/bcv';
import { calculateDailySummary, formatUsd } from '@/lib/calculator';
import { DEFAULT_CONFIG } from '@/lib/constants';
import {
  getAllTransactions,
  getTransactionsByDate,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  toggleEstadoPago,
  clearTransactionsByDate,
  clearAllTransactions,
  getAllAlquilerPunto,
  addAlquilerPunto,
  deleteAlquilerPunto,
  toggleAlquilerTransferido,
  getConfig,
  saveConfig,
  getTarifas,
  saveTarifas,
  getTodayDateStr,
  INITIAL_TARIFAS,
  isSessionUnlocked,
  setSessionUnlocked,
  saveSecurityPin,
  getActiveUser,
  setActiveUser,
  saveUsersConfig
} from '@/lib/storage';
import {
  isSupabaseConfigured,
  fetchTransactionsFromSupabase,
  syncTransactionToSupabase,
  fetchAlquilerFromSupabase,
  fetchConfigFromSupabase
} from '@/lib/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState('cajero'); // 'cajero' | 'diario' | 'semanal'
  const [selectedDate, setSelectedDate] = useState('');
  const [allTransactions, setAllTransactions] = useState([]);
  const [allAlquiler, setAllAlquiler] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [tarifas, setTarifas] = useState(INITIAL_TARIFAS);
  const [tasaBcv, setTasaBcv] = useState(887.30);
  const [loadingBcv, setLoadingBcv] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [isMounted, setIsMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const isVendedor = currentUser?.rol === 'vendedor';

  // Inicialización y carga de datos
  const loadInitialData = useCallback(() => {
    // 1. Carga inmediata local (0 latencia)
    const txs = getAllTransactions();
    setAllTransactions(txs);
    setAllAlquiler(getAllAlquilerPunto());
    setConfig(getConfig());
    setTarifas(getTarifas());
    setTasaBcv(getManualBcvRate());
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('recargas_theme_mode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    }

    // 2. Sincronización en segundo plano con Supabase Cloud
    if (isSupabaseConfigured) {
      fetchTransactionsFromSupabase().then((remoteTxs) => {
        if (remoteTxs && remoteTxs.length > 0) {
          setAllTransactions(remoteTxs);
          if (typeof window !== 'undefined') {
            localStorage.setItem('recargas_transacciones_v1', JSON.stringify(remoteTxs));
          }
        } else if (txs.length > 0) {
          // Si Supabase está vacío y hay datos locales, respaldar en la nube
          txs.forEach((t) => syncTransactionToSupabase(t));
        }
      });

      fetchAlquilerFromSupabase().then((remoteAlq) => {
        if (remoteAlq && remoteAlq.length > 0) {
          setAllAlquiler(remoteAlq);
          if (typeof window !== 'undefined') {
            localStorage.setItem('recargas_alquiler_punto_v1', JSON.stringify(remoteAlq));
          }
        }
      });

      fetchConfigFromSupabase().then((res) => {
        if (res?.config) {
          setConfig(res.config);
          if (typeof window !== 'undefined') {
            localStorage.setItem('recargas_config_v1', JSON.stringify(res.config));
          }
        }
        if (res?.tarifas) {
          setTarifas(res.tarifas);
          if (typeof window !== 'undefined') {
            localStorage.setItem('recargas_tarifas_custom_v3', JSON.stringify(res.tarifas));
          }
        }
        if (res?.securityPin) {
          saveSecurityPin(res.securityPin);
        }
        if (res?.securityUsers) {
          saveUsersConfig(res.securityUsers);
        }
      });
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recargas_theme_mode', nextTheme);
    }
  };

  // Fetch BCV Rate (con soporte para forzar actualización directa al banco)
  const fetchBcvRate = useCallback(async (force = false) => {
    setLoadingBcv(true);
    try {
      const data = await getTasaBcv(force);
      if (data?.tasa && Number(data.tasa) > 0) {
        setTasaBcv(Number(data.tasa));
        return data;
      }
    } finally {
      setLoadingBcv(false);
    }
  }, []);

  const handleSaveManualBcv = (rate) => {
    saveManualBcvRate(rate);
    setTasaBcv(rate);
  };

  const handleTogglePosRent = () => {
    const newCfg = { ...config, deducirAlquilerPunto: !config.deducirAlquilerPunto };
    saveConfig(newCfg);
    setConfig(newCfg);
  };

  useEffect(() => {
    setIsMounted(true);
    const existingUser = getActiveUser();
    if (isSessionUnlocked() && existingUser) {
      setCurrentUser(existingUser);
      setIsUnlocked(true);
    }
    setSelectedDate(getTodayDateStr());
    loadInitialData();
    // Consultar tasa oficial de entrada
    fetchBcvRate(false);

    // Consulta periódica cada 10 minutos para mantener sincronizado con el banco
    const interval = setInterval(() => {
      fetchBcvRate(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadInitialData, fetchBcvRate]);

  // Transacciones del día seleccionado
  const dayTransactions = useMemo(() => {
    return allTransactions.filter((t) => t.fecha === selectedDate);
  }, [allTransactions, selectedDate]);

  // Registros de alquiler de punto a terceros del día seleccionado
  const dayAlquiler = useMemo(() => {
    return allAlquiler.filter((a) => a.fecha === selectedDate);
  }, [allAlquiler, selectedDate]);

  // Resumen financiero del día (recargas + comisiones por alquiler de punto)
  const dailySummary = useMemo(() => {
    return calculateDailySummary(dayTransactions, config, tasaBcv, dayAlquiler);
  }, [dayTransactions, config, tasaBcv, dayAlquiler]);

  // Manejador para agregar transacción
  const handleAddTransaction = (newTxData) => {
    const saved = addTransaction(newTxData);
    setAllTransactions((prev) => [saved, ...prev]);
    return saved;
  };

  // Manejador para eliminar transacción
  const handleDeleteTransaction = (id) => {
    const updated = deleteTransaction(id);
    setAllTransactions(updated);
  };

  // Manejador para actualizar/editar transacción existente
  const handleUpdateTransaction = (id, updatedFields) => {
    const updated = updateTransaction(id, updatedFields);
    setAllTransactions(updated);
  };

  // Manejador para alternar estado de pago (fiado/pendiente <-> pagado)
  const handleToggleEstadoPago = (id, nuevoMetodo = null) => {
    const updated = toggleEstadoPago(id, nuevoMetodo);
    setAllTransactions(updated);
  };

  // Manejador para vaciar transacciones de la fecha seleccionada
  const handleClearDateTransactions = () => {
    const updated = clearTransactionsByDate(selectedDate);
    setAllTransactions(updated);
  };

  // Manejadores de Alquiler de Punto (10%)
  const handleAddAlquiler = (newRecord) => {
    const saved = addAlquilerPunto(newRecord);
    setAllAlquiler((prev) => [saved, ...prev]);
    return saved;
  };

  const handleDeleteAlquiler = (id) => {
    const updated = deleteAlquilerPunto(id);
    setAllAlquiler(updated);
  };

  const handleToggleAlquilerTransferido = (id) => {
    const updated = toggleAlquilerTransferido(id);
    setAllAlquiler(updated);
  };

  // Manejador para guardar configuración
  const handleSaveConfig = (newCfg) => {
    saveConfig(newCfg);
    setConfig(newCfg);
  };

  // Manejador para guardar tarifas
  const handleSaveTarifas = (newTarifas) => {
    saveTarifas(newTarifas);
    setTarifas(newTarifas);
  };

  const handleLockScreen = () => {
    setSessionUnlocked(false);
    setActiveUser(null);
    setCurrentUser(null);
    setIsUnlocked(false);
  };

  if (!isMounted) return null;

  if (!isUnlocked) {
    return (
      <AuthLockScreen
        onUnlock={(user) => {
          setCurrentUser(user);
          setIsUnlocked(true);
          if (user?.rol === 'vendedor' && (activeTab === 'alquiler' || activeTab === 'semanal')) {
            setActiveTab('cajero');
          }
        }}
        theme={theme}
      />
    );
  }

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-orange-500 selection:text-white ${
      isLight ? 'bg-slate-100/60 text-slate-800' : 'bg-[#0b0f19] text-slate-100'
    }`}>
      {/* Barra de Navegación con Marca e Identidad Recarga Express 28 */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        tasaBcv={tasaBcv}
        loadingBcv={loadingBcv}
        onRefreshBcv={() => fetchBcvRate(true)}
        onSaveManualBcv={handleSaveManualBcv}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        alquilerCount={dayAlquiler.length}
        onLock={handleLockScreen}
        currentUser={currentUser}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Siempre visible: Tarjetas de Arqueo y Ganancia del Día */}
        <DailySummaryCards
          summary={dailySummary}
          config={config}
          onTogglePosRent={handleTogglePosRent}
          theme={theme}
          currentUser={currentUser}
        />

        {/* Vista del Cajero Rápido (3-clics) */}
        {activeTab === 'cajero' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <QuickCashier
                config={config}
                tarifas={tarifas}
                selectedDate={selectedDate}
                onAddTransaction={handleAddTransaction}
                recentTransactions={dayTransactions.slice(0, 5)}
                onDeleteTransaction={handleDeleteTransaction}
                tasaBcv={tasaBcv}
                theme={theme}
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Recargas de Hoy ({dayTransactions.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('diario')}
                    className="text-xs text-orange-600 hover:underline font-semibold cursor-pointer"
                  >
                    Ver tabla →
                  </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {dayTransactions.length === 0 ? (
                    <div className="text-center py-8 px-2 space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto border text-xs font-bold ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        0
                      </div>
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Gaveta sin recargas hoy
                      </p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        Selecciona operadora, monto y medio de cobro en el cajero para registrar la primera.
                      </p>
                    </div>
                  ) : (
                    dayTransactions.slice(0, 8).map((tx) => {
                      const gan = tx.montoCobrado - tx.montoRecarga;
                      const isPagoDirecto = (tx.plataforma || 'payall').toLowerCase() === 'pagodirecto';
                      return (
                        <div
                          key={tx.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-slate-900/60 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5 flex-wrap">
                              <span className={isLight ? 'text-slate-900' : 'text-white'}>{tx.operadoraNombre}</span>
                              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                {tx.montoRecarga} Bs.
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                                  isPagoDirecto
                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
                                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                {isPagoDirecto ? 'PagoDirecto' : 'Payall'}
                              </span>
                              {tx.estadoPago === 'pendiente' && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded border bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40">
                                  ⏳ Fiado
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] capitalize ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {tx.hora} • Cobrado: {tx.montoCobrado} Bs. ({tx.metodo})
                              {tx.clienteNombre && (
                                <span className="font-bold text-amber-600 dark:text-amber-400 block lowercase font-sans">
                                  👤 {tx.clienteNombre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            {!isVendedor ? (
                              <>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-xs">
                                  +{gan} Bs.
                                </span>
                                {tasaBcv > 0 && (
                                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    ≈ {formatUsd(gan / tasaBcv)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                                  {formatBs(tx.montoCobrado)}
                                </span>
                                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {tx.telefono || 'Sin tel.'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cuadro Manual de Ganancias de Payall (Día por Día) - Solo Administradores */}
              {!isVendedor && <PayallManualCard tasaBcv={tasaBcv} theme={theme} />}
            </div>
          </div>
        )}

        {/* Vista de Registro Diario (Tabla tipo WPS Excel) */}
        {activeTab === 'diario' && (
          <DailyTable
            transactions={dayTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onToggleEstadoPago={handleToggleEstadoPago}
            onClearDateTransactions={handleClearDateTransactions}
            selectedDate={selectedDate}
            theme={theme}
            tasaBcv={tasaBcv}
            alquilerRecords={dayAlquiler}
            currentUser={currentUser}
          />
        )}

        {/* Vista de Alquiler de Punto POS a Terceros (10%) */}
        {activeTab === 'alquiler' && (
          <AlquilerPuntoView
            alquilerRecords={dayAlquiler}
            selectedDate={selectedDate}
            onAddAlquiler={handleAddAlquiler}
            onDeleteAlquiler={handleDeleteAlquiler}
            onToggleTransferido={handleToggleAlquilerTransferido}
            tasaBcv={tasaBcv}
            theme={theme}
            totalPuntoRecargas={dailySummary.totalPunto}
            comisionBancariaPorcentaje={config.comisionPuntoPorcentaje || 0.75}
            transactions={dayTransactions}
            config={config}
          />
        )}

        {/* Vista Semanal (Hoja Ganancia Por Semana P1) */}
        {activeTab === 'semanal' && (
          <WeeklyReport
            allTransactions={allTransactions}
            tasaBcv={tasaBcv}
            config={config}
            theme={theme}
            onToggleEstadoPago={handleToggleEstadoPago}
          />
        )}
      </main>

      {/* Modal de Configuración */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        tarifas={tarifas}
        onSaveTarifas={handleSaveTarifas}
        theme={theme}
      />
    </div>
  );
}
