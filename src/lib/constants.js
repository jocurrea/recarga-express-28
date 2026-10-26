export const OPERADORAS = [
  {
    id: 'digitel',
    nombre: 'Digitel',
    categoria: 'telefonia',
    plataformas: ['payall', 'pagodirecto'],
    color: '#DC2626', // Rojo corporativo Digitel
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    activeBg: 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/40 border-red-400',
    minMonto: 500,
    paso: 500,
    esLibre: false,
    permiteDecimales: false,
    comisionPorcentaje: 15,
    reglaTexto: 'De 500 Bs en 500 Bs (mínimo 500 Bs)',
    montosDefault: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000]
  },
  {
    id: 'movistar',
    nombre: 'Movistar',
    categoria: 'telefonia',
    plataformas: ['payall', 'pagodirecto'],
    color: '#0284C7', // Azul Movistar
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    activeBg: 'bg-gradient-to-br from-sky-600 to-sky-700 text-white shadow-lg shadow-sky-900/40 border-sky-400',
    minMonto: 400,
    paso: 400,
    esLibre: false,
    permiteDecimales: false,
    comisionPorcentaje: 15,
    reglaTexto: 'De 400 Bs en 400 Bs (mínimo 400 Bs)',
    montosDefault: [400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 4000]
  },
  {
    id: 'movilnet',
    nombre: 'Movilnet',
    categoria: 'telefonia',
    plataformas: ['payall', 'pagodirecto'],
    color: '#EA580C', // Naranja Movilnet
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    activeBg: 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-900/40 border-orange-400',
    minMonto: 450,
    paso: 150,
    esLibre: false,
    permiteDecimales: false,
    comisionPorcentaje: 15,
    reglaTexto: 'Mínimo 450 Bs y pasos de 150 Bs (450, 600, 750, 900...)',
    montosDefault: [450, 600, 750, 900, 1050, 1200, 1350, 1500, 1800, 2100]
  },
  {
    id: 'simpletv',
    nombre: 'Simple TV',
    categoria: 'servicios',
    plataformas: ['pagodirecto'], // Simple TV NO está en Payall, solo en PagoDirecto
    color: '#8B5CF6', // Purple
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    activeBg: 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-900/40 border-purple-400',
    minMonto: 500,
    paso: 1,
    esLibre: true,
    permiteDecimales: true,
    comisionPorcentaje: 20, // 20% de comisión
    reglaTexto: 'Libre a partir de 500 Bs (acepta decimales ej: 575,50 ó 986,36)',
    montosDefault: [500, 750, 1000, 1250, 1500, 2000, 2500, 3000]
  },
  {
    id: 'cantv',
    nombre: 'CANTV',
    categoria: 'servicios',
    plataformas: ['payall', 'pagodirecto'],
    color: '#0D9488', // Teal
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    activeBg: 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-900/40 border-teal-400',
    minMonto: 200,
    paso: 1,
    esLibre: true,
    permiteDecimales: true,
    comisionPorcentaje: 20, // 20% de comisión
    reglaTexto: 'Pago de saldo / deuda libre (mínimo 200 Bs)',
    montosDefault: [200, 300, 500, 800, 1000, 1500]
  },
  {
    id: 'inter',
    nombre: 'Inter',
    categoria: 'servicios',
    plataformas: ['payall', 'pagodirecto'],
    color: '#4F46E5', // Indigo
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    activeBg: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/40 border-indigo-400',
    minMonto: 500,
    paso: 1,
    esLibre: true,
    permiteDecimales: true,
    comisionPorcentaje: 20, // 20% de comisión
    reglaTexto: 'Libre a partir de 500 Bs (acepta decimales ej: 575,50 ó 986,36)',
    montosDefault: [500, 750, 1000, 1250, 1500, 2000, 2500, 3000]
  }
];

export const METODOS_PAGO = [
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    icono: 'Banknote',
    color: 'emerald',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    buttonActive: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 border-emerald-400'
  },
  {
    id: 'punto',
    nombre: 'Punto (POS)',
    icono: 'CreditCard',
    color: 'blue',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    buttonActive: 'bg-blue-600 text-white shadow-lg shadow-blue-950/60 border-blue-400'
  },
  {
    id: 'biopago',
    nombre: 'BioPago',
    icono: 'Fingerprint',
    color: 'amber',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    buttonActive: 'bg-amber-600 text-white shadow-lg shadow-amber-950/60 border-amber-400'
  },
  {
    id: 'mixto',
    nombre: 'Mixto',
    icono: 'Split',
    color: 'purple',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    buttonActive: 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 border-purple-400'
  }
];

