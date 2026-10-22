import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BuscadorForm from '../components/BuscadorForm.jsx';
import ResultadoCertificado from '../components/ResultadoCertificado.jsx';
import { verificarCertificado } from '../services/api.js';
import {
  MENSAJE_CODIGO_INVALIDO,
  esCodigoValido,
  normalizarCodigo,
} from '../utils/codigo.js';

function IconoEquis() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoAlerta() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
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

function PanelEstado({ variante, titulo, mensaje, alReintentar }) {
  const esError = variante === 'error';

  return (
    <div className={`card tarjeta-estado tarjeta-estado-${variante}`} role="alert">
      <div className="estado-cabecera">
        <span
          className={`circulo-estado ${esError ? 'circulo-advertencia' : 'circulo-error'}`}
          aria-hidden="true"
        >
          {esError ? <IconoAlerta /> : <IconoEquis />}
        </span>
        <h2 className="estado-titulo">{titulo}</h2>
        <p className="estado-texto">{mensaje}</p>
      </div>

      {alReintentar && (
        <button type="button" className="boton boton-secundario boton-ancho" onClick={alReintentar}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M20 11a8 8 0 1 0-2.3 6.7M20 5v6h-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reintentar
        </button>
      )}
    </div>
  );
}

export default function Verificar() {
  const { codigo = '' } = useParams();
  const codigoNormalizado = normalizarCodigo(codigo);
  const formatoValido = esCodigoValido(codigoNormalizado);
  const [resultado, setResultado] = useState({
    estado: formatoValido ? 'cargando' : 'formato_invalido',
  });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!formatoValido) {
      setResultado({ estado: 'formato_invalido' });
      return undefined;
    }

    const controlador = new AbortController();
    let activo = true;

    setResultado({ estado: 'cargando' });

    verificarCertificado(codigoNormalizado, { signal: controlador.signal })
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
          setResultado({ estado: 'formato_invalido', mensaje: error.message });
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
  }, [codigoNormalizado, formatoValido, intento]);

  const errorFormulario = !formatoValido
    ? MENSAJE_CODIGO_INVALIDO
    : resultado.estado === 'formato_invalido'
      ? resultado.mensaje
      : '';

  return (
    <section className="pagina">
      <div className="card tarjeta-buscador">
        <h1 className="tarjeta-titulo">Verificar certificado</h1>
        <p className="descripcion-tarjeta">
          Escribe otro código para comprobar la autenticidad de un certificado.
        </p>
        <BuscadorForm valorInicial={codigoNormalizado} errorExterno={errorFormulario} />
      </div>

      <div
        className="zona-resultado"
        aria-live="polite"
        aria-busy={resultado.estado === 'cargando'}
      >
        {resultado.estado === 'cargando' && (
          <div className="card tarjeta-cargando" role="status">
            <div className="cargando-cabecera">
              <span className="cargador" aria-hidden="true" />
              <div>
                <h2>Verificando certificado…</h2>
                <p>Estamos consultando el registro.</p>
              </div>
            </div>
            <div className="esqueleto-datos" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {resultado.estado === 'valido' && (
          <ResultadoCertificado
            certificado={resultado.certificado}
            codigo={codigoNormalizado}
          />
        )}

        {resultado.estado === 'no_encontrado' && (
          <PanelEstado
            variante="no-encontrado"
            titulo="Certificado no encontrado"
            mensaje="No encontramos un certificado asociado a este código. Revisa que esté escrito correctamente e inténtalo de nuevo."
          />
        )}

        {resultado.estado === 'limite' && (
          <PanelEstado
            variante="error"
            titulo="Demasiadas consultas"
            mensaje={resultado.mensaje}
            alReintentar={() => setIntento((valor) => valor + 1)}
          />
        )}

        {resultado.estado === 'error' && (
          <PanelEstado
            variante="error"
            titulo="No pudimos verificar el certificado"
            mensaje={resultado.mensaje}
            alReintentar={() => setIntento((valor) => valor + 1)}
          />
        )}
      </div>
    </section>
  );
}
