import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INSTITUCION } from '../config.js';

export default function Encabezado() {
  const [logoDisponible, setLogoDisponible] = useState(false);

  useEffect(() => {
    let activo = true;
    const imagen = new Image();

    imagen.onload = () => {
      if (activo) {
        setLogoDisponible(true);
      }
    };

    imagen.onerror = () => {
      if (activo) {
        setLogoDisponible(false);
      }
    };

    imagen.src = '/logo.png';

    return () => {
      activo = false;
      imagen.onload = null;
      imagen.onerror = null;
    };
  }, []);

  return (
    <header className="encabezado">
      <Link
        to="/"
        className="encabezado-marca"
        aria-label={`${INSTITUCION}. Ir al inicio`}
      >
        {logoDisponible && <img className="encabezado-logo" src="/logo.png" alt="" />}
        <span className="encabezado-texto">
          <span className="encabezado-institucion">{INSTITUCION}</span>
          <span className="encabezado-kicker">Verificación de autenticidad</span>
        </span>
      </Link>
    </header>
  );
}
