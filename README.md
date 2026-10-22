# VerificarCertificadosUMSS

Página web pública y mínima para verificar la autenticidad de los certificados digitales emitidos por **Formación Continua UMSS**.

Cada certificado lleva un código QR que apunta a `https://<dominio>/verificar/<codigoQR>` y, debajo del QR, el mismo código impreso para poder escribirlo a mano.

## Por qué es un proyecto aparte

Este sitio no forma parte de AdmCursosUMSS. Es un proyecto separado a propósito:

- Su enlace será público y no debe exponer rutas, pantallas ni datos del sistema administrativo.
- No tiene login, ni sesiones, ni panel de administración.
- Solo puede **buscar códigos y recuperar datos** desde una vista de PostgreSQL.
- Nunca crea, edita ni borra información.
- Solo muestra los datos necesarios para verificar un certificado. No expone CI, celular, correo ni otros datos personales.

## Stack

- React + Vite (JavaScript, sin TypeScript)
- `react-router-dom`
- CSS propio, sin librerías de UI
- Función serverless de Vercel en `api/verificar.js` con `pg`
- PostgreSQL mediante una vista de solo lectura
- Despliegue objetivo: Vercel

## Tema visual

La interfaz parte de los tokens del proyecto principal `AdmCursosUMSS` (`apps/client/src/index.css`): azul marino `#0C103C`, azul medio `#1D3557`, acento `#1E3A8A`, fondo `#F8FAFC` y estados verde/rojo institucionales. Todos los colores, radios, sombras y la tipografía están centralizados como variables CSS en `:root` dentro de `src/styles.css`, bajo nombres como `--color-primario`, `--color-exito`, `--color-error`, `--color-fondo` y `--radio`.

El encabezado busca un logo opcional en `public/logo.png`. Si el archivo no existe, se muestra solo el nombre de la institución, sin imágenes rotas.

## Estructura

```text
VerificarCertificadosUMSS/
├── api/verificar.js
├── sql/vista_verificacion.sql
├── scripts/generar-qr.js
├── src/
│   ├── pages/Buscador.jsx
│   ├── pages/Verificar.jsx
│   ├── pages/NoEncontrado.jsx
│   ├── components/BuscadorForm.jsx
│   ├── components/Encabezado.jsx
│   ├── components/ResultadoCertificado.jsx
│   ├── services/api.js
│   ├── utils/codigo.js
│   ├── config.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── public/
│   ├── favicon.svg
│   └── logo.png (opcional)
├── index.html
├── vite.config.js
├── vercel.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Rutas del frontend

| Ruta | Descripción |
| --- | --- |
| `/` | Pantalla inicial con el buscador y el botón **Verificar certificado**. Navega a `/verificar/:codigo`. |
| `/verificar/:codigo` | Consulta automática del código. Es la ruta que abre el QR, funciona al recargar directamente y mantiene el buscador visible. |
| `*` | Página 404 con enlace al inicio. |

El resultado puede estar en estos estados:

- **Certificado válido** (verde): estudiante, curso, horas académicas, tipo de certificado con badge, fecha de emisión en `dd/mm/aaaa`, institución emisora y código con botón para copiar.
- **Certificado no encontrado** (rojo): mensaje genérico invitando a revisar el código.
- **Cargando**: spinner y esqueleto de los datos.
- **Formato inválido**: aviso bajo el input, sin llamar a la API.
- **Error de red o de servicio**: distinto del "no encontrado", con botón **Reintentar**.
- **Demasiadas consultas**: cuando la API responde `429`.

En el resultado válido también puede aparecer el botón secundario **Visitar sitio web** cuando `VITE_SITIO_WEB_URL` tiene una URL válida. Se abre en la misma pestaña.

## API

### `GET /api/verificar?codigo=XXXX`

- Valida `codigo` contra `^[A-Za-z0-9_-]{6,64}$`.
- Código inválido: `400`.
- Código inexistente: `404` con `{ "valido": false }`.
- Código válido: `200` con:

```json
{
  "valido": true,
  "certificado": {
    "codigo_qr": "DEMO-ASISTENCIA-2024",
    "nombre_estudiante": "Estudiante de Prueba Uno",
    "nombre_curso": "Curso de Ejemplo: Gestión de Proyectos",
    "horas": 40,
    "tipo_certificado": "Asistencia",
    "fecha_emision": "2024-11-15"
  }
}
```

- La consulta usa `WHERE codigo_qr = $1` con parámetros. Nunca se concatenan valores en el SQL.
- Lee únicamente de `public.vista_verificacion`.
- Nunca devuelve mensajes internos, errores de PostgreSQL ni stack traces.
- Rate limiting en memoria: 30 solicitudes por minuto por IP. Es una medida de mejor esfuerzo, no un WAF.
- Cabeceras de seguridad y `Cache-Control: no-store`.
- Solo acepta `GET`; otros métodos responden `405`.

### Modo mock

Si `USE_MOCK=true` **o** si `DATABASE_URL` no está definido, la API no toca PostgreSQL y responde con datos de ejemplo:

| Código | Resultado |
| --- | --- |
| `DEMO-ASISTENCIA-2024` | Válido, tipo Asistencia, 40 horas |
| `DEMO-APROBACION-2024` | Válido, tipo Aprobación, 120 horas |
| Cualquier otro código con formato válido | No encontrado (`404`) |

Los códigos son sensibles a mayúsculas/minúsculas, igual que en la consulta real.

## Cómo correrlo en local

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Abrir la URL que muestra Vite (normalmente `http://localhost:5173`).

