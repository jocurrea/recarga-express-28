-- ========================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE PARA RECARGA EXPRESS 28
-- Copia y pega todo este script en el "SQL Editor" de Supabase
-- ========================================================

-- 1. Tabla de Transacciones de Recargas
CREATE TABLE IF NOT EXISTS transacciones (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL, -- Formato YYYY-MM-DD
  hora TEXT,
  operadora_id TEXT NOT NULL,
  operadora_nombre TEXT NOT NULL,
  plataforma TEXT DEFAULT 'payall', -- 'payall' | 'pagodirecto'
  monto_recarga NUMERIC(12, 2) NOT NULL DEFAULT 0,
  monto_cobrado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  metodo TEXT NOT NULL DEFAULT 'efectivo', -- 'efectivo' | 'punto' | 'biopago' | 'mixto'
  monto_efectivo NUMERIC(12, 2) DEFAULT 0,
  monto_punto NUMERIC(12, 2) DEFAULT 0,
  monto_biopago NUMERIC(12, 2) DEFAULT 0,
  telefono TEXT,
  cliente_nombre TEXT,
  estado_pago TEXT DEFAULT 'pagado', -- 'pagado' | 'pendiente'
  fecha_pago TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones(estado_pago);

-- 2. Tabla de Alquiler de Punto POS a Terceros (10%)
CREATE TABLE IF NOT EXISTS alquiler_punto (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha TEXT NOT NULL, -- Formato YYYY-MM-DD
  hora TEXT,
  monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  comision_porcentaje NUMERIC(5, 2) DEFAULT 10,
  comision_bs NUMERIC(12, 2) DEFAULT 0,
  monto_pagar NUMERIC(12, 2) DEFAULT 0,
  tickets INTEGER DEFAULT 1,
  transferido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alquiler_fecha ON alquiler_punto(fecha);

-- 3. Tabla de Ganancias Manuales de Payall
CREATE TABLE IF NOT EXISTS payall_manual_ganancias (
  fecha TEXT PRIMARY KEY, -- Formato YYYY-MM-DD
  monto_bs NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Configuración y Tarifas
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de acceso completas (Lectura y Escritura) para la API pública
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo transacciones" ON transacciones;
CREATE POLICY "Permitir todo transacciones" ON transacciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE alquiler_punto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo alquiler_punto" ON alquiler_punto;
CREATE POLICY "Permitir todo alquiler_punto" ON alquiler_punto FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE payall_manual_ganancias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo payall_manual_ganancias" ON payall_manual_ganancias;
CREATE POLICY "Permitir todo payall_manual_ganancias" ON payall_manual_ganancias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo configuracion" ON configuracion;
CREATE POLICY "Permitir todo configuracion" ON configuracion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
