# Dapper · Tablero de metas Q4 2026

Sitio en Next.js (Node) que lee los Google Sheets de seguimiento y muestra el avance de las cinco metas.
Está pensado para verse bien en el celular y sigue el sistema de color Berenjena.

## Cómo funciona

- Un servidor lee los Sheets con una **cuenta de servicio de Google de solo lectura**. Los Sheets siguen privados.
- Lee solo las hojas de indicadores y cálculos (no datos personales, salarios ni comentarios de candidatos).
- Cada dato se busca por su **etiqueta** (texto de la columna A), no por número de fila. Si cambias el orden de las filas dentro de una sección, el sitio las sigue encontrando. Si renombras una etiqueta o una pestaña, ese dato aparecerá como «—» hasta ajustar el parser.
- Los datos se refrescan solos cada 5 minutos (`revalidate`).
- Sin credenciales, el sitio funciona en **modo demo** con datos de prueba (aparece un aviso amarillo).

## Probarlo en tu computador

```bash
npm install
npm run dev        # abre http://localhost:3000 (modo demo)
```

## Conectar los Google Sheets (modo real)

1. En Google Cloud (console.cloud.google.com) crea un proyecto y habilita la **Google Sheets API**.
2. Crea una **cuenta de servicio** (IAM y administración > Cuentas de servicio) y genera una llave en formato JSON.
3. Abre cada Google Sheet > Compartir y agrega el correo de la cuenta de servicio (`...@...iam.gserviceaccount.com`) con permiso de **Lector**. Son dos archivos: el de metas y el de la meta 3.
4. Copia `.env.example` a `.env.local` y llena:
   - `DATA_MODE=live`
   - `SHEET_METAS_ID` y `SHEET_M3_ID` (la parte de la URL entre `/d/` y `/edit`).
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: el contenido completo del JSON, en una sola línea.
5. Reinicia y abre `/api/health`: debe decir `"mode":"live"` y `true` en las cinco metas. Si algo falla, el campo `errors` dice qué.

**Nunca subas `.env.local` ni el JSON de la cuenta de servicio a GitHub** (ya están en `.gitignore`).

## Publicarlo (GitHub y Vercel)

1. Crea un repositorio **privado** en GitHub y sube esta carpeta.
2. En vercel.com: Add New > Project > importa el repositorio (Vercel detecta Next.js solo).
3. En Settings > Environment Variables agrega las mismas variables del paso 4 (para Production y Preview).
4. Despliega. Abre `/api/health` en la URL de Vercel para confirmar la conexión.

Mientras se prueba, el sitio no tiene login: quien tenga el link puede verlo. Antes del uso real conviene
activar la protección de Vercel (Settings > Deployment Protection) o añadir login con Google restringido al dominio de Dapper.

## Updates semanales

- Cada meta debe tener al menos un update por semana. La semana cierra **cada lunes a la medianoche (hora de Bogotá)**: un update fechado de martes a lunes cuenta para ese lunes.
- Los updates se registran en una pestaña del Sheet de metas llamada exactamente **`Updates de metas`** (archivo `Updates_de_metas.xlsx`: en Google Sheets, Archivo > Importar > Subir > «Insertar hojas nuevas»).
- Si una meta cierra una semana sin update, su encargado suma 1 punto. El conteo empieza en `TRACKING_START` (por defecto el lunes 19 de octubre de 2026; en modo demo, el 21 de septiembre).
- Los encargados y a quién se le suman los puntos están en `lib/status.ts` (`owner` y `pointsOwner`).

## Logo y modo claro u oscuro

- Copia el logo a la carpeta `public/` y escribe su ruta en `lib/brand.ts` (por ejemplo `"/logo.svg"`). Si el logo no se ve sobre fondo oscuro, agrega una versión clara en `LOGO_DARK`.
- El botón de la esquina superior alterna entre modo claro y oscuro y recuerda la elección. Sin elección, sigue la configuración del teléfono o computador.

## Estructura

- `lib/parse/` un parser por meta (m1 a m5). Aquí se mapea cada etiqueta del Sheet a un dato.
- `lib/status.ts` encargados y reglas del semáforo de cada meta (editables).
- `lib/updates.ts` cálculo de la semana abierta, historial y puntos de incumplimiento.
- `lib/brand.ts` logo.
- `lib/demo/` datos de prueba con la misma forma que los Sheets reales.
- `lib/config.ts` pestañas y rangos que se leen.
- `components/views/` una pantalla de detalle por meta.
- `app/globals.css` tokens del sistema de color y estilos.
