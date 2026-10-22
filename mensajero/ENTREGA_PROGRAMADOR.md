# Edificando una Cultura 2027 · Entrega al programador

**Mensajero 100.9 FM** · preparado el 20 de octubre de 2026 · dudas de contenido: Richarh Rojas

> **La receta.** Nosotros hicimos la masa y la mezcla: el contenido de todo 2027, revisado, y un prototipo que ya funciona con ese contenido. El programador lo cocina: lo lleva a producción (archivos separados, servidor, sincronización, claves). Al salir del horno tiene que tener **el mismo sabor** (el contenido y las reglas de este documento, sin cambios) y **la misma terminación** (el diseño y el comportamiento del prototipo). Si algo de la receta no se puede hacer, se consulta antes de cambiarlo.

- **Prototipo funcionando:** https://claude.ai/artifact/QqQ5Epdkk8f2r4Y3TPn9ps (es la referencia visual y de comportamiento)
- **Repositorio:** `richarhrojas-ai/sunset-app`, rama `claude/mensajero-tema-macro`, carpeta `mensajero/`
- **Prueba automática:** `node mensajero/tests/humo.cjs` (41 controles; hoy pasan todos)

---

## 1. Qué es y para quién

Una app web instalable (PWA), para celular y computadora, que usan los locutores y la coordinación de Mensajero para **preparar, salir al aire y registrar** la serie *Edificando una Cultura* durante 2027.

- **Locutores:** ven la semana, el guion de su día, lo adaptan a su estilo, marcan «Al aire», cuentan mensajes de oyentes y completan su preparación.
- **Coordinación:** ve registros e informes; abre semanas cerradas con su clave.
- **Audiencia (indirecta):** recibe el contenido al aire, los flyers en redes y los números útiles.

El guion **es una base, no un libreto**: el locutor mantiene el versículo tal cual (RVC), la idea central y la fuente del dato; el resto lo adapta.

## 2. Lo que ya está hecho (la masa)

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Semanas con tema, enfoque, 3 subtemas, valor, programa, historia | 52 | listo |
| Versículos (RVC) con 3 puntos | 364 (domingo a sábado) | listo; 12 cambios sugeridos esperan decisión (§11) |
| Guiones de lunes a sábado (título, dato con fuente, 3 puntos con desarrollo, problemática y práctica; sábado = repaso) | 312 | listo, con revisión teológica y datos verificados |
| Frases célebres verificadas | 260 (3 por semana + una segunda para los subtemas 1 y 2) | listo |
| Frases deportivas (originales, sin autor) | 364 | listo |
| Historia bíblica y marcos (por tema y ronda) | 52 | listo |
| Guía de los 5 valores | 5 | listo |
| Hoja «Mensajero» (información institucional) | 29 ítems | **incompleta**: 17 por completar (§11) |
| Números útiles para la audiencia | 6 | listo, a reconfirmar cada tanto |
| Prototipo (un solo `index.html`) | 1 | funciona al 100% según la prueba de humo |

Criterios con los que se escribió y revisó todo: `content/criterios_teologicos.md` (contexto bíblico, sin teología de la prosperidad, sin retribución, fe y salud mental, temas sensibles derivados a un profesional, sin posturas que dividan iglesias, falacias, datos con fuente, estilo).

## 3. Ingredientes: la planilla

Fuente de verdad: `content/planillas/Mensajero_TemasMacro_2027.xlsx`. **Nadie edita los datos a mano en la app**: se corrige la planilla (o el script que la llena) y se regenera.

