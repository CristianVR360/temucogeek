-- ==============================================================================
-- SCRIPT DE BASE DE DATOS SUPABASE: ENCUESTAS DE SATISFACCIÓN TEMUGEEK
-- ==============================================================================
-- Copia y ejecuta este script en el SQL Editor de tu proyecto de Supabase.
-- Incluye las 3 tablas con Row Level Security (RLS) habilitado e índices.
-- ==============================================================================

-- 1. TABLA: encuestas_cosplay (100% Anónima)
CREATE TABLE IF NOT EXISTS public.encuestas_cosplay (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nota_organizacion INT CHECK (nota_organizacion BETWEEN 1 AND 10),
    nota_camerinos INT CHECK (nota_camerinos BETWEEN 1 AND 5),
    nota_ganadores INT CHECK (nota_ganadores BETWEEN 1 AND 10),
    justificacion_ganadores TEXT DEFAULT '',
    comentarios TEXT DEFAULT ''
);

-- 2. TABLA: encuestas_expositores (Identificada)
CREATE TABLE IF NOT EXISTS public.encuestas_expositores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre_stand TEXT NOT NULL,
    nombre_contacto TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    tipo_stand TEXT DEFAULT 'Comercial',
    nota_logistica INT CHECK (nota_logistica BETWEEN 1 AND 5),
    nota_publico INT CHECK (nota_publico BETWEEN 1 AND 5),
    resultado_comercial TEXT DEFAULT 'Bueno',
    interes_proxima_edicion TEXT DEFAULT 'Sí, definitivamente',
    feedback_mejoras TEXT DEFAULT ''
);

-- 3. TABLA: encuestas_publico (Público General + Entrada Gratis + Ley Datos N° 21.716)
CREATE TABLE IF NOT EXISTS public.encuestas_publico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre_completo TEXT NOT NULL,
    rut TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    medio_difusion TEXT DEFAULT '',
    nota_general INT CHECK (nota_general BETWEEN 1 AND 10),
    zona_favorita TEXT DEFAULT 'Cosplay',
    nps_recomendacion INT CHECK (nps_recomendacion BETWEEN 1 AND 10),
    nota_instalaciones INT CHECK (nota_instalaciones BETWEEN 1 AND 5),
    nota_ingreso INT CHECK (nota_ingreso BETWEEN 1 AND 5),
    nota_comida INT CHECK (nota_comida BETWEEN 1 AND 5),
    nota_limpieza INT CHECK (nota_limpieza BETWEEN 1 AND 5),
    nota_tiendas INT CHECK (nota_tiendas BETWEEN 1 AND 5),
    precio_calidad TEXT DEFAULT '',
    aspecto_mejora TEXT DEFAULT '',
    sugerencias TEXT DEFAULT '',
    acepta_ley_datos BOOLEAN NOT NULL DEFAULT true,
    estado_entrada TEXT DEFAULT 'Pendiente' -- 'Pendiente', 'Entrada Enviada'
);

-- ALTER TABLE PARA AGREGAR COLUMNAS FALTANTES SI LA TABLA YA EXISTÍA EN SUPABASE
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS medio_difusion TEXT DEFAULT '';
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS nps_recomendacion INT CHECK (nps_recomendacion BETWEEN 1 AND 10);
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS nota_ingreso INT CHECK (nota_ingreso BETWEEN 1 AND 5);
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS nota_comida INT CHECK (nota_comida BETWEEN 1 AND 5);
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS nota_limpieza INT CHECK (nota_limpieza BETWEEN 1 AND 5);
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS nota_tiendas INT CHECK (nota_tiendas BETWEEN 1 AND 5);
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS precio_calidad TEXT DEFAULT '';
ALTER TABLE public.encuestas_publico ADD COLUMN IF NOT EXISTS aspecto_mejora TEXT DEFAULT '';

-- HABILITAR ROW LEVEL SECURITY (RLS) EN LAS 3 TABLAS
ALTER TABLE public.encuestas_cosplay ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuestas_expositores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuestas_publico ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO PARA INSERTAR (PÚBLICO ANON)
DROP POLICY IF EXISTS "Permitir insercion publica encuestas cosplay" ON public.encuestas_cosplay;
CREATE POLICY "Permitir insercion publica encuestas cosplay" ON public.encuestas_cosplay FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion publica encuestas expositores" ON public.encuestas_expositores;
CREATE POLICY "Permitir insercion publica encuestas expositores" ON public.encuestas_expositores FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion publica encuestas publico" ON public.encuestas_publico;
CREATE POLICY "Permitir insercion publica encuestas publico" ON public.encuestas_publico FOR INSERT WITH CHECK (true);

-- POLÍTICAS DE ACCESO PARA SELECCIONAR / ACTUALIZAR / BORRAR (PÚBLICO Y ADMIN)
DROP POLICY IF EXISTS "Permitir lectura general encuestas cosplay" ON public.encuestas_cosplay;
CREATE POLICY "Permitir lectura general encuestas cosplay" ON public.encuestas_cosplay FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura general encuestas expositores" ON public.encuestas_expositores;
CREATE POLICY "Permitir lectura general encuestas expositores" ON public.encuestas_expositores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura general encuestas publico" ON public.encuestas_publico;
CREATE POLICY "Permitir lectura general encuestas publico" ON public.encuestas_publico FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion encuestas publico" ON public.encuestas_publico;
CREATE POLICY "Permitir actualizacion encuestas publico" ON public.encuestas_publico FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminar encuestas cosplay" ON public.encuestas_cosplay;
CREATE POLICY "Permitir eliminar encuestas cosplay" ON public.encuestas_cosplay FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir eliminar encuestas expositores" ON public.encuestas_expositores;
CREATE POLICY "Permitir eliminar encuestas expositores" ON public.encuestas_expositores FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir eliminar encuestas publico" ON public.encuestas_publico;
CREATE POLICY "Permitir eliminar encuestas publico" ON public.encuestas_publico FOR DELETE USING (true);

-- ÍNDICES PARA BÚSQUEDA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_encuestas_cosplay_created ON public.encuestas_cosplay (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encuestas_expositores_created ON public.encuestas_expositores (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encuestas_publico_created ON public.encuestas_publico (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encuestas_publico_rut ON public.encuestas_publico (rut);
CREATE INDEX IF NOT EXISTS idx_encuestas_publico_email ON public.encuestas_publico (email);
