import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    let payload;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const raw = formData.get('data');
      payload = raw ? JSON.parse(raw) : {};
    } else {
      payload = await request.json();
    }

    const { type, transactions = [], selectedDate = '', totals = {}, weekData = {}, daysOfWeek = [], tasaBcv = 0 } = payload;

    const workbook = XLSX.utils.book_new();
    let filename = `Recargas_Express28_${selectedDate || 'Diario'}.xlsx`;

    if (type === 'semanal') {
      filename = `Reporte_Semanal_Express28_${daysOfWeek[0]?.fechaIso || 'Semana'}.xlsx`;
      const headers = [
        'Día',
        'Fecha',
        'Ganancia Diaria (Bs)',
        'Payall (Bs)',
        'PagoDirecto (Bs)',
        'Equivalente $ BCV',
        'Cantidad Recargas'
      ];

      const dataRows = (weekData.rows || []).map((r) => {
        const usd = tasaBcv > 0 ? r.totalGanancia / tasaBcv : 0;
        return [
          r.nombre,
          r.fechaIso,
          Number(r.totalGanancia || 0),
          Number(r.totalPayall || 0),
          Number(r.totalPagoDirecto || 0),
          Number(usd.toFixed(2)),
          Number(r.count || 0)
        ];
      });

      const totalRow = [
        'TOTAL SEMANAL',
        '',
        Number(weekData.grandTotalBs || 0),
        Number(weekData.grandTotalPayall || 0),
        Number(weekData.grandTotalPagoDirecto || 0),
        Number((weekData.grandTotalUsd || 0).toFixed(2)),
        Number(weekData.grandTotalRecargas || 0)
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totalRow]);
      worksheet['!cols'] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ganancia Semanal');
    } else {
      // Diario
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro Recargas');
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error generating Excel in API:', error);
    return new Response(JSON.stringify({ error: 'Error generating excel' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
