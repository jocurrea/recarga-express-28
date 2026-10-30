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
import PwaInstallBanner from '@/components/PwaInstallBanner';
import {
  getTasaBcv,
  saveManualBcvRate,
  getManualBcvRate,
  getDailyBcvRates,
  saveDailyBcvRates,
  getBcvRateForDate,
  saveBcvRateForDate
} from '@/lib/bcv';
import { calculateDailySummary, formatBs, formatUsd, compareTransactionsByTime } from '@/lib/calculator';
import { DEFAULT_CONFIG } from '@/lib/constants';
import {
  getAllTransactions,
  getTransactionsByDate,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  toggleEstadoPago,
  abonarTransaccion,
  clearTransactionsByDate,
  clearAllTransactions,
  getAllAlquilerPunto,
  addAlquilerPunto,
  updateAlquilerPunto,
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
  const [dailyRates, setDailyRates] = useState({});
  const [loadingBcv, setLoadingBcv] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [isMounted, setIsMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const isVendedor = currentUser?.rol === 'vendedor';

  // Tasa BCV calculada según el día seleccionado actual (mantiene la tasa histórica por día)
  const tasaBcv = useMemo(() => {
    return getBcvRateForDate(selectedDate, dailyRates);
  }, [selectedDate, dailyRates]);

  // Inicialización y carga de datos
  const loadInitialData = useCallback(() => {
    // 1. Carga inmediata local (0 latencia)
    const txs = getAllTransactions();
    setAllTransactions(txs);
    setAllAlquiler(getAllAlquilerPunto());
    setConfig(getConfig());
    setTarifas(getTarifas());
    const localDailyRates = getDailyBcvRates();
    setDailyRates(localDailyRates);

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
        if (res?.tasasDiarias) {
          const mergedRates = { ...res.tasasDiarias, ...getDailyBcvRates() };
          saveDailyBcvRates(mergedRates);
          setDailyRates(mergedRates);
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

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }, [theme]);

  // Fetch BCV Rate (con soporte para forzar actualización directa al banco)
  const fetchBcvRate = useCallback(async (force = false) => {
    setLoadingBcv(true);
    try {
      const data = await getTasaBcv(force);
      if (data?.tasa && Number(data.tasa) > 0) {
        const num = Number(data.tasa);
        const today = getTodayDateStr();
        // Guardar la tasa del día actual
        saveBcvRateForDate(today, num);
        setDailyRates((prev) => ({ ...prev, [today]: num }));
        return data;
      }
    } finally {
      setLoadingBcv(false);
    }
  }, []);

  const handleSaveManualBcv = (rate, targetDate = null) => {
    const dateToSave = targetDate || selectedDate || getTodayDateStr();
    saveBcvRateForDate(dateToSave, rate);
    setDailyRates((prev) => ({ ...prev, [dateToSave]: rate }));
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

  // Transacciones del día seleccionado ordenadas cronológicamente
  const dayTransactions = useMemo(() => {
    return allTransactions
      .filter((t) => t.fecha === selectedDate)
      .slice()
      .sort((a, b) => compareTransactionsByTime(a, b, 'desc'));
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

  // Manejador para registrar abono parcial a una deuda
  const handleAbonarDeuda = (id, montoAbono, metodo) => {
    const updated = abonarTransaccion(id, montoAbono, metodo, selectedDate);
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

  const handleUpdateAlquiler = (id, updatedFields) => {
    const updated = updateAlquilerPunto(id, updatedFields);
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
      <>
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
        <PwaInstallBanner isUnlocked={isUnlocked} />
      </>
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
        dailyRates={dailyRates}
        allTransactions={allTransactions}
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
                              <span className={isLight ? 'text-slate-900 font-bold' : 'text-white font-bold'}>{tx.operadoraNombre}</span>
                              <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                                {formatBs(tx.montoRecarga)}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs ${
                                  isPagoDirecto
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-emerald-700 text-white'
                                }`}
                              >
                                {isPagoDirecto ? 'PagoDirecto' : 'Payall'}
                              </span>
                              {tx.estadoPago === 'pendiente' && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-600 text-white shadow-2xs">
                                  ⏳ Fiado
                                </span>
                              )}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              {tx.hora} • Cobrado: <strong className={isLight ? 'text-slate-950 font-black' : 'text-white font-bold'}>{formatBs(tx.montoCobrado)}</strong> ({tx.metodo})
                              {tx.clienteNombre && (
                                <span className="font-bold text-amber-700 dark:text-amber-300 block capitalize font-sans">
                                  👤 {tx.clienteNombre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            {!isVendedor ? (
                              <>
                                <span className={`font-black block text-sm ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>
                                  +{formatBs(gan)}
                                </span>
                                {tasaBcv > 0 && (
                                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    ≈ {formatUsd(gan / tasaBcv)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className={`font-black font-mono block text-sm ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>
                                  {formatBs(tx.montoCobrado)}
                                </span>
                                <span className={`text-[10px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
            onAbonarDeuda={handleAbonarDeuda}
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
            onUpdateAlquiler={handleUpdateAlquiler}
            onDeleteAlquiler={handleDeleteAlquiler}
            onToggleTransferido={handleToggleAlquilerTransferido}
            tasaBcv={tasaBcv}
            theme={theme}
            totalPuntoRecargas={dailySummary.totalPunto}
            totalBiopagoRecargas={dailySummary.totalBiopago}
            comisionBancariaPorcentaje={config.comisionPuntoPorcentaje || 0.75}
            transactions={dayTransactions}
            config={config}
          />
        )}

        {/* Vista Semanal (Hoja Ganancia Por Semana P1) */}
        {activeTab === 'semanal' && (
          <WeeklyReport
            allTransactions={allTransactions}
            allAlquiler={allAlquiler}
            tasaBcv={tasaBcv}
            dailyRates={dailyRates}
            config={config}
            theme={theme}
            onToggleEstadoPago={handleToggleEstadoPago}
            onAbonarDeuda={handleAbonarDeuda}
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