`npm run dev` levanta Vite y monta la función `api/verificar.js` en el mismo servidor de desarrollo, así que el modo mock funciona sin necesidad de un backend aparte. Vite carga las variables de `.env` para la API local; las variables no se exponen al navegador.

Probar la API directamente:

```bash
# Certificado válido (mock)
curl -i "http://localhost:5173/api/verificar?codigo=DEMO-ASISTENCIA-2024"

# No encontrado
curl -i "http://localhost:5173/api/verificar?codigo=CODIGO-INEXISTENTE"

# Formato inválido -> 400
curl -i "http://localhost:5173/api/verificar?codigo=abc"
```

También se puede usar el runtime de Vercel:

```bash
npx vercel dev
```

Ese comando emula las funciones serverless de producción y lee las variables de entorno locales. La primera vez puede pedir vincular el proyecto.

Compilar y previsualizar el build:

```bash
npm run build
npm run preview
```

`preview` también monta la API mock en local para poder probar el build completo.

## Base de datos: vista y usuario de solo lectura

El archivo `sql/vista_verificacion.sql` contiene:

1. La definición de `public.vista_verificacion`, con nombres placeholder y comentarios `-- TODO`.
2. La creación del rol `verificacion_ro`.
3. La revocación de permisos y el `GRANT SELECT` **únicamente** sobre la vista.
4. Defensas adicionales: transacciones de solo lectura, `statement_timeout` y límite de conexiones.

Antes de ejecutarlo:

- Ajustar los nombres reales de tablas y columnas marcados con `-- TODO`.
- Confirmar que `certificados."codigoQR"` sea `UNIQUE` y `NOT NULL`.
- Decidir si el tipo de certificado sale de `certificados."tipoCertificado"` o de la inscripción (`aprobado`).
- Confirmar si `certificados` referencia `idInscripcion` o directamente `idEstudiante`. El script usa `idInscripcion`; si el esquema es distinto, cambiar el JOIN.
- Cambiar la contraseña de ejemplo de `verificacion_ro`.

Ejecución típica como administrador:

```bash
psql "postgresql://USUARIO_ADMIN:CLAVE@HOST:5432/BASE?sslmode=require" \
  -f sql/vista_verificacion.sql
```

Comprobar permisos:

```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'verificacion_ro';
```

Debe aparecer solo `SELECT` sobre `vista_verificacion`. Probar también que una consulta directa a `certificados` falle por permisos.

La cadena de conexión que se configura en Vercel debe usar este rol de solo lectura, no el usuario administrador:

```text
postgresql://verificacion_ro:CLAVE@HOST:5432/BASE?sslmode=require
```

> Si la base usa un esquema distinto de `public`, hay que ajustarlo en la vista, en los `GRANT`, en `search_path` y en la consulta de `api/verificar.js`.

### SSL de PostgreSQL

- `DATABASE_SSL=true` (por defecto): activa SSL.
- `DATABASE_SSL=false`: desactiva SSL. Solo para PostgreSQL local sin SSL.
- `DATABASE_SSL_REJECT_UNAUTHORIZED=true` (por defecto): valida el certificado del servidor.
- Si el proveedor usa una cadena que Node no reconoce, se puede poner `DATABASE_SSL_REJECT_UNAUTHORIZED=false`, pero es menos seguro. Lo recomendable es usar una conexión con certificado válido.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL. Solo la usa la función serverless. |
| `USE_MOCK` | `true` fuerza datos de ejemplo. Si falta `DATABASE_URL`, también se usa mock. |
| `DATABASE_SSL` | `true`/`false`. Por defecto `true`. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `true`/`false`. Por defecto `true`. |
| `VITE_SITIO_WEB_URL` | URL del botón **Visitar sitio web** en el resultado válido. Si falta o no es `http(s)`, el botón no se muestra. |
| `BASE_URL` | Solo para `npm run qr`. Es la URL pública del sitio, sin `/` final. |

`.env` está ignorado por git. Nunca subir credenciales. Las variables que empiezan con `VITE_` se incluyen en el bundle del navegador, así que solo deben contener información pública como una URL institucional.

## Desplegar en Vercel

1. Importar el repositorio en Vercel.
2. Framework: **Vite**. Build: `npm run build`. Output: `dist` (ya está declarado en `vercel.json`).
3. Configurar las variables de entorno del proyecto:
   - `DATABASE_URL` con el usuario `verificacion_ro`.
   - `USE_MOCK=false`.
   - `DATABASE_SSL=true`.
   - `DATABASE_SSL_REJECT_UNAUTHORIZED=true` (o `false` solo si el proveedor lo exige).
   - `VITE_SITIO_WEB_URL=https://www.umss.edu.bo` (opcional, para el botón **Visitar sitio web**).