| Hoja | Una fila por | Columnas que lee la app |
|---|---|---|
| Temas Macro 2027 | semana (52) | Semana, Fecha inicio (Dom) dd/mm/aaaa, Color, Tema, Ronda, Enfoque, Subtema 1–3, Desarrollo 1–3, Nota Locutor 1–3, Frase Celebre 1–3 y 1b–2b («frase» — Autor), Historia Ilustrativa, Valor (ADN), Programa, Locutor, Versiculo Domingo…Sabado («Cita — texto»), 3 Puntos Domingo…Sabado (uno por línea) |
| Guiones 2027 | día de lunes a sábado (312) | Semana, Dia, Titulo, Dato curioso, Fuente dato, Desarrollo 1–3, Problematica 1–3, Solucion 1–3. El sábado: Desarrollo 1–3 = idea de cada subtema y Solucion 1 = acción de la semana |
| Frases Deportivas 2027 | día de domingo a sábado (364) | Semana, Dia, Deporte, Frase |
| Historia y Marcos | tema + ronda | Tema, Ronda, Historia Biblica - Titulo / Texto, Marco Teorico - Afirmacion / Fuente, Marco Biblico - Versiculos clave (separados por \|) / Contexto / Conexion |
| Guia de Valores ADN | valor (5) | Valor, Definicion aplicada, Como se nota en el contenido, Pregunta guia, Ejemplo de aplicacion |
| Mensajero | ítem institucional | Seccion, Titulo, Texto, Para el aire (Sí/No) |

### Forma del JSON que genera `tools/build_data.py`

```text
{ anio: 2027,
  valores: { Orden: {definicion, contenido, pregunta, ejemplo}, … },
  mensajero: [ {seccion, titulo, texto, aire} ],
  semanas: [ { n, inicio "2027-01-03", color, tema, ronda, enfoque,
      subtemas: [ {titulo, desarrollo, nota, frase:{texto, autor}} ×3 ],
      historia, valor, programa, locutor,
      dias: [ {ref, texto, puntos[3], deporte,
               guion: null (domingo)
                    | {titulo, dato:{texto, fuente}, puntos:[{desarrollo, problema, solucion}×3]}   (lunes a viernes)
                    | {tipo:"resumen", titulo, dato, ideas[3], accion} } ×7 ],                       (sábado)
      marco: {historiaTitulo, historia, teorico, fuente, claves[], contexto, conexion} } ] }
```

`dias[0]` es domingo y `dias[6]` sábado. Hoy el JSON va incrustado en `index.html` entre `/*DATA*/` y `/*/DATA*/` (unos 730 KB). En producción debe servirse aparte (§8).

## 4. Cómo se prepara la masa (flujo de contenido)

Orden para regenerar todo desde cero (desde `mensajero/`):

1. `tools/guiones_<mes>_2027.py` (febrero a diciembre; enero ya está en la planilla) → escribe la hoja «Guiones 2027».
2. `tools/revision_teologica_<mes>_2027.py` → correcciones teológicas, con su motivo.
3. `tools/verificacion_datos_<mes>_2027.py` → datos verificados en su fuente.
4. `tools/ajuste_temas_sensibles_2027.py` y `tools/versiculos_aplicados_2027.py` → ajustes y versículos aprobados.
5. `tools/estilo_guiones_2027.py` → variación de arranques repetidos (`content/estilo_guiones_2027.json`).
6. `tools/frases_2027.py`, `tools/frases_segundas_2027.py` (fuente `content/frases_2027_b.txt`) y `tools/frases_deportivas_2027.py` (fuente `content/frases_deportivas_2027.txt`).
7. `python3 tools/build_data.py` → genera el JSON y escribe `content/revision_planilla.txt` (versículos repetidos, avisos y frases para revisión teológica; hoy: 0 repetidos, 0 avisos, 9 frases ya revisadas a mano).

Los scripts son idempotentes: se pueden correr de nuevo sin duplicar cambios. Requisito: Python 3 con `openpyxl`.

## 5. La app, de arriba abajo (la terminación)

### Portada
- **Escena ilustrada** del tema de la semana (SVG generado en código con la paleta del color). Cada tema tiene su propia luz, **no** el atardecer de Sunset: Vida Cristiana amanecer con la cruz; Crecimiento primera luz y lapacho en flor; Liderazgo mañana en la cordillera con bandera; Familia noche de luna con la casa encendida; Finanzas día con plantines y granero; Producción mediodía con surcos, alambrado y molino; Salud mañana con bruma en la laguna. Los elementos principales van al centro (el celular recorta los costados) y por debajo de la fila de íconos (las pantallas anchas recortan arriba y abajo).
- Logo y dos botones redondos: **A** (tamaño de letra) y **◐** (apariencia: automática, oscura, clara). Las fechas de la semana van en la tarjeta, junto al número de semana y el color.
- **Siete íconos de temas**: al tocar uno se abre una hoja con todas sus semanas (activa resaltada, próxima marcada, pasadas atenuadas).
- Tarjeta con tema, enfoque, color, número de semana y los tres subtemas; flechas y «Esta semana».

