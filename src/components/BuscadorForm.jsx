import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CODIGO_REGEX = /^[A-Za-z0-9_-]{6,64}$/;

export default function BuscadorForm({ valorInicial = '' }) {
  const [codigo, setCodigo] = useState(valorInicial);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const idCampo = useId();
  const idAyuda = `${idCampo}-ayuda`;
  const idError = `${idCampo}-error`;

  useEffect(() => {
    setCodigo(valorInicial);
    setError('');
  }, [valorInicial]);

  function manejarEnvio(evento) {
    evento.preventDefault();
    const codigoLimpio = codigo.trim();

    if (!codigoLimpio) {
      setError('Ingresa el código de verificación que aparece debajo del QR.');
      return;
    }

    if (!CODIGO_REGEX.test(codigoLimpio)) {
      setError(
        'El código debe tener entre 6 y 64 caracteres. Solo se permiten letras, números, guiones y guiones bajos.',
      );
      return;
    }

    setError('');
    navigate(`/verificar/${encodeURIComponent(codigoLimpio)}`);
  }

  return (
    <form className="buscador-form" onSubmit={manejarEnvio} noValidate>
      <div className="campo">
        <label htmlFor={idCampo}>Código de verificación</label>
        <p className="campo-ayuda" id={idAyuda}>
          Escríbelo tal como aparece impreso debajo del código QR.
        </p>
        <div className="fila-campo">
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
            placeholder="Ej.: DEMO-ASISTENCIA-2024"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint="search"
            maxLength={64}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${idAyuda} ${idError}` : idAyuda}
          />
          <button type="submit" className="boton-primario">
            Buscar
          </button>
        </div>
        {error && (
          <p className="campo-error" id={idError} role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
