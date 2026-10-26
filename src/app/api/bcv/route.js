import { NextResponse, connection } from 'next/server';

export async function GET() {
  await connection();

  // 1. Intentar API primaria actualizada en tiempo real (open.er-api.com con tasa oficial BCV)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();
      const tasaVes = Number(data?.rates?.VES);
      if (tasaVes && tasaVes > 0) {
        return NextResponse.json(
          {
            tasa: tasaVes,
            fecha: data.time_last_update_utc || new Date().toISOString(),
            fuente: 'open.er-api.com (BCV Oficial)',
            timestamp: Date.now()
          },
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache'
            }
          }
        );
      }
    }
  } catch (err) {
    console.warn('open.er-api no disponible, intentando exchangerate-api...', err.message);
  }

  // 2. Intentar API backup exchangerate-api
  try {
    const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    });

    if (res2.ok) {
      const data2 = await res2.json();
      const tasaVes = Number(data2?.rates?.VES);
      if (tasaVes && tasaVes > 0) {
        return NextResponse.json(
          {
            tasa: tasaVes,
            fecha: new Date().toISOString(),
            fuente: 'exchangerate-api.com (BCV Oficial)',
            timestamp: Date.now()
          },
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
      }
    }
  } catch (err2) {
    console.warn('API backup exchangerate-api falló:', err2.message);
  }

  // 3. Intentar ve.dolarapi.com
  try {
    const res3 = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    });

    if (res3.ok) {
      const data3 = await res3.json();
      const tasa = Number(data3.promedio || data3.venta || data3.compra);
      if (tasa && tasa > 0) {
        return NextResponse.json(
          {
            tasa,
            fecha: data3.fechaActualizacion || new Date().toISOString(),
            fuente: 've.dolarapi.com',
            timestamp: Date.now()
          },
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
      }
    }
  } catch (err3) {
    console.warn('API ve.dolarapi falló:', err3.message);
  }

  // 4. Fallback de contingencia si no hay internet o fallan todas las APIs
  return NextResponse.json(
    {
      tasa: 887.30,
      fecha: new Date().toISOString(),
      fuente: 'offline_fallback',
      isFallback: true
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
}
