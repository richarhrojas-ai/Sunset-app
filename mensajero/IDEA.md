# Mensajero · Edificando una Cultura (2027): la idea

En 2027 los «Temas Macro» pasan a llamarse **Edificando una Cultura**.

App de uso diario para el equipo de Mensajero 100.9 FM. Usa el mismo molde que Sunset
(PWA estática, color por semana, tarjetas de vidrio, esquema `{v,t}`), con contenido y
vocabulario de la radio.

## Cómo se traduce Sunset a Mensajero

| Sunset | Mensajero |
|---|---|
| Semana con color + título + hook | Semana con **color + Tema + Enfoque** y la ronda (1–8) |
| Árbol fijo por color | **Escena por tema** (paisaje SVG, sin íconos), pintada con la gama del color de la semana |
| Franja de 7 íconos / dimensiones | **Rotación de los 7 temas** en texto; al tocar uno se ve su enfoque en la misma ronda |
| Domingo: título, frase, historia | Domingo: **versículo de la semana + 3 puntos + historia ilustrativa** |
| Lunes–sábado: @ del día | Lunes–sábado: **versículo + 3 puntos**, con el subtema que le corresponde |
| Autoevaluación de 3 palabras | **3 subtemas**: desarrollo, nota para el locutor, frase célebre |
| Ficha / maestría | **Programa responsable + locutor** y **Valor ADN** con su guía interna |
| Cierre / progreso | **Preparación de la semana** (lista + notas de producción) y avance en el mapa del año |
| Progreso del año (flores) | **Mapa de 52 semanas** por color, con barra de preparación |

Reparto de subtemas: lunes–martes → subtema 1 · miércoles–jueves → 2 · viernes–sábado → 3.

## Flujo de contenido

`content/planillas/Mensajero_TemasMacro_AAAA.xlsx` → `python3 tools/build_data.py` →
datos dentro de `public/index.html` (prototipo). En la versión final pasa a
`netlify/content/data.mjs` y se entrega por `/api/content` con clave, igual que Sunset.

Hojas que se leen: «Temas Macro AAAA», «Historia y Marcos», «Guia de Valores ADN».
Cada versículo se separa en cita y texto (`Cita — texto`), así se pueden corregir aparte.

## Claves del usuario (`AAAA/wN/...`, valor `{v,t}`)

- `vr1..vr6` versículo del día revisado
- `aire1..aire6` día emitido
- `prep/0..7` lista de preparación
- `notas` notas de producción

Hoy se guardan en el dispositivo; con `sync.mjs` de Sunset quedan compartidas.

## Pendiente

- Corrección de versículos (RVC): el botón «Revisar versículo» de cada día marca cuáles ya se revisaron.
- La planilla está sin tildes (Prevencion, Lider, Habitos…); conviene corregirla en el Excel, que es la fuente.
- PWA (manifest + sw), clave, sincronización y pruebas: copiar de Sunset.
- Definir si la app es para Richarh solo o para cada locutor (filtro «mis semanas»).
