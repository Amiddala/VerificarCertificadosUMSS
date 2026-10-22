import { Link, Route, Routes } from 'react-router-dom';
import Buscador from './pages/Buscador.jsx';
import Verificar from './pages/Verificar.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';

const INSTITUCION = 'Formación Continua UMSS';
const TITULO_SITIO = 'Verificación de certificados';

export default function App() {
  return (
    <div className="app">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>

      <header className="cabecera">
        <div className="contenedor cabecera-contenido">
          <Link
            to="/"
            className="marca"
            aria-label={`${INSTITUCION} — ${TITULO_SITIO}. Ir al inicio`}
          >
            <span className="marca-logo" aria-hidden="true">
              UMSS
            </span>
            <span className="marca-texto">
              <strong>{INSTITUCION}</strong>
              <span>— {TITULO_SITIO}</span>
            </span>
          </Link>
        </div>
      </header>

      <main id="contenido" className="contenedor contenido" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Buscador />} />
          <Route path="/verificar/:codigo" element={<Verificar />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>

      <footer className="pie">
        <div className="contenedor">
          <p>{INSTITUCION} · Consulta pública de certificados</p>
          <p className="pie-nota">
            Esta página solo consulta información. No crea, modifica ni elimina certificados.
          </p>
        </div>
      </footer>
    </div>
  );
}
