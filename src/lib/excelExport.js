import * as XLSX from 'xlsx';

/**
 * Crea el workbook de transacciones diarias
 */
function createDailyWorkbook(transactions = [], totals = {}) {
  const headers = [
    'Hora',
    'Operadora',
    'Plataforma (Origen)',
    'Monto Recarga (Bs)',
    'Monto Cobrado (Bs)',
    'Efectivo (Bs)',
    'Punto POS (Bs)',
    'BioPago (Bs)',
    'Pago Móvil (Bs)',
    'Teléfono / Cliente',
    'Ganancia (Bs)'
  ];

  const dataRows = transactions.map((tx) => {
    const gan = Number(tx.montoCobrado || 0) - Number(tx.montoRecarga || 0);
    const plat = (tx.plataforma || 'payall').toLowerCase() === 'pagodirecto' ? 'PagoDirecto' : 'Payall';
    return [
      tx.hora || '',
      tx.operadoraNombre || '',
      plat,
      Number(tx.montoRecarga || 0),
      Number(tx.montoCobrado || 0),
      tx.metodo === 'mixto' ? (Number(tx.montoEfectivo || 0) || null) : (tx.metodo === 'efectivo' ? Number(tx.montoCobrado || 0) : null),
      tx.metodo === 'mixto' ? (Number(tx.montoPunto || 0) || null) : (tx.metodo === 'punto' ? Number(tx.montoCobrado || 0) : null),
      tx.metodo === 'mixto' ? (Number(tx.montoBiopago || 0) || null) : (tx.metodo === 'biopago' ? Number(tx.montoCobrado || 0) : null),
      tx.metodo === 'mixto' ? (Number(tx.montoPagoMovil || 0) || null) : (tx.metodo === 'pagomovil' ? Number(tx.montoCobrado || 0) : null),
      tx.telefono || '',
      gan
    ];
  });

  const totalRow = [
    'TOTALES DEL DÍA',
    '',
    '',
    Number(totals.montoRecarga || 0),
    Number(totals.montoCobrado || 0),
    Number(totals.efectivo || 0),
    Number(totals.punto || 0),
    Number(totals.biopago || 0),
    Number(totals.pagoMovil || 0),
    '',
    Number(totals.ganancia || 0)
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totalRow]);
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro Recargas');
  return workbook;
}

/**
 * Crea el workbook de reporte semanal
 */
function createWeeklyWorkbook(weekData = {}, daysOfWeek = [], tasaBcv = 0) {
  const headers = [
    'Día',
    'Fecha',
    'Ganancia Total Bruta (Bs)',
    'Ganancia Recargas (Bs)',
    'Payall (Bs)',
    'PagoDirecto (Bs)',
    'Alquiler POS & BioPago (Bs)',
    'Deducciones Bancarias (Bs)',
    'Ganancia Neta Real (Bs)',
    'Ganancia Neta Real ($ BCV)',
    'Ganancia Bruta ($ BCV)',
    'Cantidad Recargas'
  ];

  const dataRows = (weekData.rows || []).map((r) => {
    const totalConsolidada = Number(r.totalConsolidadaBs ?? (Number(r.totalGanancia || 0) + Number(r.totalAlquilerGananciaBs || 0)));
    return [
      r.nombre,
      r.fechaIso,
      totalConsolidada,
      Number(r.gananciaRecargasBs ?? r.totalGanancia ?? 0),
      Number(r.totalPayall || 0),
      Number(r.totalPagoDirecto || 0),
      Number(r.totalAlquilerGananciaBs || 0),
      Number(r.totalDeduccionesBs || 0),
      Number(r.gananciaNetaBs ?? totalConsolidada),
      Number((r.gananciaNetaUsd ?? (tasaBcv > 0 ? totalConsolidada / tasaBcv : 0)).toFixed(2)),
      Number((r.dayConsolidadaUsd ?? r.dayBrutaUsd ?? (tasaBcv > 0 ? totalConsolidada / tasaBcv : 0)).toFixed(2)),
      Number(r.count || 0)
    ];
  });

  const totalRow = [
    'TOTAL SEMANAL',
    '',
    Number(weekData.grandTotalConsolidadaBs || 0),
    Number(weekData.grandTotalRecargasBs ?? weekData.grandTotalBs ?? 0),
    Number(weekData.grandTotalPayall || 0),
    Number(weekData.grandTotalPagoDirecto || 0),
    Number(weekData.grandTotalAlquilerGanancia || 0),
    Number(weekData.grandTotalDeduccionesBs || 0),
    Number((weekData.grandTotalNetaBs ?? weekData.grandTotalConsolidadaBs) || 0),
    Number((weekData.grandTotalNetaUsd ?? weekData.grandTotalConsolidadaUsd ?? 0).toFixed(2)),
    Number((weekData.grandTotalConsolidadaUsd || weekData.grandTotalUsd || 0).toFixed(2)),
    Number(weekData.grandTotalRecargas || 0)
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totalRow]);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 22 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ganancia Semanal');
  return workbook;
}

/**
 * Descarga garantizada en el navegador con soporte de extensión .xlsx
 */
function triggerBrowserDownload(blob, filename) {
  const safeFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  if (typeof window !== 'undefined' && window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, safeFilename);
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = safeFilename;
  a.setAttribute('download', safeFilename);

  document.body.appendChild(a);
  a.click();

  // Dejar tiempo suficiente (60 seg) para que Chrome/Windows asigne el nombre
  // y extensión .xlsx antes de revocar el enlace temporal
  setTimeout(() => {
    try {
      if (document.body.contains(a)) document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {}
  }, 60000);
}

/**
 * Exporta las transacciones del día seleccionado a Excel (.xlsx)
 */
export async function exportDailyTransactions(transactions = [], selectedDate = '', totals = {}) {
  const filename = `Recargas_Express28_${selectedDate || 'Diario'}.xlsx`;

  try {
    const res = await fetch('/api/export-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'diario',
        transactions,
        selectedDate,
        totals
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const excelBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      triggerBrowserDownload(excelBlob, filename);
      return;
    }
  } catch (err) {
    console.warn('API route fallo, usando generador local de respaldo:', err);
  }

  // Fallback directo en cliente
  const workbook = createDailyWorkbook(transactions, totals);
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const localBlob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  triggerBrowserDownload(localBlob, filename);
}

/**
 * Exporta el reporte semanal consolidado a Excel (.xlsx)
 */
export async function exportWeeklyReport(weekData = {}, daysOfWeek = [], tasaBcv = 0) {
  const filename = `Reporte_Semanal_Express28_${daysOfWeek[0]?.fechaIso || 'Semana'}.xlsx`;

  try {
    const res = await fetch('/api/export-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'semanal',
        weekData,
        daysOfWeek,
        tasaBcv
      })
    });

    if (res.ok) {
      const blob = await res.blob();
      const excelBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      triggerBrowserDownload(excelBlob, filename);
      return;
    }
  } catch (err) {
    console.warn('API route fallo, usando generador local de respaldo:', err);
  }

  // Fallback directo en cliente
  const workbook = createWeeklyWorkbook(weekData, daysOfWeek, tasaBcv);
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const localBlob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  triggerBrowserDownload(localBlob, filename);
}
