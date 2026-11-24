const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, PageOrientation, HeadingLevel, BorderStyle, Footer, PageNumber } = require('docx');

const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const AZUL = '1F3A5F', GRIS = 'EEF2F6';
const TAG = { diario: 'Solo diarios', semanal: 'Solo semanales', entrevista: 'Con entrevista', '2h': 'Programas de 2 h o más', '3h': 'Programas de 3 h' };
// análisis de cada tarea: [¿la app la trae?, observación]
const NOTA = {
  guion: ['Sí', 'La app trae el guion de cada día; la tarea es adaptarlo al estilo del locutor.'],
  tema: ['Sí', 'Está en la portada y en la tarjeta del domingo. Es rápida.'],
  reflexion: ['Sí', 'Se superpone con «Guion»: el guion del día ya dura unos 5 minutos. A los diarios también se les sugiere «Devocional».'],
  versiculo: ['Sí', 'Ya viene cotejado con la RVC.'],
  versSem: ['Sí', 'Ya viene en la tarjeta del domingo.'],
  devocional: ['Sí', 'Se superpone con «Reflexión del día»: a los programas diarios se les sugieren las dos y ocupan dos lugares de diez.'],
  dato: ['Sí', 'Viene con su fuente verificada; la tarea es leerlo antes.'],
  frase: ['Sí', 'La app trae la frase para el aire verificada. La sugerencia nunca la propone.'],
  historia: ['Sí', 'Viene en la tarjeta del domingo. La sugerencia nunca la propone.'],
  oracion: ['No', 'Tarea propia del locutor.'],
  paraguay: ['No', 'Útil, pero pide buscar una noticia actual. La sugerencia nunca la propone.'],
  preguntas: ['En parte', 'La sección «Hacelo a tu estilo» da ideas, no la pregunta armada.'],
  invitado: ['No', 'Solo para programas con entrevista; cada locutor la suma a mano.'],
  preguntasInv: ['No', 'Solo para programas con entrevista.'],
  llamada: ['No', 'Solo para programas con entrevista. La sugerencia nunca la propone.'],
  noticias: ['No', 'Tarea propia del programa.'],
  agenda: ['No', 'La sugerencia nunca la propone. ¿Hay una agenda de la radio de donde sacarla?'],
  tandas: ['No', '¿Las tandas las arma el locutor o la radio? Si es la radio, quitar.'],
  musica: ['No', '¿La música la elige el locutor o es la programación de la radio?'],
  cortinas: ['No', '¿Cada programa tiene sus cortinas? La sugerencia nunca la propone.'],
  clima: ['No', 'La sugerencia nunca la propone, aunque es diaria.'],
  secciones: ['No', 'Se define una vez, no cada semana. Quizás no va como tarea semanal.'],
  promo: ['No', '¿Se graba una promo cada semana? Si no, quitar.'],
  audios: ['No', '¿Existe una «carpeta de la semana» compartida? Confirmar con la radio.'],
  equipo: ['No', 'Básica para el aire.'],
  respaldo: ['No', 'La sugerencia nunca la propone.'],
  grabacion: ['No', '¿La radio graba todo automáticamente? Si es así, quitar.'],
  redes: ['Sí', 'La app arma el flyer del versículo. La sugerencia nunca la propone.'],
  registro: ['Sí', 'El registro mensual depende de esta marca, pero la sugerencia nunca la propone. Conviene que vaya siempre.'],
  podcast: ['No', '¿Mensajero publica podcasts? Si no, quitar.'],
};

const t = (text, o = {}) => new TextRun({ text, size: o.size || 19, bold: o.bold, italics: o.it, color: o.color });
const p = (text, o = {}) => new Paragraph({ spacing: { after: o.after ?? 100 }, keepNext: o.keepNext, children: Array.isArray(text) ? text : [t(text, o)] });
const cell = (runs, w, o = {}) => new TableCell({ width: { size: w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  margins: { top: 50, bottom: 50, left: 90, right: 90 },
  children: (Array.isArray(runs[0]) ? runs : [runs]).map(r => new Paragraph({ spacing: { after: 0 }, children: r })) });
const h = (text, salto) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, pageBreakBefore: !!salto, spacing: { before: 240, after: 80 }, children: [new TextRun({ text, bold: true, size: 26, color: AZUL })] });

const W = [400, 3600, 1500, 900, 4300, 1500, 2300]; const TOT = W.reduce((a, b) => a + b);
const head = () => new TableRow({ tableHeader: true, cantSplit: true, children: ['#', 'Tarea', 'Para quién', '¿La app la trae?', 'Observación', 'Decisión', 'Notas'].map((x, i) => cell([t(x, { bold: true, color: 'FFFFFF', size: 18 })], W[i], { fill: AZUL })) });

