import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import QRCode from 'qrcode';

const CODIGO_REGEX = /^[A-Za-z0-9_-]{6,64}$/;

function salirConError(mensaje) {
  console.error(`Error: ${mensaje}`);
  process.exit(1);
}

const codigo = process.argv[2];

if (!codigo) {
  salirConError('falta el código. Uso: npm run qr -- <codigo>');
}

if (!CODIGO_REGEX.test(codigo)) {
  salirConError(
    'el código debe tener entre 6 y 64 caracteres y solo puede incluir letras, números, guiones o guiones bajos.',
  );
}

const baseUrl = (process.env.BASE_URL || '').trim().replace(/\/+$/, '');

if (!baseUrl) {
  salirConError('define BASE_URL en el archivo .env (por ejemplo, https://tu-dominio.com).');
}

if (!/^https?:\/\/[^\s]+$/i.test(baseUrl)) {
  salirConError('BASE_URL debe ser una URL válida que empiece con http:// o https://.');
}

const urlVerificacion = `${baseUrl}/verificar/${encodeURIComponent(codigo)}`;
const directorioSalida = path.resolve(process.cwd(), 'qr-ejemplo');
const archivoSalida = path.join(directorioSalida, `${codigo}.png`);

await fs.mkdir(directorioSalida, { recursive: true });

await QRCode.toFile(archivoSalida, urlVerificacion, {
  type: 'png',
  width: 640,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#072a52',
    light: '#ffffff',
  },
});

console.log(`QR generado: ${archivoSalida}`);
console.log(`URL: ${urlVerificacion}`);
