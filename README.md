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

1. En console.cloud.google.com crea un proyecto (o usa uno existente) y habilita la **Google Sheets API** (APIs y servicios > Biblioteca).
2. IAM y administración > Cuentas de servicio > Crear cuenta de servicio (no necesita roles). Luego, dentro de ella: Claves > Agregar clave > Crear clave nueva > JSON. Se descarga un archivo.
3. Copia el correo de la cuenta (`client_email` del JSON) y compártelo como **Lector** en los dos Google Sheets (metas y meta 3). Desactiva la notificación por correo.
4. Verifica que el Sheet de metas tenga la pestaña `Updates de metas` (ver más abajo).
5. Copia `.env.example` a `.env.local` y llena `DATA_MODE=live`, los dos IDs de Sheet y `GOOGLE_SERVICE_ACCOUNT_JSON` (el JSON completo).
6. `npm run dev` y abre `/api/health`: debe decir `"mode":"live"` y `true` en las cinco metas. Si algo falla, `errors` explica qué hacer.

Posibles bloqueos en Google Workspace: si el administrador impide crear claves de cuentas de servicio o compartir archivos fuera del dominio, hay que pedirle que lo permita para esta cuenta.

**Nunca subas `.env.local` ni el JSON de la cuenta de servicio a GitHub** (ya están en `.gitignore`).

## Subir a GitHub

Crea primero un repositorio **privado y vacío** en GitHub (sin README). Luego, desde la carpeta del proyecto:

```bash
git init
git add .
git status          # revisa que NO aparezcan .env.local ni node_modules
git commit -m "Dashboard de metas Q4 2026"
git branch -M main
git remote add origin https://github.com/TU-ORGANIZACION/dapper-dashboard.git
git push -u origin main
```

## Desplegar en Vercel

1. vercel.com > Add New > Project > importa el repositorio. Vercel detecta Next.js solo; no cambies nada del build.
2. Antes de desplegar, en Environment Variables agrega (Production y Preview):

| Variable | Valor |
|---|---|
| `DATA_MODE` | `live` |
| `SHEET_METAS_ID` | ID del Sheet de metas |
| `SHEET_M3_ID` | ID del Sheet de la meta 3 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | el JSON completo de la cuenta de servicio |
| `TRACKING_START` | `2026-10-19` (primer lunes que cuenta para los puntos de updates) |
| `BASIC_AUTH_USER` y `BASIC_AUTH_PASSWORD` | usuario y contraseña de acceso (recomendado) |

3. Despliega y abre `https://TU-URL/api/health` para confirmar la conexión.
4. Cada `git push` a `main` vuelve a desplegar. Los datos se refrescan solos cada 5 minutos, sin necesidad de desplegar.

Con `BASIC_AUTH_USER` y `BASIC_AUTH_PASSWORD` definidos, el navegador pide usuario y contraseña (el celular los recuerda). Sin ellas, el sitio queda abierto a quien tenga el link.

## Pestañas que lee el sitio (no cambiarles el nombre)

| Sheet | Pestañas |
|---|---|
| Metas (`SHEET_METAS_ID`) | `M1 Cálculos`, `M1 ARR`, `M2 Cálculos`, `M2 PAE`, `M4 Indicadores`, `M5 Indicadores E`, `M5 Análisis E`, `M5 Canales Marketing E`, `Updates de metas` |
| Meta 3 (`SHEET_M3_ID`) | `M3 Indicadores` (solo datos agregados; el sitio no lee nombres, correos ni salarios de candidatos) |

El sitio busca cada dato por su **etiqueta** (el texto de la columna A y los encabezados), no por número de fila. Se pueden mover filas dentro de una sección o agregar columnas al final, pero si se renombra un título de sección, una etiqueta o una pestaña, ese dato aparecerá como «—» (o el sitio mostrará un aviso) hasta ajustar el parser en `lib/parse/`. Las pestañas `M5 Contenido` y `M5 Indicadores` anteriores (ocultas) ya no se leen.

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
