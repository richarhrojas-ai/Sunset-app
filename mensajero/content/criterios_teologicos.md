# Criterios teológicos y de razonamiento · Edificando una Cultura

Todo guion pasa por esta revisión **antes** de cargarse en la app. Vale igual para los que escribe una persona, los que genera Claude y los que vuelven del «Copiar prompt».

## Cómo se trabaja cada mes

1. **Versículos firmes.** Richarh corrige los versículos (RVC) y sus 3 puntos en la planilla.
2. **Borrador.** Se escriben los guiones del mes en la hoja «Guiones AAAA».
3. **Revisión teológica.** Se lee cada día con su versículo al lado, usando la lista de abajo. Cada corrección queda anotada con su motivo en un script `tools/revision_teologica_<mes>_<año>.py` (texto nuevo y por qué).
4. **Alarma automática.** `python3 tools/build_data.py` escribe en `content/revision_planilla.txt` la sección «PARA LA REVISIÓN TEOLÓGICA», con frases de riesgo (prosperidad, promesas absolutas, retribución, fe y salud mental, gracia condicionada, falsos dilemas). La alarma no reemplaza la lectura: los errores de contexto solo se ven leyendo.
5. **Versículos que no encajan.** Si un versículo no corresponde al subtema o tiene un error de copia, no se cambia en el momento: se anota en `content/versiculos_sugeridos.md`, con el motivo, y se aplican todos juntos cuando Richarh los aprueba.
6. **Datos verificados.** Cada dato curioso se confirma en su fuente antes de salir al aire.
7. **Aprobación.** Richarh revisa el informe del mes y, recién después, se publica.

## 1. Leer el versículo en su contexto

- **¿Quién habla, a quién y para qué?** Leé los versículos de antes y de después. Ejemplos ya corregidos:
  - 2 Corintios 9:6 habla de la ofrenda para hermanos necesitados, no del cuidado del suelo.
  - 3 Juan 1:2 es un saludo a Gayo, no una promesa.
  - Lucas 14:28 habla del costo de seguir a Jesús.
  - Mateo 5:37 habla de juramentos.
- **Promesas del pacto con Israel** (Éxodo 15:26, Deuteronomio 28): se explican como parte de ese pacto. No se aplican directo como garantía al oyente de hoy.
- **Género literario:**
  - Un **proverbio** es un principio general, no una promesa que se cumple siempre.
  - Una **narración** (José, David) describe lo que pasó; no siempre manda hacer lo mismo.
  - Una **parábola** tiene un punto central; no se alegoriza cada detalle.
- **El punto sale del texto.** Si la aplicación va más allá del versículo, se dice el puente en voz alta («Pablo habla de…; de ahí aprendemos también…»). Nunca se pone en boca del texto lo que no dice.
- **Palabras con sentido bíblico propio:**
  - «temor del Señor» es reverencia y confianza, no miedo;
  - «corazón» es el centro de la persona;
  - «prosperar» en Josué y en el Salmo 1 es dar fruto y cumplir la misión de Dios, no hacerse rico;
  - «cuerpo» en Romanos 12:1 es todo el ser.
- **Si hay más de una lectura seria** (por ejemplo Eclesiastés 11:2), se dice que hay más de una lectura. No se presenta una sola como segura.

## 2. Errores teológicos a evitar

- **Teología de la prosperidad:** fe, ofrenda u obediencia como camino seguro a la riqueza o la salud. Tampoco se dice «dar para recibir más».
- **Retribución automática:** insinuar que la enfermedad, la pobreza o la desgracia son castigo por algún pecado (Juan 9:3; el libro de Job).
- **Gracia condicionada o moralismo:** la conducta como forma de ganar el amor o la bendición de Dios. Las acciones prácticas responden a la gracia (Romanos 12:1; Filipenses 2:13). Al menos una vez por semana el guion recuerda que el cambio es obra de Dios en nosotros.
- **Fe y salud mental:** nunca se presenta la ansiedad, la depresión o la tristeza como falta de fe. Pedir ayuda profesional no es falta de fe. No se diagnostica al aire.
- **Fe y medicina:** no se opone la oración al tratamiento médico. Se ora y se cumple el tratamiento.
- **Poner algo al lado de Dios como fundamento:** la familia, el trabajo o el ahorro van **después** de Dios, no a la par.
- **Seguridad en el dinero:** ahorrar es prudencia. La seguridad de fondo está en Dios (Mateo 6; Lucas 12:15-21).
- **Temas que dividen a las iglesias** (bautismo, dones, escatología detallada, gobierno de la iglesia): no se toman posiciones. La audiencia es de distintas congregaciones.
- **El centro del mensaje:** cuando el texto es evangelio (Juan 3:16), su punto central (Cristo, la gracia, la vida eterna) no queda desplazado por la aplicación práctica.

## 3. Falacias de razonamiento a evitar

- **Generalización apresurada:** «todos los jóvenes…», «la casa desordenada muestra un corazón desordenado». Preferí «muchos», «a veces», «puede».
- **Falso dilema:** «o confiás en Dios o vas al médico», «o ahorrás o confiás». Casi siempre son las dos cosas.
- **Causa falsa / correlación no es causa:** un estudio que asocia dos cosas no prueba que una cause la otra. Decí «se asocia con».
- **Apelación a la autoridad:** una frase célebre o un famoso no prueban nada. Se usan para ilustrar, no para demostrar.
- **Pendiente resbaladiza:** «si hacés esto, terminás perdiéndolo todo». Solo si el texto o la evidencia lo sostienen.
- **Hombre de paja:** no se caricaturiza a quien piensa distinto (otras iglesias, no creyentes, profesionales).
- **Culpa y vergüenza:** el problema se describe con compasión. No se señala a grupos (pobres, enfermos, madres solas, personas con depresión).

## 4. Datos curiosos

- Fuente real y nombrable: organismo, autor, revista, año. Nada de «estudios dicen».
- Se confirma la cifra en la fuente antes de salir al aire. Si no se puede confirmar, se cambia el dato.
- Se dice lo que el estudio midió, sin exagerar (ver «correlación no es causa»).
- Nada de ejemplos de alcohol, tabaco ni apuestas (audiencia cristiana).

## 5. Lista rápida por día (antes de aprobar)

- [ ] Leí el versículo con su contexto. El punto sale del texto o el puente está dicho.
- [ ] No promete lo que el texto no promete (salud, riqueza, éxito).
- [ ] No insinúa castigo ni culpa por la enfermedad, la pobreza o la tristeza.
- [ ] La acción práctica responde a la gracia; no la gana.
- [ ] Sin generalizaciones, falsos dilemas ni causas falsas.
- [ ] El dato tiene fuente confirmada y dice lo que el estudio midió.
- [ ] Lenguaje para una audiencia cristiana de distintas iglesias; menos de 5 minutos al aire.
