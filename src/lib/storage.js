import { DEFAULT_CONFIG } from './constants';
import {
  syncTransactionToSupabase,
  deleteTransactionFromSupabase,
  syncAlquilerToSupabase,
  deleteAlquilerFromSupabase,
  syncPayallManualToSupabase,
  syncConfigToSupabase
} from './supabase';

const KEY_TRANSACTIONS = 'recargas_transacciones_v1';
const KEY_CONFIG = 'recargas_config_v1';
const KEY_TARIFAS = 'recargas_tarifas_custom_v3';

export const INITIAL_TARIFAS = [
  // Digitel (de 500 en 500 - 15% comisión)
  { id: 'd-500', operadoraId: 'digitel', montoRecarga: 500, montoCobrar: 580 },
  { id: 'd-1000', operadoraId: 'digitel', montoRecarga: 1000, montoCobrar: 1150 },
  { id: 'd-1500', operadoraId: 'digitel', montoRecarga: 1500, montoCobrar: 1730 },
  { id: 'd-2000', operadoraId: 'digitel', montoRecarga: 2000, montoCobrar: 2300 },
  { id: 'd-2500', operadoraId: 'digitel', montoRecarga: 2500, montoCobrar: 2880 },
  { id: 'd-3000', operadoraId: 'digitel', montoRecarga: 3000, montoCobrar: 3450 },
  { id: 'd-3500', operadoraId: 'digitel', montoRecarga: 3500, montoCobrar: 4030 },
  // Movistar (de 400 en 400 - 15% comisión)
  { id: 'm-400', operadoraId: 'movistar', montoRecarga: 400, montoCobrar: 460 },
  { id: 'm-800', operadoraId: 'movistar', montoRecarga: 800, montoCobrar: 920 },
  { id: 'm-1200', operadoraId: 'movistar', montoRecarga: 1200, montoCobrar: 1380 },
  { id: 'm-1600', operadoraId: 'movistar', montoRecarga: 1600, montoCobrar: 1840 },
  { id: 'm-2000', operadoraId: 'movistar', montoRecarga: 2000, montoCobrar: 2300 },
  { id: 'm-2400', operadoraId: 'movistar', montoRecarga: 2400, montoCobrar: 2760 },
  { id: 'm-2800', operadoraId: 'movistar', montoRecarga: 2800, montoCobrar: 3220 },
  { id: 'm-3200', operadoraId: 'movistar', montoRecarga: 3200, montoCobrar: 3680 },
  // Movilnet (mínimo 450, pasos de 150 - 15% comisión)
  { id: 'mv-450', operadoraId: 'movilnet', montoRecarga: 450, montoCobrar: 520 },
  { id: 'mv-600', operadoraId: 'movilnet', montoRecarga: 600, montoCobrar: 690 },
  { id: 'mv-750', operadoraId: 'movilnet', montoRecarga: 750, montoCobrar: 870 },
  { id: 'mv-900', operadoraId: 'movilnet', montoRecarga: 900, montoCobrar: 1040 },
  { id: 'mv-1050', operadoraId: 'movilnet', montoRecarga: 1050, montoCobrar: 1210 },
  { id: 'mv-1200', operadoraId: 'movilnet', montoRecarga: 1200, montoCobrar: 1380 },
  { id: 'mv-1350', operadoraId: 'movilnet', montoRecarga: 1350, montoCobrar: 1560 },
  { id: 'mv-1500', operadoraId: 'movilnet', montoRecarga: 1500, montoCobrar: 1730 },
  // Simple TV (20% comisión)
  { id: 's-500', operadoraId: 'simpletv', montoRecarga: 500, montoCobrar: 600 },
  { id: 's-750', operadoraId: 'simpletv', montoRecarga: 750, montoCobrar: 900 },
  { id: 's-1000', operadoraId: 'simpletv', montoRecarga: 1000, montoCobrar: 1200 },
  { id: 's-1250', operadoraId: 'simpletv', montoRecarga: 1250, montoCobrar: 1500 },
  { id: 's-1500', operadoraId: 'simpletv', montoRecarga: 1500, montoCobrar: 1800 },
  { id: 's-2000', operadoraId: 'simpletv', montoRecarga: 2000, montoCobrar: 2400 },
  // CANTV (20% comisión)
  { id: 'c-200', operadoraId: 'cantv', montoRecarga: 200, montoCobrar: 240 },
  { id: 'c-300', operadoraId: 'cantv', montoRecarga: 300, montoCobrar: 360 },
  { id: 'c-500', operadoraId: 'cantv', montoRecarga: 500, montoCobrar: 600 },
  { id: 'c-800', operadoraId: 'cantv', montoRecarga: 800, montoCobrar: 960 },
  { id: 'c-1000', operadoraId: 'cantv', montoRecarga: 1000, montoCobrar: 1200 },
  { id: 'c-1500', operadoraId: 'cantv', montoRecarga: 1500, montoCobrar: 1800 },
  // Inter (20% comisión)
  { id: 'i-500', operadoraId: 'inter', montoRecarga: 500, montoCobrar: 600 },
  { id: 'i-750', operadoraId: 'inter', montoRecarga: 750, montoCobrar: 900 },
  { id: 'i-1000', operadoraId: 'inter', montoRecarga: 1000, montoCobrar: 1200 },
  { id: 'i-1250', operadoraId: 'inter', montoRecarga: 1250, montoCobrar: 1500 },
  { id: 'i-1500', operadoraId: 'inter', montoRecarga: 1500, montoCobrar: 1800 },
  { id: 'i-2000', operadoraId: 'inter', montoRecarga: 2000, montoCobrar: 2400 }
];