### Barra de atajos (fija)
Ficha · Mi semana · Preparación · Registro · Buscar · Útiles (el resto se alcanza en los grupos del final).

### Ficha de la semana
«Apoyamos al programa» (programa y locutor) y «Valor de Mensajero» con su guía interna plegable.

### Mis días al aire y varios programas
Una vez elegidos, la sección queda en una línea («Tu semana: lunes a viernes» y el botón «Cambiar días»); los botones de días aparecen solo al editar.
- El locutor marca sus días (lunes a viernes, lunes a sábado o los que elija). Un solo día = programa semanal: la tarjeta muestra introducción y resumen en un guion.
- Hasta **3 programas** por locutor, cada uno con su color y sus propias marcas. Los cambios de días quedan en un historial con fecha, así los días pasados no cambian.

### Mi semana: la tarjeta del día
Pestañas por día. Cada tarjeta, en este orden:
1. **Barra del día:** «Al aire», En vivo / Grabado y «+ Más» (Con entrevista, Reemplazo con el programa reemplazado). Nota personal del día plegable.
2. **Subtema del día** y «Para el locutor» plegable (desarrollo, nota y frase célebre del subtema).
3. **Título del guion, «Dato para abrir»** con su fuente y **versículo** (cita y texto RVC).
4. **Tres puntos plegables** (número y título a la vista; adentro desarrollo, problemática y «En la práctica»). Según la **franja horaria** del programa se abre el punto que le toca: mañana → 1, mediodía y tarde → 2, noche → 3, marcado «Tu punto de hoy». Sin franja se abre el 1. Así la audiencia que escucha varios programas no oye lo mismo dos veces.
5. **Frase para el aire** (frase célebre con su autor, distinta cada día: lunes y miércoles la primera del subtema, martes y jueves la segunda —columnas «Frase Celebre 1b» y «2b»—, viernes la del subtema 3; domingo y sábado no llevan, salvo el programa de un solo día) y **frase deportiva** del día (al final del contenido; el domingo, después de la historia ilustrativa).
6. **«Hacelo a tu estilo»:** idea central del día, dos técnicas que rotan sobre 15 y cómo hacerlo con poco tiempo.
7. Botones **Flyer** (imagen 1080×1350 del versículo con la escena y el color), **Copiar guion** (texto plano completo, con «← TU PUNTO DE HOY», la frase deportiva al final, las notas del día y de producción) y **Copiar para IA** (todo lo de la semana para generar un guion con IA).
8. **Mensajes de oyentes** (solo días en vivo): un cuadro con los logos de SMS, WhatsApp, YouTube, Instagram y Facebook. Cada toque suma 1; «Restar» y luego el logo resta 1 y se apaga solo; el número se puede escribir; arriba, el total.

Domingo: introducción de la semana, versículo con sus 3 puntos, historia ilustrativa y frase deportiva. Sábado: repaso (dato, idea de cada subtema, acción de la semana), versículo, frase deportiva.

### Grupos del final
- **Mi trabajo:** *Mi preparación* (programa: nombre, duración, modalidad y franja; lista de hasta 10 tareas elegidas de una biblioteca de 30 en cuatro grupos —Contenido 12, Producción 11, Técnica 4, Después del aire 3—; notas de producción; porcentaje), *Registro al aire* (por mes: días al aire, en vivo y grabados, entrevistas, mensajes por canal; copiar informe del mes), *Informe de preparación* (por mes, con niveles Excelente/Buena/Regular/Baja; copiar informe).
- **La serie 2027:** *Historia bíblica y marcos*, *Edificando una Cultura · 2027* (las 52 semanas por color con barra de días al aire), *Buscar* (sin distinguir tildes ni mayúsculas; lleva a la semana).
- **Para la audiencia:** *Números útiles* (911, 141 SEME —021 141 desde celular—, 132 Bomberos, 155 salud mental, 137 SOS Mujer y WhatsApp 0961 137 137, 147 Fono Ayuda niñez; tocar llama; copiar para leer al aire) y *Sobre Mensajero* (hoja «Mensajero»).

