/**
 * Obtiene el porcentaje de comisión correspondiente según la operadora:
 * Simple TV, CANTV e Inter cobran 20%.
 * Digitel, Movistar y Movilnet cobran el 15% por defecto.
 */
export function getComisionPorcentajeOperadora(operadoraId, config = {}) {
  const op = (operadoraId || '').toLowerCase();
  if (['simpletv', 'cantv', 'inter'].includes(op)) {
    return Number(config.comisionServiciosPorcentaje ?? 20);
  }
  return Number(config.comisionPorcentaje ?? 15);
}

/**
 * Calcula el monto a cobrar aplicando la comisión correspondiente por operadora
 * y la regla de redondeo (por defecto múltiplos de 10 Bs)
 */
export function calculateMontoCobrar(montoRecarga, config = {}, operadoraId = null, tarifasCustom = []) {
  if (!montoRecarga || montoRecarga <= 0) return 0;

  const porcentaje = getComisionPorcentajeOperadora(operadoraId, config);
  const multiplo = Number(config.redondeoMultiplo ?? 10);
  const op = (operadoraId || '').toLowerCase();
  const esServicio20 = ['simpletv', 'cantv', 'inter'].includes(op);

  // 1. Revisar si hay una tarifa específica en la tabla personalizada
  if (tarifasCustom && tarifasCustom.length > 0) {
    const custom = tarifasCustom.find(
      t => (!operadoraId || t.operadoraId === operadoraId) && Number(t.montoRecarga) === Number(montoRecarga)
    );
    if (custom && custom.montoCobrar) {
      // Si es Simple TV, CANTV o Inter, garantizar que aplique el 20% y no el viejo 15%
      if (esServicio20) {
        const cobro = Number(custom.montoCobrar);
        const margen = ((cobro - Number(montoRecarga)) / Number(montoRecarga)) * 100;
        if (margen < 18) {
          const conComision = Number(montoRecarga) * (1 + porcentaje / 100);
          return multiplo > 0 ? Math.ceil(conComision / multiplo) * multiplo : Math.round(conComision * 100) / 100;
        }
      }
      return Number(custom.montoCobrar);
    }
  }

  // 2. Si no hay tarifa fija, calcular con fórmula y redondeo
  const conComision = Number(montoRecarga) * (1 + porcentaje / 100);

  if (multiplo > 0) {
    return Math.ceil(conComision / multiplo) * multiplo;
  }

  return Math.round(conComision * 100) / 100;
}

/**
 * Calcula el arqueo y resumen financiero completo para una lista de transacciones del día
 */