export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getAllTransactions() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_TRANSACTIONS);
    const list = raw ? JSON.parse(raw) : [];
    let modified = false;
    // Auto-corregir transacciones históricas donde montoCobrado se redujo al abonar
    const healed = list.map(t => {
      if (t.montoOriginal && Number(t.montoCobrado) < Number(t.montoOriginal) && !t.isAbono) {
        modified = true;
        const totalAbonado = Number(t.totalAbonado || 0);
        const restante = Math.max(0, Number(t.montoOriginal) - totalAbonado);
        return {
          ...t,
          montoCobrado: Number(t.montoOriginal),
          saldoPendiente: restante
        };
      }
      return t;
    });
    if (modified && typeof window !== 'undefined') {
      localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(healed));
    }
    return healed;
  } catch {
    return [];
  }
}

export function getTransactionsByDate(dateStr) {
  const all = getAllTransactions();
  const targetDate = dateStr || getTodayDateStr();
  return all.filter(t => t.fecha === targetDate);
}

export function addTransaction(data) {
  const all = getAllTransactions();
  const newTx = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    fecha: data.fecha || getTodayDateStr(),
    hora: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
    operadoraId: data.operadoraId,
    operadoraNombre: data.operadoraNombre,
    montoRecarga: Number(data.montoRecarga),
    montoCobrado: Number(data.montoCobrado),
    montoOriginal: Number(data.montoCobrado),
    metodo: data.metodo, // 'efectivo' | 'punto' | 'biopago' | 'pagomovil' | 'mixto'
    montoEfectivo: Number(data.montoEfectivo || 0),
    montoPunto: Number(data.montoPunto || 0),
    montoBiopago: Number(data.montoBiopago || 0),
    montoPagoMovil: Number(data.montoPagoMovil || 0),
    estadoPago: data.estadoPago || 'pagado', // 'pagado' | 'pendiente'
    clienteNombre: (data.clienteNombre || '').trim(),
    fechaPago: data.estadoPago === 'pendiente' ? null : (data.fechaPago || new Date().toISOString()),
    telefono: data.telefono || '',
    plataforma: data.plataforma || 'payall', // 'payall' | 'pagodirecto'
    createdAt: new Date().toISOString()
  };

  const updated = [newTx, ...all];
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updated));
  }
  // Sincronizar en segundo plano con Supabase
  syncTransactionToSupabase(newTx);
  return newTx;
}

