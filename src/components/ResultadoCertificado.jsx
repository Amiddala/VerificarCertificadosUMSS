import { useEffect, useRef, useState } from 'react';
import { INSTITUCION, SITIO_WEB_URL } from '../config.js';

function formatearFecha(valor) {
  if (typeof valor !== 'string' || valor.length === 0) {
    return '—';
  }

  const coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (coincidencia) {
    return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
  }

  return valor;
}

function formatearHoras(valor) {
  const horas = Number(valor);
  if (!Number.isFinite(horas) || horas <= 0) {
    return '—';
  }

  return `${horas.toLocaleString('es-BO')} ${horas === 1 ? 'hora' : 'horas'}`;
}

function obtenerTipoCertificado(valor) {
  const tipo = String(valor || '').toLowerCase();

  if (tipo.includes('aprob')) {
    return { clase: 'badge-aprobacion', texto: valor || 'Aprobación' };
  }

  if (tipo.includes('asist')) {
    return { clase: 'badge-asistencia', texto: valor || 'Asistencia' };
  }

  return { clase: 'badge-neutro', texto: valor || '—' };
}

function copiarConRespaldo(texto) {
  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.className = 'campo-copia-temporal';
  document.body.appendChild(area);
  area.select();
  const copiado = document.execCommand('copy');
  document.body.removeChild(area);

  if (!copiado) {
    throw new Error('No se pudo copiar el código');
  }
}

export default function ResultadoCertificado({ certificado, codigo }) {
  const [estadoCopia, setEstadoCopia] = useState('inactivo');
  const temporizadorRef = useRef(null);
  const codigoVerificacion = certificado.codigo_qr || codigo || '';
  const tipoCertificado = obtenerTipoCertificado(certificado.tipo_certificado);

  useEffect(() => {
    return () => {
      window.clearTimeout(temporizadorRef.current);
    };
  }, []);

  async function copiarCodigo() {
    if (!codigoVerificacion) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codigoVerificacion);
      } else {
        copiarConRespaldo(codigoVerificacion);
      }
      setEstadoCopia('copiado');
    } catch {
      try {
        copiarConRespaldo(codigoVerificacion);
        setEstadoCopia('copiado');
      } catch {
        setEstadoCopia('error');
      }
    }

    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(() => setEstadoCopia('inactivo'), 2500);
  }

  return (
    <article className="card tarjeta-resultado">
      <div className="resultado-cabecera">
        <span className="circulo-estado circulo-exito" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
            <path
              d="m5 12.5 4.3 4.3L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="resultado-kicker">Verificación exitosa</p>
        <h2 className="resultado-titulo">Certificado válido</h2>
        <p className="resultado-descripcion">
          La autenticidad del documento fue confirmada correctamente.
        </p>
      </div>

      <dl className="datos-grid">
        <div className="dato-card">
          <dt>Estudiante</dt>
          <dd>{certificado.nombre_estudiante || '—'}</dd>
        </div>

        <div className="dato-card">
          <dt>Curso</dt>
          <dd>{certificado.nombre_curso || '—'}</dd>
        </div>

        <div className="dato-card">
          <dt>Horas académicas</dt>
          <dd>{formatearHoras(certificado.horas)}</dd>
        </div>

        <div className="dato-card">
          <dt>Tipo de certificado</dt>
          <dd>
            <span className={`badge ${tipoCertificado.clase}`}>{tipoCertificado.texto}</span>
          </dd>
        </div>

        <div className="dato-card">
          <dt>Fecha de emisión</dt>
          <dd>{formatearFecha(certificado.fecha_emision)}</dd>
        </div>

        <div className="dato-card">
          <dt>Emitido por</dt>
          <dd>{INSTITUCION}</dd>
        </div>

        <div className="dato-card dato-card-codigo">
          <dt>Código de verificación</dt>
          <dd className="codigo-fila">
            <code>{codigoVerificacion || '—'}</code>
            <button
              type="button"
              className={`boton-copiar boton-copiar-${estadoCopia}`}
              onClick={copiarCodigo}
              disabled={!codigoVerificacion}
            >
              {estadoCopia === 'copiado' ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <path
                    d="m5 12.5 4.3 4.3L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <rect
                    x="8"
                    y="8"
                    width="10"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M15.5 8V6.5a2 2 0 0 0-2-2H6.5a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2H8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span>
                {estadoCopia === 'copiado'
                  ? 'Copiado'
                  : estadoCopia === 'error'
                    ? 'No se pudo copiar'
                    : 'Copiar'}
              </span>
            </button>
            <span className="sr-only" role="status" aria-live="polite">
              {estadoCopia === 'copiado'
                ? 'Código copiado al portapapeles.'
                : estadoCopia === 'error'
                  ? 'No se pudo copiar el código.'
                  : ''}
            </span>
          </dd>
        </div>
      </dl>

      {SITIO_WEB_URL && (
        <a
          className="boton boton-secundario boton-ancho boton-sitio"
          href={SITIO_WEB_URL}
          rel="noopener noreferrer"
        >
          Visitar sitio web
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M14 5h5v5M19 5l-8 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </a>
      )}
    </article>
  );
}
