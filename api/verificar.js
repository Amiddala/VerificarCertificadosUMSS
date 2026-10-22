import { Pool } from 'pg';

const CODIGO_REGEX = /^[A-Za-z0-9_-]{6,64}$/;
const MAX_SOLICITUDES_POR_MINUTO = 30;
const VENTANA_RATE_LIMIT_MS = 60_000;
const MAX_ENTRADAS_RATE_LIMIT = 5_000;

const CERTIFICADOS_MOCK = new Map([
  [
    'DEMO-ASISTENCIA-2024',
    {
      codigo_qr: 'DEMO-ASISTENCIA-2024',
      nombre_estudiante: 'Estudiante de Prueba Uno',
      nombre_curso: 'Curso de Ejemplo: Gestión de Proyectos',
      horas: 40,
      tipo_certificado: 'Asistencia',
      fecha_emision: '2024-11-15',
    },
  ],
  [
    'DEMO-APROBACION-2024',
    {
      codigo_qr: 'DEMO-APROBACION-2024',
      nombre_estudiante: 'Estudiante de Prueba Dos',
      nombre_curso: 'Diplomado de Ejemplo: Transformación Digital',
      horas: 120,
      tipo_certificado: 'Aprobación',
      fecha_emision: '2025-03-22',
    },
  ],
]);

const CABECERAS_SEGURIDAD = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

const solicitudesPorIp = new Map();
let pool;

function responder(res, estado, cuerpo, cabecerasExtra = {}) {
  res.statusCode = estado;
  for (const [nombre, valor] of Object.entries({ ...CABECERAS_SEGURIDAD, ...cabecerasExtra })) {
    res.setHeader(nombre, valor);
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(cuerpo));
}

function obtenerIp(req) {
  const reenviada = req.headers['x-forwarded-for'];
  if (typeof reenviada === 'string' && reenviada.length > 0) {
    return reenviada.split(',')[0].trim();
  }

  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) {
    return real.trim();
  }

  return req.socket?.remoteAddress || 'desconocida';
}

function aplicarRateLimit(req) {
  const ip = obtenerIp(req);
  const ahora = Date.now();
  let registro = solicitudesPorIp.get(ip);

  if (!registro || registro.expiraEn <= ahora) {
    if (solicitudesPorIp.size >= MAX_ENTRADAS_RATE_LIMIT) {
      for (const [clave, valor] of solicitudesPorIp) {
        if (valor.expiraEn <= ahora) {
          solicitudesPorIp.delete(clave);
        }
      }

      if (solicitudesPorIp.size >= MAX_ENTRADAS_RATE_LIMIT) {
        solicitudesPorIp.clear();
      }
    }

    registro = { conteo: 0, expiraEn: ahora + VENTANA_RATE_LIMIT_MS };
    solicitudesPorIp.set(ip, registro);
  }

  registro.conteo += 1;
  const permitido = registro.conteo <= MAX_SOLICITUDES_POR_MINUTO;

  return {
    permitido,
    restantes: Math.max(0, MAX_SOLICITUDES_POR_MINUTO - registro.conteo),
    reinicioEn: Math.ceil((registro.expiraEn - ahora) / 1000),
  };
}

function usarMock() {
  const modoMock = String(process.env.USE_MOCK || '').toLowerCase();
  return modoMock === 'true' || !process.env.DATABASE_URL;
}

function obtenerPool() {
  if (!pool) {
    const sslActivo = process.env.DATABASE_SSL !== 'false';
    const ssl = sslActivo
      ? {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : false;

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      application_name: 'verificar-certificados-umss',
    });

    pool.on('error', (error) => {
      console.error('Error inesperado en el pool de PostgreSQL:', error.message);
    });
  }

  return pool;
}

function normalizarCertificado(fila) {
  const horas = fila.horas === null || fila.horas === undefined ? null : Number(fila.horas);

  return {
    codigo_qr: fila.codigo_qr,
    nombre_estudiante: fila.nombre_estudiante,
    nombre_curso: fila.nombre_curso,
    horas: Number.isFinite(horas) ? horas : null,
    tipo_certificado: fila.tipo_certificado,
    fecha_emision: fila.fecha_emision ? String(fila.fecha_emision).slice(0, 10) : null,
  };
}

export default async function handler(req, res) {
  try {
    const metodo = String(req.method || 'GET').toUpperCase();
    if (metodo !== 'GET') {
      responder(res, 405, { valido: false }, { Allow: 'GET' });
      return;
    }

    const limite = aplicarRateLimit(req);
    const cabecerasLimite = {
      'X-RateLimit-Limit': String(MAX_SOLICITUDES_POR_MINUTO),
      'X-RateLimit-Remaining': String(limite.restantes),
      'X-RateLimit-Reset': String(limite.reinicioEn),
    };

    if (!limite.permitido) {
      responder(
        res,
        429,
        { valido: false, error: 'Demasiadas consultas. Intenta nuevamente en un minuto.' },
        { ...cabecerasLimite, 'Retry-After': String(limite.reinicioEn) },
      );
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const codigo = (url.searchParams.get('codigo') || '').trim();

    if (!CODIGO_REGEX.test(codigo)) {
      responder(
        res,
        400,
        { valido: false, error: 'El código de verificación no es válido.' },
        cabecerasLimite,
      );
      return;
    }

    if (usarMock()) {
      const certificado = CERTIFICADOS_MOCK.get(codigo);
      if (!certificado) {
        responder(res, 404, { valido: false }, cabecerasLimite);
        return;
      }

      responder(res, 200, { valido: true, certificado }, cabecerasLimite);
      return;
    }

    const resultado = await obtenerPool().query(
      `SELECT
         codigo_qr,
         nombre_estudiante,
         nombre_curso,
         horas,
         tipo_certificado,
         to_char(fecha_emision, 'YYYY-MM-DD') AS fecha_emision
       FROM public.vista_verificacion
       WHERE codigo_qr = $1
       LIMIT 1`,
      [codigo],
    );

    if (resultado.rows.length === 0) {
      responder(res, 404, { valido: false }, cabecerasLimite);
      return;
    }

    responder(
      res,
      200,
      { valido: true, certificado: normalizarCertificado(resultado.rows[0]) },
      cabecerasLimite,
    );
  } catch (error) {
    console.error('Error al verificar el certificado:', error.message);
    responder(res, 500, {
      valido: false,
      error: 'No fue posible completar la consulta. Intenta nuevamente.',
    });
  }
}
