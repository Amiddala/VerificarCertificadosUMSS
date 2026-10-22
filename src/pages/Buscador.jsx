import BuscadorForm from '../components/BuscadorForm.jsx';

export default function Buscador() {
  return (
    <section className="pagina pagina-inicio">
      <div className="intro">
        <p className="sobrelinea">Consulta pública</p>
        <h2>Verifica la autenticidad de un certificado</h2>
        <p>
          Escanea el código QR del certificado o ingresa manualmente el código impreso debajo de
          él para comprobar si fue emitido por Formación Continua UMSS.
        </p>
      </div>

      <div className="card card-buscador">
        <BuscadorForm />
      </div>

      <aside className="nota" aria-labelledby="titulo-ayuda">
        <h3 id="titulo-ayuda">¿Dónde encuentro el código?</h3>
        <p>
          Está impreso debajo del código QR, en la esquina inferior del certificado. No necesitas
          crear una cuenta ni iniciar sesión.
        </p>
        <p className="nota-secundaria">
          Esta consulta no muestra datos personales adicionales, como documento de identidad,
          correo o teléfono.
        </p>
      </aside>
    </section>
  );
}
