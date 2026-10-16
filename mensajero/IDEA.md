# Mensajero · Edificando una Cultura (2027): la idea

En 2027 los «Temas Macro» pasan a llamarse **Edificando una Cultura**.

App de uso diario para el equipo de Mensajero 100.9 FM. Usa el mismo molde que Sunset
(PWA estática, color por semana, tarjetas de vidrio, esquema `{v,t}`), con contenido y
vocabulario de la radio.

## Cómo se traduce Sunset a Mensajero

| Sunset | Mensajero |
|---|---|
| Semana con color + título + hook | Semana con **color + Tema + Enfoque** y su número de semana |
| Árbol fijo por color | **Escena por tema** (paisaje SVG, sin íconos), pintada con la gama del color de la semana |
| Franja de 7 íconos / dimensiones | **7 íconos de temas** en el cielo de la portada; al tocar uno se abren todas sus semanas del año, con la activa resaltada y la próxima marcada |
| Domingo + lunes–sábado | **Mi semana**: domingo introducción · lun–mar subtema 1 · mié–jue subtema 2 · viernes subtema 3 completo (cierra) · sábado **resumen**. De lunes a viernes, el versículo del día es la base del guion (sus 3 puntos, con problemática y solución). Cada día dice a qué subtema pertenece; el primer día del subtema trae «Para el locutor» (desarrollo, nota, frase) |
| — | **Según los días al aire** de cada programa: lunes a viernes ve sus 5 días (los 3 subtemas completos); lunes a sábado suma el resumen; un programa de un solo día ve la introducción y el resumen juntos en un guion de 5 minutos |
| Ficha / maestría | **Ficha de la semana** justo después de la portada: Apoyamos al programa y Valor de Mensajero |
| — | **Mis días al aire** a la vista (Dom..Sáb, atajos lun-vie y lun-sáb). «Mi semana» queda oculta hasta marcar días y aparece según lo marcado. Programa y duración se eligen en «Mi preparación» |
| Cierre / progreso | **Preparación de la semana**: biblioteca de 30 tareas, cada locutor elige hasta 10 según su programa (diario o semanal, 1/2/3 h, con o sin entrevistas) |
| — | **Varios programas** (hasta 3 por locutor): pestañas con el nombre de cada programa en «Mis días al aire»; cada uno tiene sus días, duración, al aire, entrevistas, notas, lista de preparación y registro. Las tareas de **Contenido** se marcan una vez y valen para todos; las de producción, técnica y después del aire van por programa. Si otro programa sale el mismo día, la tarjeta lo avisa. El programa 2 se ve en turquesa y el 3 en rosa (fondo, tarjeta y pestaña). En un día que ya salió en un programa anterior, el siguiente ve una **versión enfocada**: el versículo y un solo punto como eje (programa 2 → punto 2, programa 3 → punto 3), con «Copiar versión de este programa»; el guion completo queda plegado. En su preparación, las tareas de Contenido compartidas también quedan plegadas |
| — | **Reemplazo**: botón por día (lila) con el programa que se cubrió; cuenta aparte en el registro y en los informes |
| — | **Registro al aire**: días al aire y entrevistas por semana, mes y año, más la lista del mes e informe copiable |
| — | **Informe de preparación**: promedio del mes con nivel (excelente ≥90 %, buena ≥70, regular ≥40, baja), semanas al 100 %, racha de semanas con 80 %+, semana a semana con lo que faltó, cumplimiento por tarea (las más omitidas arriba) y barras por mes del año. Se copia para enviarlo a coordinación |
| Progreso del año (flores) | **Mapa de 52 semanas** por color, con barra de preparación |
| — | **Sobre Mensajero** (al final): identidad, historia, misión, visión, valores, contacto para la audiencia y por áreas, organigrama, programas y locutores, y frases para el aire con botón «Copiar». Sale de la hoja «Mensajero» de la planilla |

Un «Al aire», un «Con entrevista» y una nota por día. El registro cuenta días al aire (cada uno es un versículo compartido y su reflexión).

## Flujo de contenido

`content/planillas/Mensajero_TemasMacro_AAAA.xlsx` → `python3 tools/build_data.py` →
datos dentro de `public/index.html` (prototipo). En la versión final pasa a
`netlify/content/data.mjs` y se entrega por `/api/content` con clave, igual que Sunset.

Hojas que se leen: «Temas Macro AAAA», «Historia y Marcos», «Guia de Valores ADN», «Mensajero» (Seccion, Titulo, Texto, Para el aire) y «Guiones AAAA» (una fila por día. Lunes a viernes: título, dato y fuente, y para cada uno de los 3 puntos del versículo: desarrollo, problemática y solución. Sábado = resumen: título, dato, Desarrollo 1-3 = idea clave de cada subtema, Solucion 1 = acción para la semana).
Cada versículo se separa en cita y texto (`Cita — texto`), así se pueden corregir aparte.

## Claves del usuario (`AAAA/wN/...`, valor `{v,t}`)

- `aire0..aire6` día al aire (cuenta en el mes de su fecha)
- `ent0..ent6` hubo entrevista ese día
- `vn0..vn6` nota de cada día
- `prep/<id>` tarea de preparación hecha (id de la biblioteca)
- `prepLista` lista de tareas que regía esa semana (así cambiar la lista no altera el % de semanas pasadas)
- `cfg/programa` mi programa {nombre, dias (0=dom…6=sáb), horas} · `cfg/prep` mis tareas elegidas · `cfg/prepManual` si las eligió a mano
- `notas` notas de producción
- `reemN` reemplazo de ese día (valor = programa reemplazado; sin prefijo de programa)
- Programas 2 y 3: las mismas claves con prefijo `p2/` o `p3/` (`AAAA/wN/p2/aire1`, `cfg/p2/programa`). Las tareas de Contenido (`prep/<id>`) quedan sin prefijo: son compartidas
- `cfg/programas` lista de programas (`['p1','p2']`) · `cfg/activo` el que se está viendo

Hoy se guardan en el dispositivo; con `sync.mjs` de Sunset quedan compartidas.

## Pendiente

- Corrección de versículos: se marca en el Excel (no es tarea del locutor en la app).
- La planilla está sin tildes (Prevencion, Lider, Habitos…); conviene corregirla en el Excel, que es la fuente.
- Clave, sincronización y pruebas: copiar de Sunset. Con sincronización, el informe de preparación de cada locutor alimenta un panel de coordinación (todos los locutores, mes a mes).
- Definir si la app es para Richarh solo o para cada locutor (filtro «mis semanas»).
