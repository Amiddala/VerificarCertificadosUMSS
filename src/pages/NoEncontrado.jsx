import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <section className="pagina">
      <div className="card tarjeta-404">
        <p className="numero-404" aria-hidden="true">
          404
        </p>
        <h1 className="estado-titulo">Página no encontrada</h1>
        <p className="estado-texto">La dirección que abriste no existe o cambió de lugar.</p>
        <Link className="boton boton-primario boton-ancho" to="/">
          Volver al verificador
        </Link>
      </div>
    </section>
  );
}
