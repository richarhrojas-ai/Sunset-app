# Estructura de la app Sunset (para replicar en otra app)

Resumen para llevar a un chat nuevo. Describe cómo está armada la app, qué decisiones se tomaron y qué conviene copiar tal cual.

## 1. Qué es
App personal de uso diario (PWA, móvil y tablet) para el Sistema Sunset: 52 semanas al año, 7 colores, 49 palabras (7 dimensiones × 7 palabras).
Cada semana tiene un color, un título, una frase (hook), una historia, un @ por día (lunes a sábado) y una autoevaluación de 3 palabras principales.
Además funciona como diario: registro por día, ánimo, gratitud, intención semanal, buscador, diario en documento, recordatorio.

## 2. Stack y despliegue
- Sitio estático en `public/` (HTML + CSS + JS sin framework). PWA: `manifest.webmanifest` + `sw.js` (red primero, caché versionada `sunset-vNN`).
- Netlify Functions (`netlify/functions/*.mjs`) + Netlify Blobs para guardar el progreso. Sin base de datos ni servicios externos.
- Una sola clave de acceso: variable de entorno `SUNSET_KEY`, enviada en la cabecera `x-sunset-key`.
- El contenido (planilla del año) NO está en `public/`: vive en `netlify/content/data.mjs` y solo se entrega por `/api/content` con la clave. La app lo guarda en el dispositivo para abrir sin conexión.

## 3. Carpetas
```
public/index.html        estructura de pantalla + sprite SVG de íconos
public/css/app.css       todo el diseño (variables por color, vidrio, tarjetas)
public/js/app.js         lógica (un IIFE): estado, vistas, sincronización, buscador, diario
public/js/tree.js        paletas por color + flor SVG
public/images/trees/     un paisaje fijo por color (wide + tall, WebP)
netlify/functions/       sync.mjs (progreso), content.mjs (contenido con clave)
netlify/lib/auth.mjs     validación de clave (timingSafeEqual, demora ante error)
netlify/content/data.mjs contenido generado (no se edita a mano)
content/planillas/       Excel del año: la fuente de verdad del contenido
tools/                   build_data.py (Excel → data.mjs), render_trees.cjs (imágenes), make_icons.py, new_key.py
tests/                   pruebas de sincronización (node --test)
```

## 4. Flujo de contenido
Excel (`sunset-contenido-AAAA.xlsx`) → `python3 tools/build_data.py` → `netlify/content/data.mjs` → `/api/content` (con clave) → app.
Cada año nuevo = una planilla nueva; la app une los años y la semana 1 de un año continúa la última del anterior.

## 5. Modelo de datos (todo lo del usuario)
`state.entries[clave] = { v: valor, t: milisegundos }`. Al sincronizar gana la entrada más reciente por clave.
Claves por semana (`AAAA/wN/...`):
- `a/Palabra` 5 respuestas (1–5) · `c/Palabra` comentario
- `d0..d6` registro del día (0 = domingo) · `g0..g6` gratitud · `m0..m6` ánimo 1–5 · `p0..p6` cumplimiento 0–100
- `funciono`, `intencion` (cierre) · `AAAA/w0/intencion` (intención inicial del primer año)
Sincronización: `POST /api/sync` fusiona con lo guardado (escritura condicional, reintentos); copia diaria automática (`backups/AAAA-MM-DD`);
restaurar copias con deshacer; exportar/importar JSON y planilla CSV.

## 6. Pantalla, de arriba abajo
1. **Portada**: paisaje del color de la semana, logo, fecha, franja de 7 íconos (al tocar uno aparece la dimensión y la palabra), tarjeta de vidrio con la frase del día y el control de cumplimiento, semana y árbol, navegación entre semanas, firma.
2. Barra de atajos fija (Hoy, Autoevaluación, Cierre, Progreso, Ánimo, Tablero, Buscar).
3. Versículo de la semana (el @ del lunes, fijo) · «Esta semana quiero…» (intención de la semana anterior) · enlace a la agenda de Google.
4. **Domingo**: título, frase de la semana destacada, historia interna.
5. **Lunes a sábado**: 6 tarjetas, cada una con su matiz; título en negrita arriba, frase centrada, botón «Registro, ánimo y gratitud» abajo. Hoy se escribe en la tarjeta; los otros días se abren en una pantalla grande.
6. «Hace un año» (si hay datos de esa semana el año anterior).
7. **Autoevaluación**: 3 palabras principales, 5 preguntas de 1 a 5, porcentaje discreto.
8. **Cierre**: maestría del color (automática), ánimo de la semana (7 barras), qué funcionó, intención.
9. Plegables: Progreso del año (flores), Ánimo del año (árboles que se pintan), Tablero de maestría (49 palabras), Diario/agenda/recordatorio, Respaldo y sincronización.

## 7. Reglas del sistema
- Rotación: cada semana usa una columna de color; sus 7 palabras están «en juego» y 3 son las principales (se evalúan).
- Puntaje de una palabra = promedio de las preguntas respondidas (las sin responder no cuentan). Semana = promedio de las palabras con respuestas.
- Maestría del color: cuando las 7 palabras de un color ya pasaron por evaluación, la de mejor puntaje acumulado queda como su maestría (automática, sin elegir).
- Domingo es el primer día de la semana.

## 8. Diseño
- Estilo crepúsculo: violeta de medianoche → ámbar; cada color tiene su propio cielo (variables `--bg-top/mid/low/warm`) y su gama de tonos; tarjetas de vidrio; brillo dorado `#FFD700/#F0A830`.
- Tipografía Jost fina con mucho espacio entre letras; título del logo en Nunito; firma en Dancing Script.
- Íconos de línea blanca (7 dimensiones), un árbol fijo por color (jacarandá, flamboyán, lapacho, etc.), logo propio.
- Cada día de la semana toma un matiz distinto dentro de la gama del color de la semana.

## 9. Calidad
- Pruebas automáticas de sincronización (`npm test`) y pruebas de navegador con Playwright (flujos, móvil/escritorio, accesibilidad con axe: 0 violaciones).
- Contraste y tamaños táctiles verificados; funciona sin conexión; respeta «reducir movimiento».

## 10. Qué copiar para otra app (p. ej. Mensajero con Tema Macro)
Se puede reutilizar tal cual: el esquema de claves `{v,t}` con fusión por fecha, `sync.mjs`/`content.mjs`/`auth.mjs`, la clave única, el flujo Excel → `data.mjs`,
el sistema de copias/restaurar/exportar, el diseño por variables de color, el buscador, el diario en documento y las pruebas.
Lo que cambia es el contenido y el vocabulario: qué es una «semana», qué son los «días», qué se evalúa y qué cuenta como progreso. Definir eso primero y luego mapear al mismo modelo.
