/**
 * Consulta la tasa oficial del Banco Central de Venezuela (BCV)
 * con fallback y caché local para resiliencia offline.
 */
const CACHE_KEY = 'recargas_tasa_bcv_cache';
const MANUAL_KEY = 'recargas_tasa_bcv_manual';

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
