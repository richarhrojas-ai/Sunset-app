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

- **Frases**: una fila por semana (domingo a sábado). La fecha de la semana 1 de la planilla define el primer domingo.
- **Introducción** (opcional): `content/planillas/introduccion-AAAA.json` agrega los días que quedan antes del primer domingo del año (con `dias`: cada día con su etiqueta y su texto o preguntas). `numeracion: "desplaza"` la cuenta como Semana 1 y corre las demás un número (2027: viernes 1 y sábado 2, semana azul); `numeracion: "cero"` la deja como Semana 0 y la semana de la planilla sigue siendo la 1 (2028: sábado 1 de enero). Internamente se guarda como `w0`, así que las claves de las demás semanas no cambian. El archivo de un año solo se usa cuando existe su planilla.
- **Preguntas**: las 49 palabras (7 dimensiones × 7 palabras) con sus 5 preguntas; el orden arma el tablero 7×7.
- **Mapeo Puente** (opcional): referencia interna, se muestra en "Historia".

Para cada semana, el script ubica las 3 palabras principales en el tablero y se detiene si no forman una
columna o si el color no avanza de a uno:

```
palabra_k = tablero[(fila + k) % 7][columna]     // k = 0,1,2 activas; 3..6 "en juego"
```

## Estilo visual

Crepúsculo: violeta de medianoche (`#1C102B`) arriba, ámbar quemado (`#B84A15`) abajo; línea blanca mate, destellos
dorados (`#F0A830` / `#FFD700`), tarjetas de vidrio oscuro, letra Jost fina con mucho espacio entre letras y firma en
cursiva. Los colores de cada semana (`accent` / `mid`) están en `public/js/tree.js`.

- **Las siete palabras** (cabecera): una por dimensión, con su ícono de línea. Las tres principales de la semana brillan y
  llevan la marca "Principal". Tocar una principal abre la autoevaluación con esa palabra; tocar una de las otras abre una
  ficha con sus preguntas y la semana en que se evalúa. El marco dorado se desliza hasta la palabra elegida.
- **Frase de hoy** (vidrio, a la izquierda del árbol en la vista Semana): el @ del día. El antiguo control de cumplimiento
  se quitó; los valores ya guardados (`AAAA/wN/pD`) se conservan y siguen saliendo en la planilla CSV y el diario.
- Los íconos se generan con `python3 tools/make_icons.py` (símbolos `d-0` a `d-6`).
- Al tocar un ícono aparece la palabra con el concepto de su dimensión (qué es y su pregunta central), los mismos del libro (`DIM_CONCEPTS` en `public/js/app.js`). «Abrir» muestra la ficha completa de la dimensión (`DIM_ABOUT`), sus 7 palabras y las preguntas de la palabra.

## Imágenes de los árboles

Cada color tiene dos imágenes fijas (ancha y para celular). Por defecto son ilustraciones generadas con
`npm run render:images` (requiere Playwright y Pillow), que también regenera el logo y los íconos.

Para usar una **foto real**:

```
python3 tools/hero_from_photo.py mi-lapacho.jpg Lila --x 0.6 --y 0.5
```

Recorta la foto a los dos formatos y reemplaza las imágenes de ese color. Los consejos para elegir la foto
están en el encabezado de `tools/hero_from_photo.py`. Después subir la versión de caché en `sw.js`.

## Uso diario

- **Hoy** (la app abre aquí): «Tu semana» (título, intención, avance de las 3 palabras y días con registro), frase de hoy, registro corto (con dictado), gratitud, ánimo, la pregunta del día y la agenda. El **sábado** es día de evaluación: las preguntas pendientes se responden en Hoy. El **domingo** es día de preparación: repaso de la semana que terminó, «¿Qué funcionó?» y la intención para la nueva. Con las flechas de Hoy (o tocando un día de «Tu semana») se abre cualquier día anterior con su mismo tratamiento, cruzando semanas; no se puede ir a días futuros. Barra de atajos: Hoy · Semana · Mi año · Buscar. **Mi año** reúne progreso, ánimo, tablero, diario y respaldo; la **Semana** queda solo con la semana. En Hoy la frase del día va primero y el versículo de la semana al final (salvo el lunes, en que es la frase del día).
- **Racha amable**: cuántos de los últimos 7 días tienen algo registrado; nunca castiga.
- **Pregunta del día**: una de las 15 preguntas de la semana por día; las respuestas cuentan en la autoevaluación.
- **Resumen de la semana**: botón en el cierre. El domingo, la primera vez que se abre la app, aparece solo el de la semana que terminó.
- **Dictado**: botón «Dictar» en Hoy, en el registro de hoy y en la pantalla grande. Usa el reconocimiento de voz del navegador (en Chrome el audio lo procesa Google).