4. Volver a desplegar después de agregar o cambiar variables.
5. Configurar el dominio público definitivo.
6. Probar en producción:
   - Un código válido.
   - Un código inexistente.
   - Un código con formato inválido.
   - Que `/verificar/<codigo>` funcione al recargar directamente (el rewrite SPA de `vercel.json` lo cubre).
   - Que `/api/verificar` no sea interceptado por el rewrite del frontend.

`vercel.json` reescribe las rutas que no empiezan con `/api/` hacia `index.html`, para que React Router funcione al abrir o recargar `/verificar/:codigo` sin romper las funciones serverless.

## Armar la URL del QR

La URL pública de un certificado es:

```text
https://<dominio>/verificar/<codigoQR>
```

Ejemplo:

```text
https://verificacion.umss.edu.bo/verificar/DEMO-ASISTENCIA-2024
```

El QR debe codificar exactamente esa URL. El buscador también acepta el código escrito a mano.

### Generar un QR de ejemplo

Agregar `BASE_URL` al `.env` local:

```dotenv
BASE_URL=https://TU-DOMINIO.vercel.app
```

Generar el PNG:

```bash
npm run qr -- DEMO-ASISTENCIA-2024
```

Resultado:

```text
qr-ejemplo/DEMO-ASISTENCIA-2024.png
```

La carpeta `qr-ejemplo/` está ignorada por git. El script valida el formato del código y exige `BASE_URL` con `http://` o `https://`.

## Seguridad y privacidad

- La base de datos nunca se consulta desde el navegador. La cadena de conexión solo existe en el servidor.
- El rol de base de datos solo tiene `SELECT` sobre `vista_verificacion`.
- La API usa consultas parametrizadas.
- Los errores internos se registran en el servidor y se devuelven mensajes genéricos.
- No se devuelven datos personales adicionales.
- Todas las respuestas de la API usan `no-store`.
- No se configura CORS: el frontend y la API viven en el mismo dominio.
- El rate limiting en memoria es por instancia y se reinicia con los despliegues o arranques en frío. Si se necesita protección distribuida, usar Vercel Firewall, Upstash Ratelimit u otro almacenamiento compartido.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Vite + API local (modo mock si corresponde). |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve el build y monta la API local. |
| `npm run qr -- <codigo>` | Genera `qr-ejemplo/<codigo>.png` usando `BASE_URL`. |
| `npx vercel dev` | Emula el entorno serverless de Vercel. |

## Decisiones y pendientes

Decisiones tomadas:

- **Nombres SQL placeholder**: no se conocen aún las tablas/columnas reales de AdmCursosUMSS. La vista usa `certificados`, `inscripciones`, `estudiantes`, `grupos` y `cursos`, con `certificados.idInscripcion` como camino principal. Todo lo ajustable está marcado con `-- TODO`.
- **Código exacto y sensible a mayúsculas**: la API consulta `codigo_qr = $1` sin transformar el valor, salvo `trim()` de espacios externos. Si en la base los códigos se guardan en mayúsculas, conviene imprimirlos siempre así.
- **Formato inválido**: el frontend valida el código antes de navegar y antes de llamar a la API. El aviso aparece bajo el input y no se realiza ninguna solicitud.
- **Mock automático**: si no hay `DATABASE_URL`, la API usa mock aunque `USE_MOCK` no esté definido. Esto evita fallos al clonar el proyecto.
- **SSL seguro por defecto**: se valida el certificado del servidor. La opción de desactivar la validación queda documentada como excepción.
- **Sin CORS**: no hace falta porque el frontend y la API comparten dominio; además reduce superficie de exposición.
- **Logo opcional**: el componente `Encabezado` comprueba si existe `public/logo.png`; si no existe, muestra únicamente el nombre de la institución. No se renderiza una imagen rota.
- **Tema centralizado**: la identidad visual se tomó de AdmCursosUMSS y quedó como variables CSS en `:root`, para poder ajustarla en un solo archivo.
- **Rate limit en memoria**: suficiente como primera barrera, pero no es global entre instancias.
- **Sin librerías de UI**: solo React, React Router y CSS propio.
- **El QR no crea datos**: solo codifica la URL de consulta.

Pendientes para el equipo:

- Reemplazar los nombres placeholder de la vista por los reales y probar con un certificado real.
- Definir si las horas y el tipo de certificado salen del curso, de la inscripción o de una copia histórica en `certificados`.
- Crear el rol `verificacion_ro` con una contraseña real y rotarla de forma segura.
- Configurar `DATABASE_URL`, `USE_MOCK=false` y SSL en Vercel.
- Configurar el dominio definitivo y actualizar `BASE_URL` para generar los QR.
- Colocar el logo institucional definitivo en `public/logo.png` si se quiere mostrar.
- Definir `VITE_SITIO_WEB_URL` con la URL pública del sitio de Formación Continua UMSS.
- Hacer una revisión visual y de accesibilidad con el equipo de diseño.
- Evaluar rate limiting distribuido si el volumen o los ataques lo justifican.
