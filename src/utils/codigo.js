export const CODIGO_REGEX = /^[A-Za-z0-9_-]{6,64}$/;

export const MENSAJE_CODIGO_VACIO =
  'Ingresa el código de verificación que aparece debajo del código QR.';

export const MENSAJE_CODIGO_INVALIDO =
  'El código debe tener entre 6 y 64 caracteres. Solo se permiten letras, números, guiones y guiones bajos.';

export function normalizarCodigo(valor = '') {
  return String(valor).trim();
}

export function esCodigoValido(valor) {
  return CODIGO_REGEX.test(normalizarCodigo(valor));
}