export function deleteTransaction(id) {
  const all = getAllTransactions();
  const updated = all.filter(t => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updated));
  }
  // Eliminar en segundo plano en Supabase
  deleteTransactionFromSupabase(id);
  return updated;
}

export function updateTransaction(id, updatedFields) {
  const all = getAllTransactions();
  let updatedTx = null;
  const updated = all.map(t => {
    if (t.id === id) {
      updatedTx = { ...t, ...updatedFields };
      return updatedTx;
    }
    return t;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updated));
  }
  if (updatedTx) {
    syncTransactionToSupabase(updatedTx);
  }
  return updated;
}

export function toggleEstadoPago(id, nuevoMetodo = null) {
  const all = getAllTransactions();
  let updatedTx = null;
  const updated = all.map(t => {
    if (t.id === id) {
      const nuevoEstado = (t.estadoPago || 'pagado') === 'pendiente' ? 'pagado' : 'pendiente';
      const actualizacion = {
        ...t,
        estadoPago: nuevoEstado,
        fechaPago: nuevoEstado === 'pagado' ? new Date().toISOString() : null
      };

      if (nuevoMetodo && nuevoEstado === 'pagado') {
        actualizacion.metodo = nuevoMetodo;
        if (nuevoMetodo === 'efectivo') {
          actualizacion.montoEfectivo = t.montoCobrado;
          actualizacion.montoPunto = 0;
          actualizacion.montoBiopago = 0;
          actualizacion.montoPagoMovil = 0;
        } else if (nuevoMetodo === 'punto') {
          actualizacion.montoPunto = t.montoCobrado;
          actualizacion.montoEfectivo = 0;
          actualizacion.montoBiopago = 0;
          actualizacion.montoPagoMovil = 0;
        } else if (nuevoMetodo === 'biopago') {
          actualizacion.montoBiopago = t.montoCobrado;
          actualizacion.montoEfectivo = 0;
          actualizacion.montoPunto = 0;
          actualizacion.montoPagoMovil = 0;
        } else if (nuevoMetodo === 'pagomovil') {
          actualizacion.montoPagoMovil = t.montoCobrado;
          actualizacion.montoEfectivo = 0;
          actualizacion.montoPunto = 0;
          actualizacion.montoBiopago = 0;
        }
      }

      updatedTx = actualizacion;
      return actualizacion;
    }
    return t;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updated));
  }
  if (updatedTx) {
    syncTransactionToSupabase(updatedTx);
  }
  return updated;
}

