# Sunset App

Dashboard semanal del Sistema Sunset (Richarh Rojas), de 2027 en adelante. Uso personal, protegido con clave.

## Estructura

```
public/                       Lo único que se publica en la web
  index.html, css/, js/       La app (js/app.js = lógica, js/tree.js = árboles del progreso)
  images/trees/               Paisaje de cada color: <Color>-wide.webp y <Color>-tall.webp
  images/logo.png, icons/     Logo e íconos de la app instalada
  sw.js, manifest.webmanifest Instalación como app y uso sin conexión
content/planillas/            Una planilla por año: sunset-contenido-AAAA.xlsx (NO se publica)
netlify/content/data.mjs      Contenido generado desde las planillas (NO se publica, lo lee el servidor)
netlify/functions/            /api/content (entrega el contenido con clave) y /api/sync (registros)
netlify/lib/auth.mjs          Verificación de la clave
tools/                        Generadores (datos, imágenes, clave)
tests/                        Pruebas de las funciones: `npm test`
```

## Clave de acceso

Una sola clave abre la app y autoriza la sincronización. Sin ella, el sitio solo muestra la pantalla
de clave: el contenido de las semanas no está en los archivos públicos, lo entrega `/api/content`.

1. Generar una clave: `npm run clave`
2. Netlify → *Site configuration → Environment variables* → crear `SUNSET_KEY` con esa clave
   y volver a publicar el sitio.
3. En cada dispositivo, escribirla una vez. Después la app abre sola, también sin conexión.

Cambiar la clave: cambiar `SUNSET_KEY` y volver a publicar. Los dispositivos piden la nueva clave.

> **El repositorio debe ser privado.** El contenido y las planillas están en el repositorio; si fuera
> público, cualquiera podría leerlos en GitHub aunque el sitio tenga clave.

## Agregar o actualizar un año

1. Guardar la planilla en `content/planillas/sunset-contenido-AAAA.xlsx` (el año en el nombre es obligatorio).
2. `npm run build:data` (requiere `python3` y `openpyxl`).
3. Subir la versión de caché en `public/sw.js` (`sunset-vN`).

La app elige el año según la fecha y pasa de la última semana de un año a la primera del siguiente.

### Cómo se leen las planillas

- **Frases**: una fila por semana (domingo a sábado). La fecha de la semana 1 define el primer domingo.
- **Preguntas**: las 49 palabras (7 dimensiones × 7 palabras) con sus 5 preguntas; el orden arma el tablero 7×7.
- **Mapeo Puente** (opcional): referencia interna, se muestra en "Historia interna".

Para cada semana, el script ubica las 3 palabras principales en el tablero y se detiene si no forman una
columna o si el color no avanza de a uno:

```
palabra_k = tablero[(fila + k) % 7][columna]     // k = 0,1,2 activas; 3..6 "en juego"
```

## Imágenes de los árboles

Cada color tiene dos imágenes fijas (ancha y para celular). Por defecto son ilustraciones generadas con
`npm run render:images` (requiere Playwright y Pillow), que también regenera el logo y los íconos.

Para usar una **foto real**:

```
python3 tools/hero_from_photo.py mi-lapacho.jpg Lila --x 0.6 --y 0.5
```

Recorta la foto a los dos formatos y reemplaza las imágenes de ese color. Los consejos para elegir la foto
están en el encabezado de `tools/hero_from_photo.py`. Después subir la versión de caché en `sw.js`.

## Datos del usuario

Qué se registra: el registro de cada día (domingo a sábado), las 5 respuestas por palabra con su comentario,
la maestría confirmada de la semana, qué funcionó y la intención. El registro de hoy se escribe en la tarjeta
(con **Ampliar** para textos largos); el de los otros días solo muestra una pestaña con la cantidad de palabras
y se lee abriéndola. El porcentaje es el promedio de las preguntas **respondidas**, y la maestría se sugiere
solo cuando una palabra tiene al menos 3 respuestas.

Todo lo que se registra se guarda primero en el dispositivo (`localStorage`) como `{ clave: { v, t } }`,
y al sincronizar gana, dato por dato, la versión más reciente (si dos dispositivos guardan a la vez, el
servidor reintenta y combina). En Netlify Blobs (almacén `sunset`):

- `progreso`: el estado actual.
- `backups/AAAA-MM-DD`: cómo estaba todo antes del primer cambio de cada día.

### Recuperar los datos

- **Volver a una copia**: *Respaldo y sincronización → Ver copias diarias → Restaurar* (se puede deshacer).
- **Descargar planilla**: CSV con una fila por semana (Excel / Google Sheets).
- **Descargar respaldo / Importar respaldo**: JSON completo; al importar se elige combinar o reemplazar.