export function calculateDailySummary(transacciones = [], config = {}, tasaBcv = 0, registrosAlquiler = []) {
  const summary = {
    totalRecargas: transacciones.length,
    totalMontoRecarga: 0,
    totalCobrado: 0,
    gananciaBruta: 0,
    totalEfectivo: 0,
    totalPunto: 0,
    totalBiopago: 0,
    // Desglose por Plataforma
    totalPayallRecargas: 0,
    totalPayallCobrado: 0,
    gananciaPayall: 0,
    countPayall: 0,
    totalPagoDirectoRecargas: 0,
    totalPagoDirectoCobrado: 0,
    gananciaPagoDirecto: 0,
    countPagoDirecto: 0,
    // Alquiler de Punto POS a Terceros (10%)
    totalAlquilerPasado: 0,
    totalAlquilerGananciaBs: 0,
    totalAlquilerPagarBs: 0,
    countAlquilerComerciantes: registrosAlquiler.length,
    countAlquilerTickets: 0,
    totalPuntoLoteGeneral: 0,
    // Deducciones y Costos Bancarios
    deduccionComisionPuntoBs: 0,
    deduccionBiopagoBs: 0,
    deduccionAlquilerPuntoBs: 0,
    deduccionPuntoBs: 0, // Conservado por compatibilidad
    totalDeduccionesBs: 0,
    gananciaNetaBs: 0,
    gananciaNetaUsd: 0,
    gananciaBrutaUsd: 0,
    tasaBcv: Number(tasaBcv || 887.30),
    deducirAlquilerPunto: Boolean(config.deducirAlquilerPunto)
  };

  for (const t of transacciones) {
    const recarga = Number(t.montoRecarga || 0);
    const cobrado = Number(t.montoCobrado || 0);
    const ganancia = cobrado - recarga;
    const plat = (t.plataforma || 'payall').toLowerCase();

    summary.totalMontoRecarga += recarga;
    summary.totalCobrado += cobrado;
    summary.gananciaBruta += ganancia;

    if (plat === 'pagodirecto') {
      summary.totalPagoDirectoRecargas += recarga;
      summary.totalPagoDirectoCobrado += cobrado;
      summary.gananciaPagoDirecto += ganancia;
      summary.countPagoDirecto += 1;
    } else {
      summary.totalPayallRecargas += recarga;
      summary.totalPayallCobrado += cobrado;
      summary.gananciaPayall += ganancia;
      summary.countPayall += 1;
    }

    if (t.metodo === 'mixto') {
      summary.totalEfectivo += Number(t.montoEfectivo || 0);
      summary.totalPunto += Number(t.montoPunto || 0);
      summary.totalBiopago += Number(t.montoBiopago || 0);
    } else if (t.metodo === 'efectivo') {
      summary.totalEfectivo += cobrado;
    } else if (t.metodo === 'punto') {
      summary.totalPunto += cobrado;
    } else if (t.metodo === 'biopago') {
      summary.totalBiopago += cobrado;
    }
  }

  // Procesar alquileres de punto a comerciantes externos (10% comisión)
  for (const r of registrosAlquiler) {
    const tot = Number(r.montoTotal || 0);
    const gan = Number(r.comisionBs || 0);
    const pag = Number(r.montoPagar || 0);
    const tix = Number(r.tickets || 1);

    summary.totalAlquilerPasado += tot;
    summary.totalAlquilerGananciaBs += gan;
    summary.totalAlquilerPagarBs += pag;
    summary.countAlquilerTickets += tix;
  }

  // Cierre de Lote General del Punto (Recargas propias por punto + Pasado por comerciantes externos)
  summary.totalPuntoLoteGeneral = summary.totalPunto + summary.totalAlquilerPasado;

  // 1. Deducción por comisión de Punto POS (el banco descuenta 0.75% del total del lote pasado por el punto)
  const comisionPuntoPct = Number(config.comisionPuntoPorcentaje ?? 0.75);
  if (comisionPuntoPct > 0 && summary.totalPuntoLoteGeneral > 0) {
    summary.deduccionComisionPuntoBs = summary.totalPuntoLoteGeneral * (comisionPuntoPct / 100);
  }

  // 2. Deducción por uso de BioPago (comisión retenida por huella)
  const bioPct = Number(config.biopagoPorcentaje ?? 2.0);
  if (bioPct > 0 && summary.totalBiopago > 0) {
    summary.deduccionBiopagoBs = summary.totalBiopago * (bioPct / 100);
  }

  // 3. Deducción por alquiler diario fijo del punto POS (solo si el usuario activa 'deducirAlquilerPunto')
  const rawAlquiler = config.alquilerPuntoUsd !== undefined && config.alquilerPuntoUsd !== null ? Number(config.alquilerPuntoUsd) : 1.78;
  const alquilerUsd = rawAlquiler > 0 ? Number(rawAlquiler.toFixed(2)) : 0;
  if (config.deducirAlquilerPunto && alquilerUsd > 0 && summary.tasaBcv > 0 && (summary.totalRecargas > 0 || summary.totalAlquilerPasado > 0)) {
    summary.deduccionAlquilerPuntoBs = Math.round(alquilerUsd * summary.tasaBcv * 100) / 100;
    summary.deduccionPuntoBs = summary.deduccionAlquilerPuntoBs;
  }

  // Total deducciones bancarias
  summary.totalDeduccionesBs =
    summary.deduccionComisionPuntoBs +
    summary.deduccionBiopagoBs +
    summary.deduccionAlquilerPuntoBs;

  // Ganancia Bruta Consolidada = Ganancia Recargas + Ganancia por Alquiler de Punto (10%)
  const gananciaBrutaConsolidada = summary.gananciaBruta + summary.totalAlquilerGananciaBs;

  // Ganancia neta real en el bolsillo = Ganancia bruta consolidada - Todas las deducciones
  summary.gananciaNetaBs = gananciaBrutaConsolidada - summary.totalDeduccionesBs;

  if (summary.tasaBcv > 0) {
    summary.gananciaBrutaUsd = gananciaBrutaConsolidada / summary.tasaBcv;
    summary.gananciaNetaUsd = summary.gananciaNetaBs / summary.tasaBcv;
  }

  return summary;
}

