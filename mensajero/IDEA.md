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
| Domingo: título, frase, historia | **Historia ilustrativa** de la semana |
| Lunes–sábado: @ del día | **7 versículos** con sus 3 puntos, sin día fijo |
| Autoevaluación de 3 palabras | **3 subtemas**: desarrollo, nota para el locutor, frase célebre |
| Ficha / maestría | **Apoyamos al programa** (programa + locutor) y **Valor de Mensajero** con su guía interna |
| Cierre / progreso | **Preparación de la semana** (lista + notas de producción) y avance en el mapa del año |
| Progreso del año (flores) | **Mapa de 52 semanas** por color, con barra de preparación |

Sin días fijos: cada locutor tiene su programa (de lunes a viernes o un solo día; los domingos casi no hay programas en vivo),
así que los subtemas y los 7 versículos sirven para cualquier día y cada uno usa el que le corresponde.

## Flujo de contenido

`content/planillas/Mensajero_TemasMacro_AAAA.xlsx` → `python3 tools/build_data.py` →
datos dentro de `public/index.html` (prototipo). En la versión final pasa a
`netlify/content/data.mjs` y se entrega por `/api/content` con clave, igual que Sunset.

Hojas que se leen: «Temas Macro AAAA», «Historia y Marcos», «Guia de Valores ADN».
Cada versículo se separa en cita y texto (`Cita — texto`), así se pueden corregir aparte.

## Claves del usuario (`AAAA/wN/...`, valor `{v,t}`)

- `vr0..vr6` versículo revisado
- `aire0..aire6` versículo usado al aire
- `prep/0..7` lista de preparación
- `notas` notas de producción

Hoy se guardan en el dispositivo; con `sync.mjs` de Sunset quedan compartidas.

## Pendiente

- Corrección de versículos (RVC): el botón «Revisar versículo» de cada día marca cuáles ya se revisaron.
- La planilla está sin tildes (Prevencion, Lider, Habitos…); conviene corregirla en el Excel, que es la fuente.
- PWA (manifest + sw), clave, sincronización y pruebas: copiar de Sunset.
- Definir si la app es para Richarh solo o para cada locutor (filtro «mis semanas»).