export const DEFAULT_CONFIG = {
  comisionPorcentaje: 15, // 15% por defecto para telefonía (Digitel, Movistar, Movilnet)
  comisionServiciosPorcentaje: 20, // 20% exclusivo para servicios (Simple TV, CANTV, Inter)
  redondeoMultiplo: 10,   // Redondear a los siguientes 10 Bs (no existen billetes de 5 Bs)
  comisionPuntoPorcentaje: 0.75, // 0.75% que descuenta el banco por ventas pasadas por Punto POS
  alquilerPuntoUsd: 1.777, // $1.777 diario de alquiler del POS bancario
  deducirAlquilerPunto: false, // Por defecto no deducir alquiler fijo de las recargas (evita números negativos innecesarios)
  biopagoPorcentaje: 2.0,  // 2% de comisión BioPago
  tasaBcvManual: 887.30,   // Tasa oficial actualizada por el usuario
  nombreNegocio: 'Recarga Express 28'
};

export const OPERADORA_THEMES = {
  digitel: {
    id: 'digitel',
    colorHex: '#DC2626',
    borderSelected: 'border-red-500 ring-2 ring-red-500/50',
    bgSelectedLight: 'bg-red-50/90 text-red-950 font-bold',
    bgSelectedDark: 'bg-red-950/40 text-red-100 font-bold',
    btnPrimary: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/30',
    presetSelected: 'bg-red-600 text-white border-red-600 shadow-sm',
    presetSubtitleSelected: 'text-red-100',
    accentText: 'text-red-600 dark:text-red-400',
    stepBadge: 'bg-red-500/10 text-red-600 dark:text-red-400',
    ringFocus: 'focus:ring-red-500',
    inputFocusBorder: 'focus:border-red-500'
  },
  movistar: {
    id: 'movistar',
    colorHex: '#0284C7',
    borderSelected: 'border-sky-500 ring-2 ring-sky-500/50',
    bgSelectedLight: 'bg-sky-50/90 text-sky-950 font-bold',
    bgSelectedDark: 'bg-sky-950/40 text-sky-100 font-bold',
    btnPrimary: 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-950/30',
    presetSelected: 'bg-sky-600 text-white border-sky-600 shadow-sm',
    presetSubtitleSelected: 'text-sky-100',
    accentText: 'text-sky-600 dark:text-sky-400',
    stepBadge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    ringFocus: 'focus:ring-sky-500',
    inputFocusBorder: 'focus:border-sky-500'
  },
  movilnet: {
    id: 'movilnet',
    colorHex: '#EA580C',
    borderSelected: 'border-orange-500 ring-2 ring-orange-500/50',
    bgSelectedLight: 'bg-orange-50/90 text-orange-950 font-bold',
    bgSelectedDark: 'bg-orange-950/40 text-orange-100 font-bold',
    btnPrimary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-900/30',
    presetSelected: 'bg-orange-600 text-white border-orange-600 shadow-sm',
    presetSubtitleSelected: 'text-orange-100',
    accentText: 'text-orange-600 dark:text-orange-400',
    stepBadge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    ringFocus: 'focus:ring-orange-500',
    inputFocusBorder: 'focus:border-orange-500'
  },
  simpletv: {
    id: 'simpletv',
    colorHex: '#8B5CF6',
    borderSelected: 'border-purple-500 ring-2 ring-purple-500/50',
    bgSelectedLight: 'bg-purple-50/90 text-purple-950 font-bold',
    bgSelectedDark: 'bg-purple-950/40 text-purple-100 font-bold',
    btnPrimary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-950/30',
    presetSelected: 'bg-purple-600 text-white border-purple-600 shadow-sm',
    presetSubtitleSelected: 'text-purple-100',
    accentText: 'text-purple-600 dark:text-purple-400',
    stepBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    ringFocus: 'focus:ring-purple-500',
    inputFocusBorder: 'focus:border-purple-500'
  },
  cantv: {
    id: 'cantv',
    colorHex: '#0D9488',
    borderSelected: 'border-teal-500 ring-2 ring-teal-500/50',
    bgSelectedLight: 'bg-teal-50/90 text-teal-950 font-bold',
    bgSelectedDark: 'bg-teal-950/40 text-teal-100 font-bold',
    btnPrimary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-950/30',
    presetSelected: 'bg-teal-600 text-white border-teal-600 shadow-sm',
    presetSubtitleSelected: 'text-teal-100',
    accentText: 'text-teal-600 dark:text-teal-400',
    stepBadge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    ringFocus: 'focus:ring-teal-500',
    inputFocusBorder: 'focus:border-teal-500'
  },
  inter: {
    id: 'inter',
    colorHex: '#4F46E5',
    borderSelected: 'border-indigo-500 ring-2 ring-indigo-500/50',
    bgSelectedLight: 'bg-indigo-50/90 text-indigo-950 font-bold',
    bgSelectedDark: 'bg-indigo-950/40 text-indigo-100 font-bold',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-950/30',
    presetSelected: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
    presetSubtitleSelected: 'text-indigo-100',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    stepBadge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    ringFocus: 'focus:ring-indigo-500',
    inputFocusBorder: 'focus:border-indigo-500'
  }
};
