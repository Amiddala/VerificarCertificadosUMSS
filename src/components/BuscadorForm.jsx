import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MENSAJE_CODIGO_INVALIDO,
  MENSAJE_CODIGO_VACIO,
  esCodigoValido,
  normalizarCodigo,
} from '../utils/codigo.js';

export default function BuscadorForm({
  valorInicial = '',
  errorExterno = '',
  textoBoton = 'Verificar certificado',
}) {
  const [codigo, setCodigo] = useState(valorInicial);
  const [error, setError] = useState(errorExterno);
  const navigate = useNavigate();
  const idCampo = useId();
  const idAyuda = `${idCampo}-ayuda`;
  const idError = `${idCampo}-error`;

  useEffect(() => {
    setCodigo(valorInicial);
    setError(errorExterno);
  }, [valorInicial, errorExterno]);

  function manejarEnvio(evento) {
    evento.preventDefault();
    const codigoNormalizado = normalizarCodigo(codigo);

    if (!codigoNormalizado) {
      setError(MENSAJE_CODIGO_VACIO);
      return;
    }

    if (!esCodigoValido(codigoNormalizado)) {
      setError(MENSAJE_CODIGO_INVALIDO);
      return;
    }

    setError('');
    navigate(`/verificar/${encodeURIComponent(codigoNormalizado)}`);
  }

  return (
    <form className="buscador-form" onSubmit={manejarEnvio} noValidate>
      <div className="campo">
        <label htmlFor={idCampo}>Código de verificación</label>
        <span className="campo-ayuda" id={idAyuda}>
          Lo encuentras impreso debajo del código QR del certificado.
        </span>

        <div className="campo-control">
          <span className="campo-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id={idCampo}
            name="codigo"
            type="text"
            value={codigo}
            onChange={(evento) => {
              setCodigo(evento.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Ej.: A1B2-C3D4-EFGH"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint="search"
            maxLength={64}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${idAyuda} ${idError}` : idAyuda}
          />
        </div>

        {error && (
          <p className="campo-error" id={idError} role="alert">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M10 6.3v4.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="10" cy="13.8" r="1" fill="currentColor" />
            </svg>
            <span>{error}</span>
          </p>
        )}
      </div>

      <button type="submit" className="boton boton-primario boton-ancho">
        {textoBoton}
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
          <path
            d="M5 12h14m-5-5 5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
