import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// TRANSACCIONES (RECARGAS)
// ==========================================
export function mapRowToTx(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    hora: row.hora || '',
    operadoraId: row.operadora_id,
    operadoraNombre: row.operadora_nombre,
    plataforma: row.plataforma || 'payall',
    montoRecarga: Number(row.monto_recarga || 0),
    montoCobrado: Number(row.monto_cobrado || 0),
    metodo: row.metodo || 'efectivo',
    montoEfectivo: Number(row.monto_efectivo || 0),
    montoPunto: Number(row.monto_punto || 0),
    montoBiopago: Number(row.monto_biopago || 0),
    telefono: row.telefono || '',
    clienteNombre: row.cliente_nombre || '',
    estadoPago: row.estado_pago || 'pagado',
    fechaPago: row.fecha_pago || null
  };
}

export function mapTxToRow(tx) {
  return {
    id: tx.id,
    fecha: tx.fecha,
    hora: tx.hora || '',
    operadora_id: tx.operadoraId,
    operadora_nombre: tx.operadoraNombre,
    plataforma: tx.plataforma || 'payall',
    monto_recarga: Number(tx.montoRecarga || 0),
    monto_cobrado: Number(tx.montoCobrado || 0),
    metodo: tx.metodo || 'efectivo',
    monto_efectivo: Number(tx.montoEfectivo || 0),
    monto_punto: Number(tx.montoPunto || 0),
    monto_biopago: Number(tx.montoBiopago || 0),
    telefono: tx.telefono || '',
    cliente_nombre: tx.clienteNombre || '',
    estado_pago: tx.estadoPago || 'pagado',
    fecha_pago: tx.fechaPago || null
  };
}

export async function fetchTransactionsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.warn('Error fetching transacciones from Supabase:', error.message);
      return null;
    }
    return (data || []).map(mapRowToTx);
  } catch (err) {
    console.warn('Error connecting to Supabase transacciones:', err);
    return null;
  }
}

export async function syncTransactionToSupabase(tx) {
  if (!supabase) return;
  try {
    const row = mapTxToRow(tx);
    const { error } = await supabase
      .from('transacciones')
      .upsert([row], { onConflict: 'id' });

    if (error) {
      console.warn('Error saving tx to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Error syncing tx to Supabase:', err);
  }
}

export async function deleteTransactionFromSupabase(id) {
  if (!supabase) return;
  try {
    await supabase.from('transacciones').delete().eq('id', id);
  } catch (err) {
    console.warn('Error deleting tx from Supabase:', err);
  }
}

// ==========================================
// ALQUILER DE PUNTO DE VENTA (10%)
// ==========================================
export function mapRowToAlquiler(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    fecha: row.fecha,
    hora: row.hora || '',
    montoTotal: Number(row.monto_total || 0),
    comisionPorcentaje: Number(row.comision_porcentaje ?? 10),
    comisionBs: Number(row.comision_bs || 0),
    montoPagar: Number(row.monto_pagar || 0),
    tickets: Number(row.tickets || 1),
    transferido: Boolean(row.transferido)
  };
}

export function mapAlquilerToRow(item) {
  return {
    id: item.id,
    nombre: item.nombre,
    fecha: item.fecha,
    hora: item.hora || '',
    monto_total: Number(item.montoTotal || 0),
    comision_porcentaje: Number(item.comisionPorcentaje ?? 10),
    comision_bs: Number(item.comisionBs || 0),
    monto_pagar: Number(item.montoPagar || 0),
    tickets: Number(item.tickets || 1),
    transferido: Boolean(item.transferido)
  };
}

export async function fetchAlquilerFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('alquiler_punto')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.warn('Error fetching alquiler from Supabase:', error.message);
      return null;
    }
    return (data || []).map(mapRowToAlquiler);
  } catch (err) {
    console.warn('Error connecting to Supabase alquiler:', err);
    return null;
  }
}

export async function syncAlquilerToSupabase(item) {
  if (!supabase) return;
  try {
    const row = mapAlquilerToRow(item);
    await supabase.from('alquiler_punto').upsert([row], { onConflict: 'id' });
  } catch (err) {
    console.warn('Error syncing alquiler to Supabase:', err);
  }
}

export async function deleteAlquilerFromSupabase(id) {
  if (!supabase) return;
  try {
    await supabase.from('alquiler_punto').delete().eq('id', id);
  } catch (err) {
    console.warn('Error deleting alquiler from Supabase:', err);
  }
}

// ==========================================
// GANANCIAS MANUALES DE PAYALL
// ==========================================
export async function fetchPayallManualFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('payall_manual_ganancias')
      .select('*');

    if (error) return null;
    const result = {};
    (data || []).forEach(row => {
      result[row.fecha] = Number(row.monto_bs || 0);
    });
    return result;
  } catch {
    return null;
  }
}

export async function syncPayallManualToSupabase(fechaIso, montoBs) {
  if (!supabase) return;
  try {
    if (montoBs === '' || montoBs === null || isNaN(Number(montoBs))) {
      await supabase.from('payall_manual_ganancias').delete().eq('fecha', fechaIso);
    } else {
      await supabase.from('payall_manual_ganancias').upsert([
        { fecha: fechaIso, monto_bs: Number(montoBs), updated_at: new Date().toISOString() }
      ], { onConflict: 'fecha' });
    }
  } catch (err) {
    console.warn('Error syncing payall manual to Supabase:', err);
  }
}

// ==========================================
// CONFIGURACIÓN Y TARIFAS
// ==========================================
export async function fetchConfigFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('configuracion').select('*');
    if (error || !data) return null;
    const configRow = data.find(r => r.clave === 'config');
    const tarifasRow = data.find(r => r.clave === 'tarifas');
    const pinRow = data.find(r => r.clave === 'security_pin');
    const usersRow = data.find(r => r.clave === 'security_users');
    const tasasRow = data.find(r => r.clave === 'tasas_diarias_bcv');
    return {
      config: configRow ? configRow.valor : null,
      tarifas: tarifasRow ? tarifasRow.valor : null,
      securityPin: pinRow ? pinRow.valor : null,
      securityUsers: usersRow ? usersRow.valor : null,
      tasasDiarias: tasasRow ? tasasRow.valor : null
    };
  } catch {
    return null;
  }
}

export async function syncConfigToSupabase(clave, valor) {
  if (!supabase) return;
  try {
    await supabase.from('configuracion').upsert([
      { clave, valor, updated_at: new Date().toISOString() }
    ], { onConflict: 'clave' });
  } catch (err) {
    console.warn('Error syncing config to Supabase:', err);
  }
}
