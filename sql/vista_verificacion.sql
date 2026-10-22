-- ============================================================================
-- VerificarCertificadosUMSS
-- Vista pública de verificación y rol de solo lectura.
--
-- Ejecutar con un usuario administrador de PostgreSQL, después de ajustar los
-- nombres de tablas y columnas al esquema real de AdmCursosUMSS.
--
-- SUPUESTOS IMPORTANTES (ajustar):
--   * La tabla certificados tiene "codigoQR", "fechaEmision", "tipoCertificado"
--     y una referencia "idInscripcion" a la tabla inscripciones.
--   * Si certificados usa directamente "idEstudiante", hay que cambiar el JOIN
--     de inscripciones por el JOIN directo contra estudiantes.
--   * La columna "codigoQR" debe ser UNIQUE y NOT NULL. La unicidad es
--     imprescindible para que un código identifique un solo certificado.
--   * "horas" se toma del curso. Si el certificado guarda una duración
--     histórica propia, usar esa columna en su lugar.
--   * La vista NO debe exponer CI, celular, correo ni otros datos personales.
--
-- Índice recomendado si todavía no existe:
--   CREATE UNIQUE INDEX IF NOT EXISTS ux_certificados_codigo_qr
--     ON public."certificados" ("codigoQR");
-- ============================================================================

CREATE OR REPLACE VIEW public.vista_verificacion AS
SELECT
  c."codigoQR" AS codigo_qr, -- TODO: ajustar al nombre real
  TRIM(CONCAT_WS(' ', e."nombres", e."apellidos")) AS nombre_estudiante, -- TODO
  cu."nombre" AS nombre_curso, -- TODO
  cu."horas" AS horas, -- TODO
  COALESCE(
    c."tipoCertificado",
    CASE WHEN i."aprobado" THEN 'Aprobación' ELSE 'Asistencia' END
  ) AS tipo_certificado, -- TODO: confirmar de dónde sale el tipo
  c."fechaEmision"::date AS fecha_emision -- TODO
FROM public."certificados" c
JOIN public."inscripciones" i ON i."id" = c."idInscripcion" -- TODO
JOIN public."estudiantes" e ON e."id" = i."idEstudiante" -- TODO
JOIN public."grupos" g ON g."id" = i."idGrupo" -- TODO
JOIN public."cursos" cu ON cu."id" = g."idCurso" -- TODO
WHERE c."codigoQR" IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Rol de solo lectura.
-- CAMBIAR la contraseña de ejemplo antes de ejecutar en producción.
-- Si el rol ya existe, el bloque no lo recrea; usar ALTER ROLE para rotar la
-- clave: ALTER ROLE verificacion_ro WITH PASSWORD '...';
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

-- Quitar cualquier permiso previo sobre tablas, secuencias y la propia vista.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM verificacion_ro;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM verificacion_ro;
REVOKE ALL PRIVILEGES ON public.vista_verificacion FROM verificacion_ro;

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
--   SELECT * FROM public."certificados" LIMIT 1; -- debe fallar por permisos
--
-- Nota: si la base usa un esquema distinto de "public", cambiar el esquema en
-- la vista, en los GRANT y en search_path; también ajustar la consulta de
-- api/verificar.js.
-- ----------------------------------------------------------------------------
