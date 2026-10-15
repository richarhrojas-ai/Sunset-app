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
| Ficha / maestría | **Apoyamos al programa** (programa + locutor) y **Valor de Mensajero** con su guía interna |
| Cierre / progreso | **Preparación de la semana**: biblioteca de 30 tareas, cada locutor elige hasta 10 según su programa (diario o semanal, 1/2/3 h, con o sin entrevistas) |
| — | **Registro al aire** por mes: versículos y subtemas al aire, con lista y totales del año |
| Progreso del año (flores) | **Mapa de 52 semanas** por color, con barra de preparación |

Un «Al aire» y una nota por día. El registro cuenta días al aire (cada uno es un versículo compartido y su reflexión).

## Flujo de contenido

`content/planillas/Mensajero_TemasMacro_AAAA.xlsx` → `python3 tools/build_data.py` →
datos dentro de `public/index.html` (prototipo). En la versión final pasa a
`netlify/content/data.mjs` y se entrega por `/api/content` con clave, igual que Sunset.

Hojas que se leen: «Temas Macro AAAA», «Historia y Marcos», «Guia de Valores ADN» y «Guiones AAAA» (una fila por día. Lunes a viernes: título, dato y fuente, y para cada uno de los 3 puntos del versículo: desarrollo, problemática y solución. Sábado = resumen: título, dato, Desarrollo 1-3 = idea clave de cada subtema, Solucion 1 = acción para la semana).
Cada versículo se separa en cita y texto (`Cita — texto`), así se pueden corregir aparte.

## Claves del usuario (`AAAA/wN/...`, valor `{v,t}`)

- `aire0..aire6` día al aire (cuenta en el mes de su fecha)
- `vn0..vn6` nota de cada día
- `prep/<id>` tarea de preparación hecha (id de la biblioteca)
- `cfg/programa` mi programa {nombre, dias (0=dom…6=sáb), horas, entrevistas} · `cfg/prep` mis tareas elegidas · `cfg/prepManual` si las eligió a mano
- `notas` notas de producción

Hoy se guardan en el dispositivo; con `sync.mjs` de Sunset quedan compartidas.

## Pendiente

- Corrección de versículos: se marca en el Excel (no es tarea del locutor en la app).
- La planilla está sin tildes (Prevencion, Lider, Habitos…); conviene corregirla en el Excel, que es la fuente.
- PWA (manifest + sw), clave, sincronización y pruebas: copiar de Sunset.
- Definir si la app es para Richarh solo o para cada locutor (filtro «mis semanas»).