### Tamaño de letra
Botón «A» junto a la fecha: Normal, Grande (115 %) y Muy grande (130 %) para el contenido (cada tamaño se multiplica por la variable `--fz`; no se usa `zoom`, que algunas tabletas ignoran) (no para la ilustración), guardado en cada dispositivo (`localStorage["mensajero:letra"]`). Los títulos con contenido (subtemas, ideas del repaso) van en minúscula normal y negrita, no en mayúsculas espaciadas.

### Desplegables
Todo lo que se abre lleva el mismo indicador: un círculo con una flecha a la derecha que gira al abrir (grupos del final, «Para el locutor», «Hacelo a tu estilo», los tres puntos). Los desplegables chicos («Más», «Agregar nota», «Guía interna») son botones tipo píldora con borde.

### Apariencia
Automática (oscura en el celular, clara en la computadora: `min-width: 900px` y puntero fino), oscura o clara; se guarda en cada dispositivo. La ilustración de arriba y las hojas de tema quedan siempre oscuras. Paletas de los 7 colores en el objeto `PAL`; en claro, los dorados y colores de texto pasan a tonos legibles sobre blanco.

### Diseño
Tipografía Jost (peso 400 para el texto; letra mínima de 10,5 px y la mayoría de las etiquetas en 12–13 px; contraste de todo el texto ≥ 4,5:1 en oscuro y claro, medido sobre el fondo real), Nunito para «MENSAJERO», Dancing Script para «Suena bien, hace bien». Probado a 390 px y 1280 px sin desborde horizontal. Respeta «reducir movimiento».

## 6. Reglas de negocio

- **Semanas** de domingo a sábado; la 1 empieza el **3 de enero de 2027**. «Esta semana» contiene la fecha de hoy; antes del 3 de enero se abre la semana 1.
- **Color y tema** salen de la planilla; no se calculan.
- **Plazo de marcación:** la semana N se marca durante esa semana y la siguiente; al empezar la N+2 queda **cerrada**. Coordinación la abre con su clave y cada apertura queda registrada con fecha (`AAAA/wN/correccion`). Con la semana cerrada, ninguna marca, nota ni mensaje se puede cambiar.
- **Modalidad:** cada programa tiene una por defecto (En vivo / Siempre grabado) y cada día puede cambiarla. Al marcar «Al aire» o un mensaje, la modalidad de ese día queda fija aunque después cambie la del programa.
- **Registro mensual:** un día al aire cuenta en el mes de su fecha. Muestra días al aire sobre días del mes, en vivo y grabados, entrevistas y mensajes por canal (solo si hubo). Los informes copiados terminan con «MENSAJES DE OYENTES».
- **Preparación:** la lista que regía al marcar una semana se guarda con la semana (`prepLista`), así cambiar la lista no altera semanas pasadas. Las tareas de «Contenido» y los reemplazos son del locutor (sin prefijo de programa).
- **Un punto por programa** según la franja (ver §5).
- **Contenido protegido:** versículos RVC con permiso de la Sociedad Bíblica del Paraguay.

## 7. Datos del usuario

Esquema de Sunset: `entries[clave] = { v: valor, t: milisegundos }`. Al sincronizar **gana la entrada más reciente por clave**. Hoy todo se guarda en `localStorage["mensajero:entries"]`.

Prefijos: semana `2027/wN/`; programa 2 y 3 agregan `p2/` o `p3/` (el programa 1 no lleva prefijo).

