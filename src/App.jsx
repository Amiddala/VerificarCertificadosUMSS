import { Route, Routes } from 'react-router-dom';
import Encabezado from './components/Encabezado.jsx';
import { INSTITUCION } from './config.js';
import Buscador from './pages/Buscador.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';
import Verificar from './pages/Verificar.jsx';

export default function App() {
  return (
    <div className="app">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>

      <div className="contenedor">
        <Encabezado />

        <main id="contenido" className="contenido" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Buscador />} />
            <Route path="/verificar/:codigo" element={<Verificar />} />
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </main>

        <footer className="pie">
          <p>{INSTITUCION}</p>
          <p>Consulta pública de autenticidad de certificados.</p>
        </footer>
      </div>
    </div>
  );
}
