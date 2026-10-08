# Sunset App

Dashboard semanal del Sistema Sunset (Richarh Rojas), de 2027 en adelante.

## Estructura

```
index.html                         Página de la app
css/app.css                        Estilos
js/app.js                          Lógica (rotación, autoevaluación, tablero, respaldo)
data/planillas/                    Una planilla por año: sunset-contenido-AAAA.xlsx
data/sunset-data.js                Datos generados desde las planillas — no editar a mano
tools/build_data.py                Generador de data/sunset-data.js
manifest.webmanifest, sw.js, icons/   Instalación como app (PWA) y uso sin conexión
netlify/functions/sync.mjs         Sincronización del progreso (Netlify Blobs)
tests/                             Pruebas de la función (`npm test`)
```

## Agregar o actualizar un año

1. Guardar la planilla en `data/planillas/sunset-contenido-AAAA.xlsx`
   (el año en el nombre del archivo es obligatorio).
2. Correr `python3 tools/build_data.py` (requiere `openpyxl`).
3. Subir la versión de caché en `sw.js` (`sunset-vN`) para que los dispositivos
   con la app instalada tomen los cambios.

La app elige el año según la fecha y permite pasar de la última semana de un año
a la primera del siguiente.

## Cómo se leen las planillas

- **Frases**: una fila por semana (domingo a sábado). La fecha de la semana 1 define
  el primer domingo del año.
- **Preguntas**: las 49 palabras (7 dimensiones × 7 palabras) con sus 5 preguntas.
  El orden de las filas arma el tablero 7×7.
- **Mapeo Puente** (opcional): referencia interna; se muestra en "Historia interna".

Para cada semana, el script ubica las 3 palabras principales en el tablero:

```
palabra_k = tablero[(fila + k) % 7][columna]     // k = 0,1,2 activas; 3..6 "en juego"
```

Si no forman una columna del tablero, o si el color no avanza de a uno respecto de la
semana anterior, el script se detiene y avisa la semana con el problema.
La columna define el color: Negro, Rojo, Azul, Lila, Verde, Amarillo, Blanco.

## Datos del usuario

Lo que se registra en la app:

- **Registro diario** (domingo a sábado) en cada tarjeta del día.
- **Autoevaluación**: 5 respuestas del 1 al 5 por cada palabra activa, más un comentario.
- **Cierre de la semana**: maestría confirmada (la app sugiere la palabra de mayor
  puntaje), qué funcionó / qué mejorar e intención para la próxima semana.

Todo se guarda primero en el navegador (`localStorage`, clave `sunset_v2`) como
`{ clave: { v: valor, t: fecha } }`; al combinar dos copias gana el dato más reciente.

### Sincronización

Con una clave, la app envía los cambios a `/api/sync` (función de Netlify) y recibe los
de otros dispositivos. Los datos quedan en Netlify Blobs (almacén `sunset`):

- `progreso`: el estado actual.
- `backups/AAAA-MM-DD`: una copia por día, para volver a una versión anterior.

Configuración en Netlify: **Site configuration → Environment variables →** `SUNSET_KEY`
con la clave que se escribe en la app.

### Recuperar los datos

- **Descargar planilla**: CSV con una fila por semana (abre en Excel o Google Sheets).
- **Descargar respaldo / Importar respaldo**: JSON completo; importar suma al estado actual.
- Desde Netlify: las copias diarias en Blobs.
