import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BuscadorForm from '../components/BuscadorForm.jsx';
import ResultadoCertificado from '../components/ResultadoCertificado.jsx';
import { verificarCertificado } from '../services/api.js';

function IconoEquis() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoAlerta() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <path
        d="M12 4 3.8 19h16.4L12 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9v4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.6" r="1.2" fill="currentColor" />
    </svg>
  );
}

function PanelEstado({ variante, titulo, mensaje, codigo, alReintentar }) {
  const esError = variante === 'error';

  return (
    <div className={`card estado estado-${variante}`} role="alert">
      <div className="estado-encabezado">
        <span className="estado-icono" aria-hidden="true">
          {esError ? <IconoAlerta /> : <IconoEquis />}
        </span>
        <div>
          <p className="resultado-etiqueta">
            {esError ? 'No se pudo verificar' : 'Resultado de la consulta'}
          </p>
          <h2>{titulo}</h2>
        </div>
      </div>

      <p>{mensaje}</p>

      {codigo && (
        <p className="codigo-consultado codigo-consultado-error">
          <span>Código consultado</span>
          <code>{codigo}</code>
        </p>
      )}

      {alReintentar && (
        <button type="button" className="boton-secundario" onClick={alReintentar}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export default function Verificar() {
  const { codigo = '' } = useParams();
  const [resultado, setResultado] = useState({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    let activo = true;

    setResultado({ estado: 'cargando' });

    verificarCertificado(codigo, { signal: controlador.signal })
      .then((respuesta) => {
        if (!activo) {
          return;
        }

        if (respuesta.estado === 'valido') {
          setResultado({ estado: 'valido', certificado: respuesta.certificado });
        } else {
          setResultado({ estado: 'no_encontrado' });
        }
      })
      .catch((error) => {
        if (!activo || error?.name === 'AbortError') {
          return;
        }

        if (error?.tipo === 'invalido') {
          setResultado({ estado: 'invalido', mensaje: error.message });
        } else if (error?.tipo === 'limite') {
          setResultado({ estado: 'limite', mensaje: error.message });
        } else {
          setResultado({ estado: 'error', mensaje: error.message });
        }
      });

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [codigo, intento]);

  return (
    <section className="pagina pagina-verificacion">
      <div className="card card-buscador">
        <h2 className="titulo-buscador">Consultar otro certificado</h2>
        <BuscadorForm valorInicial={codigo} />
      </div>

      <div
        className="zona-resultado"
        aria-live="polite"
        aria-busy={resultado.estado === 'cargando'}
      >
        {resultado.estado === 'cargando' && (
          <div className="card estado estado-cargando" role="status">
            <span className="cargador" aria-hidden="true" />
            <div>
              <h2>Consultando certificado…</h2>
              <p>Esto tomará solo un momento.</p>
            </div>
          </div>
        )}

        {resultado.estado === 'valido' && (
          <ResultadoCertificado certificado={resultado.certificado} codigo={codigo} />
        )}

        {resultado.estado === 'no_encontrado' && (
          <PanelEstado
            variante="invalido"
            titulo="NO VÁLIDO / NO ENCONTRADO"
            mensaje="No encontramos un certificado registrado con este código. Revisa que esté escrito correctamente e intenta de nuevo."
            codigo={codigo}
          />
        )}

        {resultado.estado === 'invalido' && (
          <PanelEstado
            variante="invalido"
            titulo="NO VÁLIDO / NO ENCONTRADO"
            mensaje={resultado.mensaje}
            codigo={codigo}
          />
        )}

        {resultado.estado === 'limite' && (
          <PanelEstado
            variante="error"
            titulo="DEMASIADAS CONSULTAS"
            mensaje={resultado.mensaje}
            codigo={codigo}
            alReintentar={() => setIntento((valor) => valor + 1)}
          />
        )}

        {resultado.estado === 'error' && (
          <PanelEstado
            variante="error"
            titulo="NO PUDIMOS COMPLETAR LA CONSULTA"
            mensaje={resultado.mensaje}
            codigo={codigo}
            alReintentar={() => setIntento((valor) => valor + 1)}
          />
        )}
      </div>
    </section>
  );
}