| Clave | Valor | Qué es |
|---|---|---|
| `2027/wN/[pX/]aire0…6` | bool | Día al aire |
| `2027/wN/[pX/]ent0…6` | bool | Con entrevista |
| `2027/wN/reem0…6` | texto | Programa reemplazado (del locutor) |
| `2027/wN/[pX/]mod0…6` | `vivo` \| `grabado` | Modalidad fijada del día |
| `2027/wN/[pX/]msg0…6` | `{sms, wa, yt, ig, fb}` | Mensajes de oyentes |
| `2027/wN/[pX/]vn0…6` | texto | Nota del día |
| `2027/wN/[pX/]notas` | texto | Notas de producción |
| `2027/wN/[pX/]prep/<id>` · `2027/wN/prep/<id>` | bool | Tarea de preparación (Contenido sin prefijo) |
| `2027/wN/[pX/]prepLista` | ids | Lista vigente al marcar |
| `2027/wN/correccion` | fechas | Aperturas por coordinación |
| `cfg/[pX/]programa` | `{nombre, horas, modo, franja, dias}` | Configuración del programa |
| `cfg/[pX/]historial` | `[{desde, dias}]` | Cambios de días al aire |
| `cfg/[pX/]prep` · `cfg/[pX/]prepManual` | ids · bool | Lista de tareas elegida |
| `cfg/programas` · `cfg/activo` | ids · id | Programas del locutor y el activo |

Fuera de `entries` y solo del dispositivo: `localStorage["mensajero:apariencia"]` (`auto` \| `oscuro` \| `claro`).

## 8. Cómo cocinarlo: arquitectura de producción

Recomendación (mismo enfoque que Sunset, sin base de datos ni servicios externos):

```text
mensajero/
  public/index.html            estructura
  public/css/app.css           diseño (variables por color y modo claro)
  public/js/app.js             estado, vistas, registro, informes, buscador
  public/js/escenas.js         PAL, escena(), íconos
  public/images/               logo, marca, íconos 192/512 (hoy el logo va en data URI dentro del HTML)
  public/manifest.webmanifest, public/sw.js     PWA (red primero; subir la versión del caché en cada entrega)
  netlify/functions/content.mjs   entrega el contenido con clave
  netlify/functions/sync.mjs      guarda y fusiona entries {v,t} (Netlify Blobs)
  netlify/lib/auth.mjs            valida la clave (comparación de tiempo constante)
  netlify/content/data.mjs        generado por tools/build_data.py
  tools/ · content/ · tests/
```

- **El contenido no va en `public/`:** solo por `/api/content` con clave; la app lo guarda en el dispositivo para usar sin conexión.
- **Claves en variables de entorno** (por ejemplo `MENSAJERO_KEY`, cabecera `x-mensajero-key`). La **clave de coordinación** hoy está escrita en el código (`CLAVE_COORD`, provisoria) y debe pasar al servidor.
- `build_data.py` debe escribir `netlify/content/data.mjs` en lugar de incrustar en `index.html`.
- Las funciones de Sunset que se mencionan como modelo **no están en este repositorio** (solo `netlify.toml`); hay que escribirlas o traerlas del repositorio de Sunset.
- **Seguridad:** en la raíz, `notion.js` tiene un token de Notion escrito en el código. Revocarlo, crear uno nuevo y leerlo desde una variable de entorno. No reutilizar ese archivo.

## 9. Tareas para producción

- [ ] Separar `index.html` en HTML, CSS y JS (§8), sin cambiar comportamiento.
- [ ] Sacar el logo y la marca de data URI a `public/images/`.
- [ ] `build_data.py` → `netlify/content/data.mjs`.
- [ ] Funciones `content`, `sync`, `auth`; reemplazar `localStorage` por sincronización (con caché local para usar sin conexión).
- [ ] Clave de coordinación en el servidor; registro de aperturas en el servidor.
- [ ] Decidir usuarios (§11) y, si hay una clave por locutor, guardar el autor de cada marca.
- [ ] Panel de coordinación: informes de todos los locutores por mes (hoy cada informe es del dispositivo).
- [ ] Copias diarias, exportar e importar JSON.
- [ ] PWA: subir `CACHE` en `sw.js` en cada entrega.
- [ ] Pruebas: mantener `tests/humo.cjs` en verde; sumar pruebas de fusión de entries, conteo mensual en fin de mes y semana cerrada; accesibilidad (axe sin violaciones).
- [ ] Sitio en Netlify y variables de entorno.

