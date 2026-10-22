export const INSTITUCION = 'Formación Continua UMSS';

function normalizarUrlSitio(valor) {
  if (typeof valor !== 'string') {
    return '';
  }

  const urlLimpia = valor.trim();
  if (!/^https?:\/\/\S+$/i.test(urlLimpia)) {
    return '';
  }

  try {
    const url = new URL(urlLimpia);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export const SITIO_WEB_URL = normalizarUrlSitio(import.meta.env.VITE_SITIO_WEB_URL);