export function abonarTransaccion(id, montoAbono, metodoCobro = 'efectivo', fechaAbono = null) {
  const all = getAllTransactions();
  const numAbono = Math.round(Number(montoAbono || 0) * 100) / 100;
  if (!numAbono || numAbono <= 0) return all;

  const targetTx = all.find(t => t.id === id);
  if (!targetTx) return all;

  const montoOriginal = Number(targetTx.montoOriginal || targetTx.montoCobrado || 0);
  const totalAbonadoPrevio = Number(targetTx.totalAbonado || 0);
  const deudaActual = Math.max(0, Math.round((montoOriginal - totalAbonadoPrevio) * 100) / 100);
  const fechaHoy = fechaAbono || getTodayDateStr();
  const horaHoy = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

  const abonoReal = Math.min(numAbono, deudaActual);
  const nuevoTotalAbonado = Math.round((totalAbonadoPrevio + abonoReal) * 100) / 100;
  const restante = Math.max(0, Math.round((montoOriginal - nuevoTotalAbonado) * 100) / 100);
  const quedaSaldado = restante <= 0;

  // 1. Crear el registro del abono que ingresa a la caja de HOY
  const txAbono = {
    id: 'tx-abono-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    fecha: fechaHoy,
    hora: horaHoy,
    operadoraId: 'abono',
    operadoraNombre: `Abono (${targetTx.operadoraNombre || 'Deuda'})`,
    isAbono: true,
    plataforma: targetTx.plataforma || 'payall',
    montoRecarga: 0, // No consume saldo hoy porque ya se consumió en la recarga original
    montoCobrado: abonoReal,
    metodo: metodoCobro,
    montoEfectivo: metodoCobro === 'efectivo' ? abonoReal : 0,
    montoPunto: metodoCobro === 'punto' ? abonoReal : 0,
    montoBiopago: metodoCobro === 'biopago' ? abonoReal : 0,
    montoPagoMovil: metodoCobro === 'pagomovil' ? abonoReal : 0,
    telefono: targetTx.telefono || '',
    clienteNombre: targetTx.clienteNombre || 'Cliente fiado',
    estadoPago: 'pagado',
    fechaPago: new Date().toISOString(),
    notas: quedaSaldado
      ? `Cobro final de ${abonoReal} Bs. Deuda saldada al 100% (Original: ${montoOriginal} Bs de ${targetTx.operadoraNombre} del ${targetTx.fecha}).`
      : `Abono de ${abonoReal} Bs a deuda original de ${montoOriginal} Bs (${targetTx.operadoraNombre} del ${targetTx.fecha}). Resta por cobrar: ${restante} Bs.`,
    createdAt: new Date().toISOString()
  };

  // 2. Actualizar la transacción original pendiente MANTENIENDO montoCobrado = montoOriginal
  let updatedOriginal = null;
  const updatedAll = all.map(t => {
    if (t.id === id) {
      const notaPrevia = t.notas ? `${t.notas} | ` : '';
      updatedOriginal = {
        ...t,
        montoOriginal: montoOriginal,
        montoCobrado: montoOriginal, // ¡MANTENER INTACTO EL MONTO COBRADO ORIGINAL PARA NO ALTERAR LA GANANCIA DEL DÍA DE LA RECARGA!
        totalAbonado: nuevoTotalAbonado,
        saldoPendiente: restante,
        estadoPago: quedaSaldado ? 'pagado' : 'pendiente',
        fechaPago: quedaSaldado ? new Date().toISOString() : t.fechaPago,
        notas: `${notaPrevia}Abonó ${abonoReal} Bs el ${fechaHoy} (${horaHoy}) por ${metodoCobro}. ${quedaSaldado ? 'Deuda saldada al 100%.' : `Resta: ${restante} Bs.`}`
      };
      return updatedOriginal;
    }
    return t;
  });

  const finalTransactions = [txAbono, ...updatedAll];

  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(finalTransactions));
  }

  // Sincronizar en Supabase
  syncTransactionToSupabase(txAbono);
  if (updatedOriginal) {
    syncTransactionToSupabase(updatedOriginal);
  }

  return finalTransactions;
}

export function clearAllTransactions() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify([]));
  }
  return [];
}

export function clearTransactionsByDate(dateStr) {
  const all = getAllTransactions();
  const targetDate = dateStr || getTodayDateStr();
  const updated = all.filter(t => t.fecha !== targetDate);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updated));
  }
  return updated;
}

export function getConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY_CONFIG);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(newConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_CONFIG, JSON.stringify(newConfig));
  }
  syncConfigToSupabase('config', newConfig);
  return newConfig;
}

export function getTarifas() {
  if (typeof window === 'undefined') return INITIAL_TARIFAS;
  try {
    const raw = localStorage.getItem(KEY_TARIFAS);
    return raw ? JSON.parse(raw) : INITIAL_TARIFAS;
  } catch {
    return INITIAL_TARIFAS;
  }
}

export function saveTarifas(tarifas) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_TARIFAS, JSON.stringify(tarifas));
  }
  syncConfigToSupabase('tarifas', tarifas);
  return tarifas;
}

// ==========================================
// ALQUILER DE PUNTO DE VENTA (10% A COMERCIANTES)
// ==========================================
const KEY_ALQUILER = 'recargas_alquiler_punto_v1';

export function getAllAlquilerPunto() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_ALQUILER);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAlquilerPuntoByDate(dateStr) {
  const all = getAllAlquilerPunto();
  const targetDate = dateStr || getTodayDateStr();
  return all.filter(item => item.fecha === targetDate);
}

