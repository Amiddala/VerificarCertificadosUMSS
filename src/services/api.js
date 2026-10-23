const RUTA_VERIFICACION = import.meta.env.VITE_API_VERIFICACION_URL || '/api/verificar';

export class ErrorConsulta extends Error {
  constructor(mensaje, tipo = 'red') {
    super(mensaje);
    this.name = 'ErrorConsulta';
    this.tipo = tipo;
  }
}

export async function verificarCertificado(codigo, { signal } = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${RUTA_VERIFICACION}?codigo=${encodeURIComponent(codigo)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    throw new ErrorConsulta(
      'No pudimos conectar con el servicio de verificación. Revisa tu conexión e intenta de nuevo.',
      'red',
    );
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (respuesta.status === 400) {
    throw new ErrorConsulta(
      'El código debe tener entre 6 y 64 caracteres y solo puede incluir letras, números, guiones o guiones bajos.',
      'invalido',
    );
  }

  if (respuesta.status === 404) {
    return { estado: 'no_encontrado' };
  }

  if (respuesta.status === 429) {
    throw new ErrorConsulta(
      'Se realizaron demasiadas consultas desde tu conexión. Espera un momento y vuelve a intentarlo.',
      'limite',
    );
  }

  if (respuesta.ok && datos?.valido === true && datos.certificado) {
    return { estado: 'valido', certificado: datos.certificado };
  }

  if (respuesta.ok && datos?.valido === false) {
    return { estado: 'no_encontrado' };
  }

  throw new ErrorConsulta(
    'El servicio de verificación no está disponible en este momento. Intenta nuevamente más tarde.',
    respuesta.status >= 500 ? 'servidor' : 'red',
  );
}