const kids = [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Biblioteca de preparación: revisión de la lista', bold: true, size: 38, color: AZUL })] }),
  new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL, space: 4 } }, children: [t('Mensajero 100.9 FM · Edificando una Cultura 2027 · 23 de noviembre de 2026', { size: 20, color: '555555' })] }),
  p('Cómo funciona: la biblioteca tiene 30 tareas en 4 grupos. Cada locutor elige hasta 10 para su lista semanal de «Preparación». El botón «Sugerir para mi programa» propone 10 según el programa: diario o semanal, duración y sin las tareas de entrevista, que se suman a mano.'),
  p('Para revisar: en cada tarea marcá Sirve, Cambiar o Quitar, y anotá el cambio si hace falta. Al final hay lugar para tareas nuevas. Con tus marcas actualizo la app.'),
  p('Lo que encontré', { bold: true, size: 22, keepNext: true }),
  ...[
    '«Marcar en la app lo que salió al aire» nunca se sugiere, y el registro mensual depende de esa marca. Propuesta: que vaya siempre en la lista.',
    'A los programas diarios se les sugieren «Reflexión del día» y «Devocional diario» a la vez. Se superponen entre sí y con el guion. Propuesta: unirlas en una sola.',
    'La sugerencia nunca propone 15 de las 30 tareas. Algunas son útiles, como la publicación en redes, la frase para el aire o el clima.',
    'Siete tareas dependen de cómo trabaja la radio: tandas, música, cortinas, promo, carpeta de audios, grabación y podcast. Hay que confirmarlas con la radio.',
  ].map(x => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [t(x, { size: 20 })] })),
];

let n = 0;
for (const [g, items] of D.grupos) {
  kids.push(h(g, g === 'Después del aire'));
  kids.push(new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: W, rows: [head(), ...items.map(([id, txt, tag], k) => {
    n++; const fill = k % 2 ? undefined : GRIS; const [app, obs] = NOTA[id] || ['', ''];
    const colApp = app === 'Sí' ? '15803D' : app === 'No' ? '555555' : '8A6500';
    return new TableRow({ cantSplit: true, children: [
      cell([t(String(n), { color: '777777' })], W[0], { fill }),
      cell([t(txt, { bold: true })], W[1], { fill }),
      cell([t(tag ? TAG[tag] : 'Todos', { size: 17 })], W[2], { fill }),
      cell([t(app, { bold: true, color: colApp, size: 17 })], W[3], { fill }),
      cell([t(obs, { size: 17 })], W[4], { fill }),
      cell([[t('☐ Sirve', { size: 17 })], [t('☐ Cambiar', { size: 17 })], [t('☐ Quitar', { size: 17 })]], W[5], { fill }),
      cell([t('')], W[6], { fill }),
    ] }); })] }));
}

kids.push(h('Lo que sugiere hoy la app, según el programa', true));
const perf = Object.entries(D.sug); const WS = Array(perf.length).fill(Math.floor(TOT / perf.length));
kids.push(new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: WS, rows: [
  new TableRow({ tableHeader: true, children: perf.map(([k], i) => cell([t(k, { bold: true, color: 'FFFFFF' })], WS[i], { fill: AZUL })) }),
  ...Array.from({ length: 10 }, (_, r) => new TableRow({ cantSplit: true, children: perf.map(([, v], i) => cell([t(`${r + 1}. ${v[r] || ''}`, { size: 17 })], WS[i], { fill: r % 2 ? undefined : GRIS })) })),
] }));
kids.push(p('Si cambia la lista, la sugerencia se reordena: podés indicar el orden de prioridad con números en la columna Notas.', { size: 18, color: '555555' }));

kids.push(h('Tareas nuevas para agregar'));
const WN = [4800, 3000, 6700];
kids.push(new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: WN, rows: [
  new TableRow({ tableHeader: true, children: ['Tarea', 'Para quién', 'Por qué'].map((x, i) => cell([t(x, { bold: true, color: 'FFFFFF' })], WN[i], { fill: AZUL })) }),
  ...Array.from({ length: 6 }, () => new TableRow({ height: { value: 520, rule: 'atLeast' }, children: WN.map(w => cell([t('')], w)) })),
] }));

const doc = new Document({ styles: { default: { document: { run: { font: 'Calibri' } } } }, sections: [{
  properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 700, bottom: 700, left: 900, right: 900 } } },
  footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t('Mensajero 100.9 FM · Biblioteca de preparación · página ', { size: 16, color: '777777' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '777777' })] })] }) },
  children: kids }] });
Packer.toBuffer(doc).then(b => fs.writeFileSync(OUT, b));