export function addAlquilerPunto(data) {
  const all = getAllAlquilerPunto();
  const rawTipo = data.tipo || 'punto';
  const tipo = rawTipo === 'mixto' ? 'mixto' : (rawTipo === 'biopago' ? 'biopago' : 'punto');

  let montoPunto = 0;
  let montoBiopago = 0;
  let ticketsPunto = 0;
  let ticketsBiopago = 0;
  let montoTotal = 0;
  let ticketsTotal = 0;

  if (tipo === 'mixto') {
    montoPunto = Number(data.montoPunto || 0);
    montoBiopago = Number(data.montoBiopago || 0);
    montoTotal = Math.round((montoPunto + montoBiopago) * 100) / 100;
    ticketsPunto = Number(data.ticketsPunto) || 0;
    ticketsBiopago = Number(data.ticketsBiopago) || 0;
    ticketsTotal = ticketsPunto + ticketsBiopago || 1;
  } else if (tipo === 'biopago') {
    montoBiopago = Number(data.montoTotal || data.montoBiopago || 0);
    montoTotal = montoBiopago;
    ticketsBiopago = Number(data.tickets || data.ticketsBiopago) || 1;
    ticketsTotal = ticketsBiopago;
  } else {
    montoPunto = Number(data.montoTotal || data.montoPunto || 0);
    montoTotal = montoPunto;
    ticketsPunto = Number(data.tickets || data.ticketsPunto) || 1;
    ticketsTotal = ticketsPunto;
  }

  const comisionPct = Number(data.comisionPorcentaje ?? 10);
  const comisionBs = montoTotal * (comisionPct / 100);
  const montoPagar = montoTotal - comisionBs;

  const newItem = {
    id: 'alq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    tipo: tipo, // 'punto' | 'biopago' | 'mixto'
    fecha: data.fecha || getTodayDateStr(),
    hora: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
    nombre: (data.nombre || '').trim(),
    tickets: ticketsTotal,
    ticketsPunto: ticketsPunto,
    ticketsBiopago: ticketsBiopago,
    montoTotal: montoTotal,
    montoPunto: montoPunto,
    montoBiopago: montoBiopago,
    comisionPorcentaje: comisionPct,
    comisionBs: Math.round(comisionBs * 100) / 100,
    montoPagar: Math.round(montoPagar * 100) / 100,
    transferido: Boolean(data.transferido || false),
    notas: data.notas || '',
    createdAt: new Date().toISOString()
  };

  const updated = [newItem, ...all];
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_ALQUILER, JSON.stringify(updated));
  }
  syncAlquilerToSupabase(newItem);
  return newItem;
}

export function deleteAlquilerPunto(id) {
  const all = getAllAlquilerPunto();
  const updated = all.filter(item => item.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_ALQUILER, JSON.stringify(updated));
  }
  deleteAlquilerFromSupabase(id);
  return updated;
}

