import { SITIO_WEB_URL } from '../config.js';

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

function formatearRangoFechas(inicio, fin) {
  const ini = formatearFecha(inicio);
  const ffin = formatearFecha(fin);
  if (ini === '—' && ffin === '—') return '—';
  if (ini === ffin) return ini;
  if (ini === '—') return ffin;
  if (ffin === '—') return ini;
  return `${ini} al ${ffin}`;
}

function formatearHoras(valor) {
  const horas = Number(valor);
  if (!Number.isFinite(horas) || horas <= 0) {
    return '—';
  }

  return `${horas.toLocaleString('es-BO')} ${horas === 1 ? 'hora' : 'horas'}`;
}

function obtenerTipoCertificado(valor, tipoCodigo) {
  const tipo = String(tipoCodigo || valor || '').toLowerCase();

  if (tipo.includes('aprob')) {
    return { clase: 'badge-aprobacion', texto: valor || 'Aprobación' };
  }

  if (tipo.includes('asist')) {
    return { clase: 'badge-asistencia', texto: valor || 'Asistencia' };
  }

  if (tipo.includes('instructor')) {
    return { clase: 'badge-neutro', texto: valor || 'Instructor' };
  }

  return { clase: 'badge-neutro', texto: valor || '—' };
}

export default function ResultadoCertificado({ certificado }) {
  const tipoCertificado = obtenerTipoCertificado(certificado.tipo_certificado, certificado.tipo_codigo);

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

        {certificado.ci_estudiante && (
          <div className="dato-card">
            <dt>CI</dt>
            <dd>{certificado.ci_estudiante}</dd>
          </div>
        )}

        <div className="dato-card dato-card-curso">
          <dt>Curso</dt>
          <dd>{certificado.nombre_curso || '—'}</dd>
        </div>

        <div className="dato-card">
          <dt>Horas académicas</dt>
          <dd>{formatearHoras(certificado.horas)}</dd>
        </div>

        <div className="dato-card">
          <dt>Fechas del curso</dt>
          <dd>{formatearRangoFechas(certificado.fecha_inicio, certificado.fecha_fin)}</dd>
        </div>

        {certificado.grupo && (
          <div className="dato-card">
            <dt>Grupo</dt>
            <dd>Grupo {certificado.grupo}</dd>
          </div>
        )}

        {certificado.periodo && (
          <div className="dato-card">
            <dt>Periodo</dt>
            <dd>{certificado.periodo}</dd>
          </div>
        )}

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