### Notificación diaria (opcional)

1. `npm run push:claves` imprime `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`.
2. Créalas como variables de entorno en Netlify (Site configuration → Environment variables). Opcional: `VAPID_SUBJECT=mailto:tu@correo`.
3. Vuelve a publicar. En la app: Diario, agenda y recordatorio → «Activar notificación diaria». La función `push-diario` corre cada hora y avisa una vez por día, a la hora en punto elegida, en la zona horaria del dispositivo. En iPhone funciona con la app instalada en la pantalla de inicio (iOS 16.4 o posterior).

### Eventos de Google Calendar dentro de la app (opcional)

1. En Google Cloud Console: crea un proyecto, activa **Google Calendar API** y configura la pantalla de consentimiento (tipo Externo, en modo prueba, con tu correo como usuario de prueba).
2. Credenciales → **ID de cliente de OAuth** → Aplicación web. En «Orígenes de JavaScript autorizados» pon la dirección del sitio (por ejemplo `https://tu-sitio.netlify.app`).
3. Crea en Netlify la variable `GOOGLE_CLIENT_ID` con ese ID y vuelve a publicar.
4. En la app aparece «Ver mis eventos de hoy». El permiso es solo de lectura y el acceso vive en la memoria de la app (no se guarda en el servidor).

Sin estas variables la app funciona igual: muestra el enlace a la agenda y el recordatorio descargable.

## Datos del usuario

Qué se registra: el registro de cada día (domingo a sábado), las 5 respuestas por palabra con su comentario,
qué funcionó y la intención. El registro de hoy se escribe en la tarjeta
(con **Ampliar** para textos largos); el de los otros días solo muestra una pestaña con la cantidad de palabras
y se lee abriéndola. El porcentaje es el promedio de las preguntas **respondidas**, y la maestría es automática:
cuando las 7 palabras de un color ya pasaron por evaluación, la de mejor calificación acumulada queda como su maestría.

Además: **Buscar** (todo lo escrito), ánimo y gratitud por día, la línea «Esta semana quiero…», el versículo fijo de la semana
(el @Regalo del lunes), el **diario en documento** (imprimir/PDF o texto .md), enlaces a la **agenda de Google** del día y la semana, y un
**recordatorio diario** (.ics) que se abre en cualquier agenda. Los eventos de la agenda dentro de la app requieren autorización de Google y no están incluidos.

Todo lo que se registra se guarda primero en el dispositivo (`localStorage`) como `{ clave: { v, t } }`,
y al sincronizar gana, dato por dato, la versión más reciente (si dos dispositivos guardan a la vez, el
servidor reintenta y combina). En Netlify Blobs (almacén `sunset`):

- `progreso`: el estado actual.
- `backups/AAAA-MM-DD`: cómo estaba todo antes del primer cambio de cada día.

### Recuperar los datos

- **Volver a una copia**: *Respaldo y sincronización → Ver copias diarias → Restaurar* (se puede deshacer).
- **Descargar planilla**: CSV con una fila por semana (Excel / Google Sheets).
- **Descargar respaldo / Importar respaldo**: JSON completo; al importar se elige combinar o reemplazar.

## Reglas de registro

- Se edita la semana actual y la anterior. Las semanas más antiguas quedan de solo lectura; se les puede agregar una **nota posterior** (por ejemplo, por qué no se registró), que aparece en el diario y el buscador pero no cuenta para racha, ánimo ni evaluación.
- **Meta del año:** 70 % de los días con registro, visible en «Mi año».