## 10. Lista de aceptación (lo que tiene que salir del horno)

La versión de producción se acepta cuando **`node tests/humo.cjs` pasa los 41 controles** apuntando a la nueva app, y además:

- Mismo aspecto que el prototipo en celular (oscuro) y computadora (clara), en las 7 escenas.
- Un locutor marca en el celular y lo ve en la computadora (sincronización), y viceversa, sin perder marcas cuando las dos editan (gana la más reciente por clave).
- Sin conexión: abre la última semana descargada y guarda marcas que se suben al volver la conexión.
- Una semana cerrada no se puede cambiar sin la clave de coordinación, que ya no está en el código del navegador.
- El contenido no se puede descargar sin la clave.

## 11. Decisiones pendientes (no son del programador, pero lo afectan)

1. **Versículos:** 12 cambios sugeridos esperan la decisión de Richarh (documento «Versículos a corregir 2027», `content/versiculos_sugeridos.md`). Los aprobados se aplican con `tools/versiculos_aplicados_2027.py` y se reescriben esos guiones.
2. ~~Viernes Santo, Pascua y Navidad~~ **Resuelto el 20/10/2026:** se sigue la serie; cada locutor adapta la fecha en su preparación (sin cambios en la app ni en el contenido).
3. **Usuarios:** una clave para todo el equipo o una por locutor (necesaria si el registro debe decir quién hizo cada marca).
4. **Hoja «Mensajero»:** faltan 17 datos (historia, fundación, misión, visión, sitio web, redes, contactos por área, organigrama).
5. **Números útiles:** reconfirmar los seis antes de la salida y cada tanto.
6. ~~Tres frases célebres con fuente parcial~~ **Resuelto el 20/10/2026:** Cervantes confirmada (II parte, cap. XVII); Spurgeon pasa a «Proverbio recogido por Charles H. Spurgeon»; Temple se mantiene con su definición completa (autor confirmado; el libro exacto, no).

## 12. Archivos

| Archivo | Para qué |
|---|---|
| `public/index.html` | Prototipo completo (contenido incrustado) |
| `public/sw.js`, `public/manifest.webmanifest`, `public/images/` | PWA e imágenes |
| `content/planillas/Mensajero_TemasMacro_2027.xlsx` | Fuente de verdad del contenido |
| `content/criterios_teologicos.md` | Criterios de escritura y revisión |
| `content/revision_teologica_2027.md`, `verificacion_datos_2027.md`, `frases_2027.md` | Informes de revisión |
| `content/versiculos_sugeridos.md`, `Versiculos_a_corregir_2027.docx` | Versículos por decidir |
| `content/frases_deportivas_2027.txt`, `Frases_deportivas_2027.docx` | Frases deportivas (fuente y versión para revisar) |
| `content/estilo_guiones_2027.json` | Pasada de estilo |
| `tools/` | Scripts del flujo de contenido (§4) |
| `tests/humo.cjs` | Prueba de humo |
| `IDEA.md` | Por qué se tomó cada decisión de diseño y de contenido |

## 13. Depuración hecha antes de la entrega

- 44 líneas de CSS de pantallas anteriores que ya no se usaban (versículos en lista, subtemas en tarjetas, botones viejos) y tres variables sin uso.
- Se quitaron del repositorio las capturas de prueba y el encargo técnico anterior (lo reemplaza este documento).
- Escena de Producción y hoja de su tema: arreglado el problema de la tilde que mostraba la escena de Salud y 0 semanas.
- Tamaño del prototipo: 928 KB, de los cuales 730 KB son el contenido del año, 92 KB la lógica, 38 KB el diseño y 60 KB los dos logos incrustados. En producción el contenido y los logos salen del HTML.
