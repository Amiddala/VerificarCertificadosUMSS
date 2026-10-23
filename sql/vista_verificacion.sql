-- ============================================================================
-- VerificarCertificadosUMSS
-- Vista pública de verificación y rol de solo lectura.
--
-- Ejecutar con un usuario administrador de PostgreSQL (el mismo de
-- AdmCursosUMSS). La vista se apoya en las tablas reales:
--
--   certificados_emitidos  (emitidos por AdmCursosUMSS)
--   estudiantes / instructores
--   cursos / grupos
--
-- Los certificados guardan una copia de los datos visibles en `metadata`. La
-- vista prioriza esa copia y, si falta (certificados viejos), cae a las tablas
-- actuales. Así el certificado sigue siendo verificable aunque después se
-- edite o elimine el curso, el grupo o la plantilla.
--
-- La vista NO expone celular, correo, dirección ni otros datos personales.
-- ============================================================================

CREATE OR REPLACE VIEW public.vista_verificacion AS
SELECT
  ce.codigo AS codigo_qr,

  COALESCE(
    NULLIF(ce.metadata->>'nombre', ''),
    NULLIF(TRIM(CONCAT_WS(' ', e.nombres, e.ap_paterno, e.ap_materno)), ''),
    NULLIF(TRIM(CONCAT_WS(' ', i.nombres, i.ap_paterno, i.ap_materno)), '')
  ) AS nombre_estudiante,

  COALESCE(NULLIF(ce.metadata->>'ci', ''), e.ci, i.ci) AS ci_estudiante,

  COALESCE(NULLIF(ce.metadata->>'curso', ''), c.nombre_curso) AS nombre_curso,

  COALESCE(NULLIF(ce.metadata->>'horas', '')::integer, c.duracion_horas) AS horas,

  -- El tipo se normaliza a una etiqueta única para toda la aplicación.
  lower(COALESCE(ce.metadata->>'tipo', ce.tipo)) AS tipo_codigo,
  CASE lower(COALESCE(ce.metadata->>'tipo', ce.tipo))
    WHEN 'aprobacion' THEN 'Aprobación'
    WHEN 'asistencia' THEN 'Asistencia'
    WHEN 'instructor' THEN 'Instructor'
    ELSE initcap(replace(COALESCE(ce.metadata->>'tipo', ce.tipo), '_', ' '))
  END AS tipo_certificado,

  CASE
    WHEN ce.metadata->>'fechaIni' ~ '^\d{4}-\d{2}-\d{2}' THEN (ce.metadata->>'fechaIni')::date
    ELSE c.fecha_ini
  END AS fecha_inicio,

  CASE
    WHEN ce.metadata->>'fechaFin' ~ '^\d{4}-\d{2}-\d{2}' THEN (ce.metadata->>'fechaFin')::date
    ELSE c.fecha_fin
  END AS fecha_fin,

  CASE
    WHEN ce.fecha_emision ~ '^\d{4}-\d{2}-\d{2}' THEN ce.fecha_emision::date
    WHEN ce.fecha_emision ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN to_date(ce.fecha_emision, 'DD/MM/YYYY')
    ELSE NULL
  END AS fecha_emision,

  COALESCE(NULLIF(ce.metadata->>'grupo', '')::integer, g.num_grupo) AS grupo,
  COALESCE(NULLIF(ce.metadata->>'periodo', ''), c.periodo) AS periodo,
  COALESCE(NULLIF(ce.metadata->>'codSis', ''), e.cod_sis) AS cod_sis,
  COALESCE(NULLIF(ce.metadata->>'cargo', ''), i.cargo) AS cargo,
  ce.destinatario_tipo AS destinatario_tipo,
  ce.created_at
FROM public.certificados_emitidos ce
LEFT JOIN public.estudiantes e
  ON ce.destinatario_tipo = 'estudiante' AND e.id = ce.destinatario_id
LEFT JOIN public.instructores i
  ON ce.destinatario_tipo = 'instructor' AND i.id = ce.destinatario_id
LEFT JOIN public.cursos c ON c.id = ce.id_curso
LEFT JOIN public.grupos g ON g.id = ce.id_grupo
WHERE ce.codigo IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Rol de solo lectura.
-- CAMBIAR la contraseña de ejemplo antes de ejecutar en producción.
-- Si el rol ya existe, este bloque no lo recrea. Para rotar la clave:
--   ALTER ROLE verificacion_ro WITH PASSWORD 'NUEVA_CLAVE';
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'verificacion_ro') THEN
    CREATE ROLE verificacion_ro
      LOGIN
      PASSWORD 'CAMBIAR_ESTA_CLAVE_SEGURA'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      CONNECTION LIMIT 5;
  END IF;
END
$$;

-- El rol necesita entrar al esquema, pero no crear objetos en él.
REVOKE ALL ON SCHEMA public FROM verificacion_ro;
GRANT USAGE ON SCHEMA public TO verificacion_ro;

-- Sin acceso directo a ninguna tabla ni secuencia.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM verificacion_ro;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM verificacion_ro;
REVOKE ALL ON public.vista_verificacion FROM PUBLIC;
REVOKE ALL ON public.vista_verificacion FROM verificacion_ro;

-- ÚNICO permiso de datos: SELECT sobre la vista de verificación.
GRANT SELECT ON public.vista_verificacion TO verificacion_ro;

-- Defensas adicionales: transacciones de solo lectura y límites de tiempo.
ALTER ROLE verificacion_ro SET default_transaction_read_only = on;
ALTER ROLE verificacion_ro SET statement_timeout = '5s';
ALTER ROLE verificacion_ro SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE verificacion_ro SET search_path = public, pg_catalog;

-- ----------------------------------------------------------------------------
-- Comprobación posterior (ejecutar como administrador):
--
--   SELECT grantee, table_schema, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE grantee = 'verificacion_ro';
--
-- Debe aparecer únicamente SELECT sobre vista_verificacion.
--
-- Probar la conexión con el rol:
--   psql "postgresql://verificacion_ro:CLAVE@HOST:5432/BASE?sslmode=require"
--   SELECT * FROM public.vista_verificacion LIMIT 1;
--   SELECT * FROM public.certificados_emitidos LIMIT 1; -- debe fallar por permisos
-- ----------------------------------------------------------------------------