export function updateAlquilerPunto(id, updatedFields) {
  const all = getAllAlquilerPunto();
  let updatedRecord = null;
  const updated = all.map(item => {
    if (item.id === id) {
      const tipo = updatedFields.tipo !== undefined
        ? (updatedFields.tipo === 'mixto' ? 'mixto' : (updatedFields.tipo === 'biopago' ? 'biopago' : 'punto'))
        : (item.tipo || 'punto');

      let montoPunto = Number(
        updatedFields.montoPunto !== undefined ? updatedFields.montoPunto : (item.montoPunto || 0)
      );
      let montoBiopago = Number(
        updatedFields.montoBiopago !== undefined ? updatedFields.montoBiopago : (item.montoBiopago || 0)
      );
      let ticketsPunto = Number(
        updatedFields.ticketsPunto !== undefined ? updatedFields.ticketsPunto : (item.ticketsPunto || 0)
      );
      let ticketsBiopago = Number(
        updatedFields.ticketsBiopago !== undefined ? updatedFields.ticketsBiopago : (item.ticketsBiopago || 0)
      );

      let montoTotal = 0;
      let ticketsTotal = 0;

      if (tipo === 'mixto') {
        montoTotal = Math.round((montoPunto + montoBiopago) * 100) / 100;
        ticketsTotal = (ticketsPunto + ticketsBiopago) || 1;
      } else if (tipo === 'biopago') {
        montoTotal = Number(
          updatedFields.montoTotal !== undefined ? updatedFields.montoTotal : (updatedFields.montoBiopago || item.montoTotal || 0)
        );
        montoBiopago = montoTotal;
        montoPunto = 0;
        ticketsTotal = Number(
          updatedFields.tickets !== undefined ? updatedFields.tickets : (updatedFields.ticketsBiopago || item.tickets || 1)
        );
        ticketsBiopago = ticketsTotal;
        ticketsPunto = 0;
      } else {
        montoTotal = Number(
          updatedFields.montoTotal !== undefined ? updatedFields.montoTotal : (updatedFields.montoPunto || item.montoTotal || 0)
        );
        montoPunto = montoTotal;
        montoBiopago = 0;
        ticketsTotal = Number(
          updatedFields.tickets !== undefined ? updatedFields.tickets : (updatedFields.ticketsPunto || item.tickets || 1)
        );
        ticketsPunto = ticketsTotal;
        ticketsBiopago = 0;
      }

      const comisionPct = Number(
        updatedFields.comisionPorcentaje !== undefined
          ? updatedFields.comisionPorcentaje
          : (item.comisionPorcentaje ?? 10)
      );
      const comisionBs = montoTotal * (comisionPct / 100);
      const montoPagar = montoTotal - comisionBs;

      updatedRecord = {
        ...item,
        ...updatedFields,
        tipo: tipo,
        montoTotal: montoTotal,
        montoPunto: montoPunto,
        montoBiopago: montoBiopago,
        tickets: ticketsTotal,
        ticketsPunto: ticketsPunto,
        ticketsBiopago: ticketsBiopago,
        comisionPorcentaje: comisionPct,
        comisionBs: Math.round(comisionBs * 100) / 100,
        montoPagar: Math.round(montoPagar * 100) / 100
      };
      if (updatedFields.nombre !== undefined) {
        updatedRecord.nombre = String(updatedFields.nombre).trim();
      }
      return updatedRecord;
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_ALQUILER, JSON.stringify(updated));
  }
  if (updatedRecord) {
    syncAlquilerToSupabase(updatedRecord);
  }
  return updated;
}

export function toggleAlquilerTransferido(id) {
  const all = getAllAlquilerPunto();
  let target = null;
  const updated = all.map(item => {
    if (item.id === id) {
      target = { ...item, transferido: !item.transferido };
      return target;
    }
    return item;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_ALQUILER, JSON.stringify(updated));
  }
  if (target) {
    syncAlquilerToSupabase(target);
  }
  return updated;
}

export function clearAlquilerPuntoByDate(dateStr) {
  const all = getAllAlquilerPunto();
  const targetDate = dateStr || getTodayDateStr();
  const updated = all.filter(item => item.fecha !== targetDate);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_ALQUILER, JSON.stringify(updated));
  }
  return updated;
}

// ==========================================
// GANANCIAS MANUALES DE PAYALL (POR DÍA)
// ==========================================
const KEY_PAYALL_MANUAL = 'recargas_payall_manual_profits_v1';

export function getPayallManualProfits() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY_PAYALL_MANUAL);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePayallManualProfit(fechaIso, montoBs) {
  const all = getPayallManualProfits();
  if (montoBs === '' || montoBs === null || isNaN(Number(montoBs))) {
    delete all[fechaIso];
  } else {
    all[fechaIso] = Number(montoBs);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_PAYALL_MANUAL, JSON.stringify(all));
  }
  syncPayallManualToSupabase(fechaIso, montoBs);
  return all;
}

// ==========================================
// SEGURIDAD, USUARIOS Y ROLES (DUEÑO, SOCIO, VENDEDOR)
// ==========================================
const KEY_PIN = 'recargas_security_pin_v2';
const KEY_USERS = 'recargas_users_config_v1';
const KEY_SESSION_UNLOCKED = 'recargas_session_unlocked_v2';
const KEY_ACTIVE_USER = 'recargas_active_user_v1';

