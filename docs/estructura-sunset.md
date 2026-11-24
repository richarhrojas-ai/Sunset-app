# Estructura de la app Sunset (para replicar en otra app)

Resumen para llevar a un chat nuevo. Describe cómo está armada la app, qué decisiones se tomaron y qué conviene copiar tal cual.

## 1. Qué es
App personal de uso diario (PWA, móvil y tablet) para el Sistema Sunset: 52 semanas al año, 7 colores, 49 palabras (7 dimensiones × 7 palabras).
Cada semana tiene un color, un título, una frase (hook), una historia, un @ por día (lunes a sábado), tres preguntas de reflexión el sábado y una autoevaluación de 3 palabras principales (3 preguntas esenciales cada una).
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
- `a/Palabra` respuestas (1–5, una por pregunta) · `c/Palabra` «Lo que me llevo de…»
- `d0..d6` registro del día (0 = domingo) · `g0..g6` gratitud · `m0..m6` ánimo 1–5
- `sab0..sab2` respuestas a las preguntas de reflexión del sábado
- `funciono`, `intencion` (cierre) · `nota` (nota posterior de una semana cerrada) · `AAAA/w0/intencion` (intención inicial del primer año)
Sincronización: `POST /api/sync` fusiona con lo guardado (escritura condicional, reintentos); copia diaria automática (`backups/AAAA-MM-DD`);
restaurar copias con deshacer; exportar/importar JSON y planilla CSV.

## 6. Pantalla, de arriba abajo
1. **Portada**: paisaje del color de la semana, logo, fecha, franja de 7 íconos con el nombre de su dimensión debajo (al tocar uno aparece la dimensión, la palabra, qué es la dimensión y su pregunta central; «Abrir» muestra la ficha completa), «● Semana verde» y las fechas, número de semana discreto, nombre común y científico del árbol, flechas de semana y firma. En el celular la portada es compacta.
2. Barra de atajos fija: Hoy · Semana · Mi año · Buscar, con el ícono de modo Auto · Día · Noche al final.
3. **Hoy** (la app abre aquí): frase del día, «Tu semana» (intención, las 3 palabras con su avance, días tocables), preguntas de hoy (lunes a viernes), registro, gratitud, ánimo, agenda y versículo. El sábado: preguntas de reflexión con respuesta oculta, lo pendiente de a una y el cierre de cada palabra (resultado, tendencia, «Lo que me llevo de…»). El domingo: la historia de la semana y la preparación. Flechas para recorrer días anteriores.
4. **Semana**: versículo, «Esta semana quiero…», agenda, domingo con su historia, lunes a sábado (6 tarjetas, cada una con su matiz), «Hace un año», autoevaluación (3 palabras × 3 preguntas, escala con palabras, tendencia y frase de cierre) y cierre (maestría del color, ánimo de la semana, qué funcionó, intención).
5. **Mi año**: meta del 70 % de días con registro, progreso del año (flores), ánimo del año (árboles), tablero de maestría (49 palabras), diario/agenda/recordatorio, respaldo y sincronización.
6. Al pie de todas las vistas: logo mediano, «Sunset» y «Soluciones Prácticas».

## 7. Reglas del sistema
- Rotación: cada semana usa una columna de color; sus 7 palabras están «en juego» y 3 son las principales (se evalúan).
- Puntaje de una palabra = promedio de las preguntas respondidas (las sin responder no cuentan). Semana = promedio de las palabras con respuestas.
- Maestría del color: cuando las 7 palabras de un color ya pasaron por evaluación, la de mejor puntaje acumulado queda como su maestría (automática, sin elegir).
- Domingo es el primer día de la semana.
- Se puede modificar la semana actual y la anterior; las más antiguas quedan de solo lectura y solo admiten una «nota posterior» (`AAAA/wN/nota`), que va al diario pero no suma a las estadísticas.
- Meta del año: registrar el 70 % de los días vividos (se muestra en Mi año; no se busca perfección).
- Cada dimensión tiene una frase que la define y una pregunta central (las mismas del libro): Regalo de Dios «Lo que no se gana: se recibe.», Prioridades «A quién le doy mi tiempo y mi presencia.», Temas de Interés «Donde me formo para servir mejor.», Desafío «La persona en la que me propongo convertirme.», Valores «Lo que no se negocia.», Estrategia «Las herramientas que multiplican lo que hago.», Sistema «La vida como una partida: comenzar, ordenar, cerrar, no perder el rey.».
- En pantalla las palabras abreviadas de la planilla se muestran completas (Ahorro de Tiempo, Equipo de Auxilio, Vida Cristiana); las claves guardadas usan la palabra original.

## 8. Diseño
- Estilo crepúsculo: violeta de medianoche → ámbar (de noche el final de la página vuelve al tono de arriba); cada color tiene su propio cielo (variables `--bg-top/mid/low/warm`) y su gama de tonos; tarjetas de vidrio; brillo dorado `#FFD700/#F0A830`.
- Tipografía Jost fina con mucho espacio entre letras; título del logo en Nunito; firma en Dancing Script.
- Íconos de línea blanca (7 dimensiones), un árbol fijo por color con nombre común y científico (lapachos, jacarandá, flamboyán, timbó, algarrobo negro), modo día y noche. Logo: sol con franjas y árbol de bronce con la misma copa que los paisajes (`tools/tree-render.js`).
- Cada día de la semana toma un matiz distinto dentro de la gama del color de la semana.

## 9. Calidad
- Pruebas automáticas de sincronización (`npm test`) y pruebas de navegador con Playwright (flujos, móvil/escritorio, accesibilidad con axe: 0 violaciones).
- Contraste y tamaños táctiles verificados; funciona sin conexión; respeta «reducir movimiento».

## 10. Qué copiar para otra app (p. ej. Mensajero con Tema Macro)
Se puede reutilizar tal cual: el esquema de claves `{v,t}` con fusión por fecha, `sync.mjs`/`content.mjs`/`auth.mjs`, la clave única, el flujo Excel → `data.mjs`,
el sistema de copias/restaurar/exportar, el diseño por variables de color, el buscador, el diario en documento y las pruebas.
Lo que cambia es el contenido y el vocabulario: qué es una «semana», qué son los «días», qué se evalúa y qué cuenta como progreso. Definir eso primero y luego mapear al mismo modelo.
