'use client';

import React from 'react';
import {
  Banknote,
  CreditCard,
  Fingerprint,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/calculator';

export default function DailySummaryCards({ summary, config, onTogglePosRent, theme = 'dark', currentUser = null }) {
  const isLight = theme === 'light';
  const isVendedor = currentUser?.rol === 'vendedor';
  const {
    totalRecargas,
    totalMontoRecarga,
    totalCobrado,
    gananciaBruta,
    gananciaBrutaUsd,
    gananciaNetaUsd,
    totalEfectivo,
    totalPunto,
    totalBiopago = 0,
    totalPayallRecargas = 0,
    totalPayallCobrado = 0,
    gananciaPayall = 0,
    countPayall = 0,
    totalPagoDirectoRecargas = 0,
    totalPagoDirectoCobrado = 0,
    gananciaPagoDirecto = 0,
    countPagoDirecto = 0,
    deduccionComisionPuntoBs,
    deduccionPuntoBs,
    deduccionBiopagoBs,
    totalDeduccionesBs,
    gananciaNetaBs,
    tasaBcv,
    deducirAlquilerPunto,
    totalAlquilerPasado = 0,
    totalAlquilerGananciaBs = 0,
    totalAlquilerPagarBs = 0,
    totalPuntoLoteGeneral = 0,
    countAlquilerComerciantes = 0,
    countAlquilerTickets = 0
  } = summary;

  const comisionPuntoPct = Number(config?.comisionPuntoPorcentaje ?? 0.75);
  const biopagoPct = Number(config?.biopagoPorcentaje ?? 2.0);

  // VISTA ESPECIAL VENDEDOR: SOLO DINERO RECAUDADO Y MEDIOS DE PAGO (SIN GANANCIAS NI DEDUCCIONES)
  if (isVendedor) {
    return (
      <div className="space-y-4">
        {/* Tarjeta de Arqueo General para Vendedor */}
        <div className={`rounded-2xl p-5 sm:p-6 border transition-colors shadow-sm ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-100'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Total Cobrado en Caja Hoy
                </span>
              </div>
              <div className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-mono ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {formatBs(totalCobrado)}
              </div>
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {totalRecargas === 0
                  ? 'Sin operaciones registradas en el turno de hoy'
                  : `Cuadre correspondiente a ${totalRecargas} recargas realizadas`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-4 py-3 rounded-xl border text-center min-w-[130px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wide block ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Recargas
                </span>
                <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {totalRecargas}
                </div>
                <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Operaciones
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cajas de Arqueo por Medio de Pago (Efectivo, Punto POS, BioPago) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Efectivo en Mano */}
          <div className={`rounded-xl p-4 border transition-colors shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Efectivo en Gaveta
              </span>
              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {formatBs(totalEfectivo)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Dinero físico a entregar</span>
              {tasaBcv > 0 && totalEfectivo > 0 && (
                <span className={`font-mono font-bold ${isLight ? 'text-slate-600' : 'text-amber-400'}`}>
                  ≈ {formatUsd(totalEfectivo / tasaBcv)}
                </span>
              )}
            </div>
          </div>

          {/* Punto de Venta POS */}
          <div className={`rounded-xl p-4 border transition-colors shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Punto de Venta (POS)
              </span>
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
              {formatBs(totalPunto)}
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total pasado por tarjeta de débito
            </p>
          </div>

          {/* BioPago */}
          <div className={`rounded-xl p-4 border transition-colors shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                BioPago
              </span>
              <Fingerprint className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className={`text-2xl font-black font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              {formatBs(totalBiopago)}
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total cobrado por huella digital
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* TARJETA PRINCIPAL: BALANCE DEL DÍA */}
      <div className={`rounded-2xl p-5 sm:p-6 border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Ganancia en Comisiones del Día (Bruta)
              </span>
            </div>
            <div className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-mono ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              +{formatBs(gananciaBruta)}
            </div>
            <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {totalRecargas === 0
                ? 'Sin operaciones registradas hoy'
                : `Acumulado en ${totalRecargas} recargas procesadas`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Equivalente USD */}
            <div className={`px-4 py-3 rounded-xl border min-w-[140px] ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wide block ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Equiv. Dólares (BCV)
              </span>
              <div className={`text-2xl font-black font-mono ${
                isLight ? 'text-slate-900' : 'text-amber-300'
              }`}>
                {formatUsd(gananciaBrutaUsd || 0)}
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tasa: {formatBs(tasaBcv)}
              </span>
            </div>

            {/* Total Operaciones */}
            <div className={`px-4 py-3 rounded-xl border text-center min-w-[130px] ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wide block ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Total Recargas
              </span>
              <div className={`text-2xl font-black font-mono ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {totalRecargas}
              </div>
              <span className={`text-[10px] font-bold ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                Cobrado: {formatBs(totalCobrado)}
              </span>
            </div>
          </div>
        </div>

        {/* Desglose por Plataforma: Payall vs PagoDirecto vs Alquiler Punto */}
        <div className={`mt-5 pt-4 border-t grid grid-cols-1 ${totalAlquilerGananciaBs > 0 ? 'lg:grid-cols-3 sm:grid-cols-2' : 'sm:grid-cols-2'} gap-3 text-xs ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}>
          {/* Card Payall */}
          <div className={`p-3.5 rounded-xl border transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/70 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                Payall
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                isLight ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              }`}>
                {countPayall} {countPayall === 1 ? 'recarga' : 'recargas'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 text-xs font-mono">
              <div>
                <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Saldo Vendido
                </span>
                <span className={`text-sm font-black block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatBs(totalPayallRecargas)}
                </span>
                <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Costo de plataforma
                </span>
              </div>

              <div className="text-right">
                <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total Cobrado
                </span>
                <span className={`text-sm font-bold block ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {formatBs(totalPayallCobrado)}
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">
                  +{formatBs(gananciaPayall || (totalPayallCobrado - totalPayallRecargas))} gan.
                </span>
              </div>
            </div>
          </div>

          {/* Card PagoDirecto */}
          <div className={`p-3.5 rounded-xl border transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/70 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs"></span>
                PagoDirecto
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                isLight ? 'bg-blue-100/80 text-blue-800 border-blue-200' : 'bg-blue-950/60 text-blue-300 border-blue-800'
              }`}>
                {countPagoDirecto} {countPagoDirecto === 1 ? 'recarga' : 'recargas'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 text-xs font-mono">
              <div>
                <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Saldo Vendido
                </span>
                <span className={`text-sm font-black block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatBs(totalPagoDirectoRecargas)}
                </span>
                <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Costo de plataforma
                </span>
              </div>

              <div className="text-right">
                <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total Cobrado
                </span>
                <span className={`text-sm font-bold block ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {formatBs(totalPagoDirectoCobrado)}
                </span>
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block">
                  +{formatBs(gananciaPagoDirecto || (totalPagoDirectoCobrado - totalPagoDirectoRecargas))} gan.
                </span>
              </div>
            </div>
          </div>

          {/* Card Alquiler Punto POS */}
          {totalAlquilerGananciaBs > 0 && (
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isLight
                ? 'bg-orange-50/70 border-orange-200'
                : 'bg-orange-950/30 border-orange-800/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs"></span>
                  Alquiler Punto (10%)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                  isLight ? 'bg-orange-100/80 text-orange-800 border-orange-200' : 'bg-orange-950/60 text-orange-300 border-orange-800'
                }`}>
                  {countAlquilerTickets} tickets ({countAlquilerComerciantes} comercios)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-orange-200/60 dark:border-orange-800/60 text-xs font-mono">
                <div>
                  <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Total Pasado
                  </span>
                  <span className={`text-sm font-black block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatBs(totalAlquilerPasado)}
                  </span>
                  <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Entregar: {formatBs(totalAlquilerPagarBs)}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tu Ganancia (10%)
                  </span>
                  <span className="text-sm font-black text-orange-600 dark:text-orange-400 block">
                    +{formatBs(totalAlquilerGananciaBs)}
                  </span>
                  <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 block">
                    Comisión retenida
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TRES CAJAS DE RECAUDACIÓN (Efectivo, Punto, BioPago) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Efectivo en Mano */}
        <div className={`rounded-xl p-4 border transition-colors shadow-sm ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#0f172a] border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Efectivo en Caja
            </span>
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatBs(totalEfectivo)}
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Dinero físico en gaveta
          </p>
        </div>

        {/* Cobrado por Punto POS */}
        <div className={`rounded-xl p-4 border transition-colors shadow-sm ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#0f172a] border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Punto de Venta (POS)
            </span>
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatBs(totalPuntoLoteGeneral || totalPunto)}
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {totalAlquilerPasado > 0
              ? `Lote: Recargas (${formatBs(totalPunto)}) + Vecinos (${formatBs(totalAlquilerPasado)})`
              : `Liquidado en banco (-${comisionPuntoPct}% comisión)`}
          </p>
        </div>

        {/* Cobrado por BioPago */}
        <div className={`rounded-xl p-4 border transition-colors shadow-sm ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#0f172a] border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              BioPago
            </span>
            <Fingerprint className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatBs(totalBiopago)}
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Cobro por huella digital (-{biopagoPct}% comisión)
          </p>
        </div>
      </div>

      {/* DEDUCCIONES BANCARIAS Y GANANCIA NETA */}
      <div className={`rounded-xl p-4 sm:p-5 border transition-colors shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0f172a] border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Costos Bancarios y Ganancia Neta Real
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Deducciones que retiene el banco al liquidar los puntos y BioPago
            </p>
          </div>

          {onTogglePosRent && (
            <button
              onClick={onTogglePosRent}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Activar solo si deseas descontar el alquiler fijo del punto de la ganancia de recargas"
            >
              {deducirAlquilerPunto ? (
                <ToggleRight className="w-4 h-4 text-orange-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {deducirAlquilerPunto
                  ? 'Alquiler POS diario Activo ($1.78)'
                  : 'Sin deducir alquiler POS'}
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Comisión Punto 0.75% */}
          <div className={`p-3 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`block mb-1 text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Comisión Punto POS ({comisionPuntoPct}%):
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold font-mono text-rose-600 text-sm">
                -{formatBs(deduccionComisionPuntoBs || 0)}
              </span>
              {tasaBcv > 0 && deduccionComisionPuntoBs > 0 && (
                <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (≈ -{formatUsd((deduccionComisionPuntoBs || 0) / tasaBcv)})
                </span>
              )}
            </div>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {comisionPuntoPct}% sobre {formatBs(totalPunto)}
            </span>
          </div>

          {/* Comisión BioPago 2% */}
          <div className={`p-3 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`block mb-1 text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Comisión BioPago ({biopagoPct}%):
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold font-mono text-rose-600 text-sm">
                -{formatBs(deduccionBiopagoBs || 0)}
              </span>
              {tasaBcv > 0 && deduccionBiopagoBs > 0 && (
                <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (≈ -{formatUsd((deduccionBiopagoBs || 0) / tasaBcv)})
                </span>
              )}
            </div>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {biopagoPct}% sobre {formatBs(totalBiopago)}
            </span>
          </div>

          {/* Alquiler POS */}
          <div className={`p-3 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`block mb-1 text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Alquiler Diario POS ({formatUsd(config.alquilerPuntoUsd || 1.777)}):
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`font-bold font-mono text-sm ${deducirAlquilerPunto ? 'text-rose-600' : 'text-slate-400'}`}>
                {deducirAlquilerPunto ? `-${formatBs(deduccionPuntoBs)}` : '0,00 Bs. (Inactivo)'}
              </span>
              {deducirAlquilerPunto && tasaBcv > 0 && (
                <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  (≈ -{formatUsd((deduccionPuntoBs || 0) / tasaBcv)})
                </span>
              )}
            </div>
            <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {deducirAlquilerPunto ? 'Deducción fija por día' : 'No descontado de recargas'}
            </span>
          </div>

          {/* Ganancia Neta Real */}
          <div className={`p-3 rounded-lg border relative overflow-hidden ${
            isLight
              ? gananciaNetaBs >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'
              : gananciaNetaBs >= 0 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold ${
                isLight ? 'text-slate-700' : 'text-slate-200'
              }`}>
                Ganancia Neta Real:
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                gananciaNetaBs >= 0
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}>
                En Bolsillo
              </span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`font-black font-mono text-base ${
                gananciaNetaBs >= 0
                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                  : 'text-rose-600'
              }`}>
                {gananciaNetaBs >= 0 ? '+' : ''}{formatBs(gananciaNetaBs)}
              </span>
              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md border shadow-2xs ${
                gananciaNetaBs >= 0
                  ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-900/60 text-emerald-300 border-emerald-600')
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                ≈ {formatUsd(gananciaNetaUsd || 0)}
              </span>
            </div>
            <span className={`text-[10px] block mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Bruta ({formatBs(gananciaBruta)}) - Deducciones ({formatBs(totalDeduccionesBs)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