export const DEFAULT_USERS = [
  { id: 'dueno', nombre: 'Dueño', rol: 'admin', pin: '2828' },
  { id: 'socio', nombre: 'Socio', rol: 'admin', pin: '2829' },
  { id: 'vendedor', nombre: 'Vendedor', rol: 'vendedor', pin: '1234' }
];

export function getUsersConfig() {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(KEY_USERS);
    if (!raw) return DEFAULT_USERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_USERS;
    // Asegurar que existan los 3 roles
    return DEFAULT_USERS.map(def => {
      const found = parsed.find(u => u.id === def.id);
      return found ? { ...def, ...found } : def;
    });
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsersConfig(usersList) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_USERS, JSON.stringify(usersList));
  }
  syncConfigToSupabase('security_users', usersList);
  return usersList;
}

export function updateUserPin(userId, newPin) {
  const cleanPin = String(newPin || '').trim();
  if (cleanPin.length < 4) {
    return { success: false, error: 'El PIN debe tener al menos 4 dígitos' };
  }
  const users = getUsersConfig();
  const updated = users.map(u => u.id === userId ? { ...u, pin: cleanPin } : u);
  saveUsersConfig(updated);

  // Si se actualizó el dueño, sincronizar también el PIN principal legacy
  if (userId === 'dueno') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_PIN, cleanPin);
    }
    syncConfigToSupabase('security_pin', cleanPin);
  }

  return { success: true, users: updated };
}

export function getSecurityPin() {
  const users = getUsersConfig();
  const dueno = users.find(u => u.id === 'dueno');
  return dueno?.pin || '2828';
}

export function saveSecurityPin(newPin) {
  return updateUserPin('dueno', newPin);
}

export function getActiveUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY_ACTIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveUser(user) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      sessionStorage.setItem(KEY_ACTIVE_USER, JSON.stringify(user));
      sessionStorage.setItem(KEY_SESSION_UNLOCKED, 'true');
    } else {
      sessionStorage.removeItem(KEY_ACTIVE_USER);
      sessionStorage.removeItem(KEY_SESSION_UNLOCKED);
    }
  } catch {
    // Ignore storage errors
  }
}

export function isSessionUnlocked() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(KEY_SESSION_UNLOCKED) === 'true';
  } catch {
    return false;
  }
}

export function setSessionUnlocked(unlocked) {
  if (typeof window === 'undefined') return;
  try {
    if (unlocked) {
      sessionStorage.setItem(KEY_SESSION_UNLOCKED, 'true');
    } else {
      sessionStorage.removeItem(KEY_SESSION_UNLOCKED);
      sessionStorage.removeItem(KEY_ACTIVE_USER);
    }
  } catch {
    // Ignore storage errors
  }
}

export function authenticateUserByPin(inputPin) {
  const clean = String(inputPin || '').trim();
  if (!clean) return { success: false, error: 'PIN requerido' };

  const users = getUsersConfig();
  const matched = users.find(u => String(u.pin).trim() === clean);

  if (matched) {
    const safeUser = { id: matched.id, nombre: matched.nombre, rol: matched.rol };
    setActiveUser(safeUser);
    return { success: true, user: safeUser };
  }

  // Compatibilidad legacy si el PIN no coincide con ninguno pero es igual a recargas_security_pin_v2
  if (typeof window !== 'undefined') {
    const legacyPin = localStorage.getItem(KEY_PIN);
    if (legacyPin && legacyPin.trim() === clean) {
      const duenoUser = { id: 'dueno', nombre: 'Dueño', rol: 'admin' };
      setActiveUser(duenoUser);
      return { success: true, user: duenoUser };
    }
  }

  return { success: false, error: 'PIN de acceso incorrecto' };
}

export function verifySecurityPin(inputPin) {
  const auth = authenticateUserByPin(inputPin);
  return auth.success;
}



