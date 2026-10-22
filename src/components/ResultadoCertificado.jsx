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

export default function ResultadoCertificado({ certificado, codigo }) {
  return (
    <article className="card resultado resultado-valido">
      <div className="resultado-encabezado">
        <span className="resultado-icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
            <path
              d="m5 12.5 4.2 4.2L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="resultado-etiqueta">Certificado registrado</p>
          <h2 className="resultado-titulo">VÁLIDO</h2>
        </div>
      </div>

      <p className="resultado-intro">
        La información coincide con un certificado emitido por Formación Continua UMSS.
      </p>

      <dl className="detalle-certificado">
        <div className="detalle-item">
          <dt>Estudiante</dt>
          <dd>{certificado.nombre_estudiante || '—'}</dd>
        </div>
        <div className="detalle-item">
          <dt>Curso</dt>
          <dd>{certificado.nombre_curso || '—'}</dd>
        </div>
        <div className="detalle-item detalle-item-corto">
          <dt>Duración</dt>
          <dd>{formatearHoras(certificado.horas)}</dd>
        </div>
        <div className="detalle-item detalle-item-corto">
          <dt>Tipo de certificado</dt>
          <dd>{certificado.tipo_certificado || '—'}</dd>
        </div>
        <div className="detalle-item detalle-item-corto">
          <dt>Fecha de emisión</dt>
          <dd>{formatearFecha(certificado.fecha_emision)}</dd>
        </div>
      </dl>

      <div className="codigo-consultado">
        <span>Código consultado</span>
        <code>{codigo || certificado.codigo_qr || '—'}</code>
      </div>
    </article>
  );
}
