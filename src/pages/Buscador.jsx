import BuscadorForm from '../components/BuscadorForm.jsx';
import { INSTITUCION } from '../config.js';

export default function Buscador() {
  return (
    <section className="pagina">
      <div className="card tarjeta-principal">
        <div className="tarjeta-cabecera">
          <span className="icono-tarjeta" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none">
              <path
                d="M6.5 3.5h7l4 4v13h-11v-17Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M13.5 3.5v4h4M9.5 13l1.8 1.8 3.6-3.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h1 className="tarjeta-titulo">Verificar documento</h1>
            <p className="tarjeta-subtitulo">Consulta pública de certificados</p>
          </div>
        </div>

        <p className="descripcion-tarjeta">
          Escanea el código QR del certificado o escribe el código impreso debajo de él para
          confirmar que fue emitido por {INSTITUCION}.
        </p>

        <BuscadorForm />
      </div>

      <p className="nota-privacidad">
        Solo mostramos los datos necesarios para verificar la autenticidad del certificado. No se
        consulta documento de identidad, celular ni correo.
      </p>
    </section>
  );
}
