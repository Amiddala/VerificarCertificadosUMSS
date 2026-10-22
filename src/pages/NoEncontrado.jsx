import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <section className="pagina pagina-no-encontrada">
      <div className="card estado estado-404">
        <p className="numero-404" aria-hidden="true">
          404
        </p>
        <h2>Página no encontrada</h2>
        <p>La dirección que abriste no existe o cambió de lugar.</p>
        <Link className="boton-primario" to="/">
          Ir al buscador
        </Link>
      </div>
    </section>
  );
}