export function formatBs(monto) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(monto || 0)) + ' Bs.';
}

export function formatUsd(monto) {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(monto || 0));
}

/**
 * Valida de forma estricta que el monto cumpla con las reglas de la operadora:
 * - Digitel: >= 500 y múltiplo exacto de 500 Bs (500, 1000, 1500, 2000...).
 * - Movistar: >= 400 y múltiplo exacto de 400 Bs (400, 800, 1200, 1600...).
 * - Movilnet: >= 450 y pasos de 150 Bs (450, 600, 750, 900, 1050...).
 * - Simple TV / Inter / Cantv (esLibre): >= minMonto (500 Bs), permite decimales.
 */
export function validateMontoOperadora(monto, operadora) {
  if (!operadora) return { isValid: false, error: 'Operadora no especificada' };
  const num = Number(monto);
  if (!num || isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Ingresa un monto válido mayor a 0' };
  }

  const min = operadora.minMonto || 0;
  if (num < min) {
    return {
      isValid: false,
      error: `El monto mínimo para ${operadora.nombre} es de ${min} Bs.`,
      sugerido: min
    };
  }

  // Operadoras libres (Simple TV, Inter, Cantv)
  if (operadora.esLibre) {
    return { isValid: true, error: null };
  }

  // Telefonía: no se permiten decimales
  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: `${operadora.nombre} no permite decimales. Solo montos enteros.`,
      sugerido: Math.round(num)
    };
  }

  // Digitel: múltiplos exactos de 500
  if (operadora.id === 'digitel') {
    if (num % 500 !== 0) {
      const sugerido = Math.round(num / 500) * 500 || 500;
      return {
        isValid: false,
        error: `Digitel solo permite múltiplos exactos de 500 Bs (500, 1000, 1500, 2000...).`,
        sugerido: sugerido < 500 ? 500 : sugerido
      };
    }
  }

  // Movistar: múltiplos exactos de 400
  if (operadora.id === 'movistar') {
    if (num % 400 !== 0) {
      const sugerido = Math.round(num / 400) * 400 || 400;
      return {
        isValid: false,
        error: `Movistar solo permite múltiplos exactos de 400 Bs (400, 800, 1200, 1600...).`,
        sugerido: sugerido < 400 ? 400 : sugerido
      };
    }
  }

  // Movilnet: mínimo 450 y pasos de 150 (450, 600, 750, 900...)
  if (operadora.id === 'movilnet') {
    if ((num - 450) % 150 !== 0) {
      const steps = Math.round((num - 450) / 150);
      const sugerido = Math.max(450, 450 + steps * 150);
      return {
        isValid: false,
        error: `Movilnet requiere pasos de 150 Bs a partir de 450 Bs (450, 600, 750, 900...).`,
        sugerido
      };
    }
  }

  // Para cualquier otra con paso configurado
  if (operadora.paso && operadora.paso > 1) {
    if ((num - min) % operadora.paso !== 0) {
      const steps = Math.round((num - min) / operadora.paso);
      const sugerido = Math.max(min, min + steps * operadora.paso);
      return {
        isValid: false,
        error: `${operadora.nombre} requiere pasos de ${operadora.paso} Bs a partir de ${min} Bs.`,
        sugerido
      };
    }
  }

  return { isValid: true, error: null };
}
