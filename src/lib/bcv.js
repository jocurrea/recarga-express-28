/**
 * Consulta la tasa oficial del Banco Central de Venezuela (BCV)
 * con fallback y caché local para resiliencia offline.
 */
import { syncConfigToSupabase } from './supabase';

const CACHE_KEY = 'recargas_tasa_bcv_cache';
const MANUAL_KEY = 'recargas_tasa_bcv_manual';
const DAILY_RATES_KEY = 'recargas_tasas_diarias_bcv';

export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el mapa de tasas diarias registradas en localStorage.
 * Retorna un objeto con formato { 'YYYY-MM-DD': number }
 */
export function getDailyBcvRates() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DAILY_RATES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Guarda el mapa completo de tasas diarias en localStorage.
 */
export function saveDailyBcvRates(ratesMap) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DAILY_RATES_KEY, JSON.stringify(ratesMap || {}));
    } catch {
      // Ignorar
    }
  }
  return ratesMap;
}

/**
 * Obtiene la tasa del BCV asignada a una fecha específica (YYYY-MM-DD).
 * Si ese día no tiene una tasa explícita, busca la tasa más reciente registrada
 * anterior a esa fecha, o recurre a la tasa manual/fallback general.
 */
export function getBcvRateForDate(dateStr, dailyRatesMap = null) {
  const rates = dailyRatesMap || getDailyBcvRates();
  if (dateStr && rates && rates[dateStr] && Number(rates[dateStr]) > 0) {
    return Number(rates[dateStr]);
  }

  // Buscar tasa más cercana registrada en o antes de dateStr
  if (dateStr && rates) {
    const priorDates = Object.keys(rates)
      .filter((d) => d <= dateStr && Number(rates[d]) > 0)
      .sort();
    if (priorDates.length > 0) {
      const closestDate = priorDates[priorDates.length - 1];
      return Number(rates[closestDate]);
    }

    // Si la fecha buscada es anterior a todo lo registrado, tomar la primera registrada
    const allDates = Object.keys(rates)
      .filter((d) => Number(rates[d]) > 0)
      .sort();
    if (allDates.length > 0) {
      return Number(rates[allDates[0]]);
    }
  }

  return getManualBcvRate();
}

/**
 * Guarda la tasa oficial del BCV para una fecha específica (YYYY-MM-DD).
 * Sincroniza localmente y en segundo plano con Supabase.
 */
export function saveBcvRateForDate(dateStr, rate) {
  const numRate = Number(rate);
  if (!dateStr || !numRate || numRate <= 0) return numRate;

  const currentRates = getDailyBcvRates();
  currentRates[dateStr] = Math.round(numRate * 100) / 100;
  saveDailyBcvRates(currentRates);

  const today = getTodayDateStr();
  if (dateStr === today) {
    saveManualBcvRate(numRate);
  }

  // Sincronizar en la nube con Supabase en la tabla 'configuracion'
  syncConfigToSupabase('tasas_diarias_bcv', currentRates);

  return numRate;
}

export function getManualBcvRate() {
  if (typeof window === 'undefined') return 886.23;
  try {
    const val = localStorage.getItem(MANUAL_KEY);
    if (val && Number(val) > 0) return Number(val);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.tasa > 0) return Number(parsed.tasa);
    }
    return 886.23;
  } catch {
    return 886.23;
  }
}

export function saveManualBcvRate(rate) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANUAL_KEY, String(rate));
  }
  return rate;
}

export function clearManualBcvRate() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MANUAL_KEY);
  }
}

/**
 * Obtiene la tasa del BCV.
 * @param {boolean} forceRefresh - Si es true, ignora cualquier tasa manual y consulta al banco directamente.
 */
export async function getTasaBcv(forceRefresh = false) {
  // 1. Si no es forzado, revisar si hay una tasa guardada en local
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const manual = localStorage.getItem(MANUAL_KEY);
      if (manual && Number(manual) > 0) {
        return {
          tasa: Number(manual),
          fecha: new Date().toISOString(),
          isManual: true
        };
      }
    } catch {
      // Ignorar
    }
  }

  // 2. Intentar primero con nuestra ruta API interna de Next.js
  try {
    const res = await fetch(`/api/bcv?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const numTasa = Number(data.tasa);
      if (numTasa && numTasa > 0) {
        const payload = {
          tasa: numTasa,
          fecha: data.fecha || new Date().toISOString(),
          fuente: data.fuente || 'api/bcv',
          timestamp: Date.now()
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
          localStorage.setItem(MANUAL_KEY, String(numTasa));
        }
        return payload;
      }
    }
  } catch (err) {
    console.warn('Fallo consulta /api/bcv, intentando directo...', err);
  }

  // 3. Intentar directo desde el navegador a open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const tasa = Number(data?.rates?.VES);
      if (tasa && tasa > 0) {
        const cachePayload = {
          tasa,
          fecha: data.time_last_update_utc || new Date().toISOString(),
          fuente: 'open.er-api.com',
          timestamp: Date.now()
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
          localStorage.setItem(MANUAL_KEY, String(tasa));
        }
        return cachePayload;
      }
    }
  } catch (err) {
    console.warn('Fallo consulta directa API open.er-api:', err);
  }

  // 4. Fallback a caché previa si existe
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.tasa > 0) return parsed;
      }
    } catch {
      // Ignorar
    }
  }

  // 5. Fallback final oficial
  return {
    tasa: 887.30,
    fecha: new Date().toISOString(),
    isFallback: true
  };
}
