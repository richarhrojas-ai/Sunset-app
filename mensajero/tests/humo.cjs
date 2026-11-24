// Prueba de humo de la app: recorre cada función con el contenido real de 2027 y falla si algo no responde como se planeó.
// Uso: node tests/humo.cjs  (opcional: CHROMIUM=/ruta/al/navegador)
// Cada «ok» o «FALLA» es una regla del documento de entrega (ENTREGA_PROGRAMADOR.md, sección «Lista de aceptación»).
const path = require('path');
const { chromium } = require('playwright');
const URL = 'file://' + path.resolve(__dirname, '../public/index.html');
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok   ' : 'FALLA'} ${msg}`); if (!cond) fallas++; };

async function abrir(b, {w = 390, h = 844, fecha = '2027-03-03T10:00:00'} = {}) {
  const p = await b.newPage({viewport: {width: w, height: h}});
  p.errores = []; p.on('pageerror', e => p.errores.push(e.message));
  await p.clock.install({time: new Date(fecha)});
  await p.goto(URL); await p.waitForTimeout(300);
  return p;
}
// completa «Mi programa» (nombre del locutor, del programa, horario y días) y toca «Listo»
async function configurar(p, {dias = '1,2,3,4,5,6', nombre = 'Programa de prueba', desde = '09:00', hasta = '10:00'} = {}) {
  if (await p.$('[data-dias-editar]')) await p.click('[data-dias-editar]');
  await p.fill('#pg-firma', 'Juan Pérez'); await p.fill('#pg-nombre', nombre); await p.fill('#pg-desde', desde); await p.fill('#pg-hasta', hasta);
  await p.$eval('#pg-hasta', e => e.dispatchEvent(new Event('change', {bubbles: true})));
  await p.click(`[data-preset="${dias}"]`); await p.waitForTimeout(80); await p.click('[data-dias-listo]'); await p.waitForTimeout(200);
}
const texto = p => p.evaluate(() => document.getElementById('copia-txt').value);
const cerrarCopia = p => p.evaluate(() => document.getElementById('copia').close());

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});

  // ── celular ──
  let p = await abrir(b);
  ok(await p.evaluate(() => DATA.semanas.length === 53 && DATA.semanas[0].color === 'Azul' && DATA.semanas[1].n === 2 && DATA.semanas[1].color === 'Lila'), '53 semanas como el calendario: la 1 azul (1 y 2 de enero), la 2 lila');
  ok(await p.evaluate(() => DATA.semanas.every(w => w.dias.every((d, i) => i < (w.desde || 1) || d.guion) && w.dias.every((d, i) => i < (w.desde || 0) || d.deporte))), 'guion de lunes a sábado y frase deportiva en los 366 días');
  ok(await p.evaluate(() => document.documentElement.dataset.tema) === 'oscuro', 'apariencia automática: oscura en el celular');
  ok((await p.textContent('#h-tema')).includes('Producción'), 'portada del 3 de marzo: semana de Producción y Desarrollo');
  ok(await p.evaluate(() => [...document.querySelectorAll('#scene svg [transform="translate(268 180)"]')].length === 1), 'escena de Producción con su molino (no la de Salud)');
  for (const t of ['Vida Cristiana', 'Liderazgo', 'Familia', 'Finanzas', 'Crecimiento Personal', 'Produccion y Desarrollo', 'Salud']) {
    await p.click(`#temas [data-t="${t}"]`); await p.waitForTimeout(80);
    const n = await p.$$eval('#hoja li', x => x.length);
    ok(n >= 7, `hoja del tema ${t}: ${n} semanas`);
    await p.evaluate(() => document.getElementById('hoja').close());
  }
  ok(await p.$$eval('#temas .prox-f', x => x.length === 7 && x.every(e => /\d/.test(e.textContent))) && (await p.textContent('#temas [data-t="Vida Cristiana"] .prox-f')) === '14–20 mar', 'bajo cada ícono, las fechas de la próxima semana del tema');
  await p.click('#cal-btn'); await p.waitForTimeout(150);
  ok((await p.textContent('#cal-t')).includes('Marzo') && await p.$$eval('#cal .cal-lista li', x => x.length) === 5 && await p.$$eval('#cal .cal-dias .hoy', x => x.length) === 1, 'calendario de marzo: 5 semanas con color y tema, hoy marcado');
  await p.click('#cal [data-cm="1"]'); await p.waitForTimeout(100);
  ok((await p.textContent('#cal-t')).includes('Abril'), 'calendario: pasar al mes siguiente');
  await p.click('#cal .cal-lista li:nth-child(2) button'); await p.waitForTimeout(150);
  ok(!(await p.evaluate(() => document.getElementById('cal').open)) && (await p.textContent('#h-meta')).includes('Semana 15'), 'calendario: tocar una semana lleva a ella');
  await p.click('#hoy'); await p.waitForTimeout(100);
  await p.click('#cal-btn'); await p.waitForTimeout(100);
  ok(await p.$$eval('#cal #anio button', x => x.length) === 53, 'el año completo está dentro del calendario');
  await p.evaluate(() => document.getElementById('cal').close());
  ok(await p.evaluate(() => document.getElementById('h-glass').classList.contains('actual')) && await p.$$eval('#h-meta .fechas-act', x => x.length) === 1 && await p.$$eval('#temas .es-actual', x => x.length === 1 && x[0].dataset.t === 'Produccion y Desarrollo'), 'semana activa: cuadro e ícono en dorado y fechas resaltadas');
  await p.click('#next'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => document.getElementById('h-glass').classList.contains('otra')) && await p.$$eval('#h-meta .fechas-act', x => x.length) === 0 && await p.evaluate(() => document.getElementById('hoy').classList.contains('llamar')), 'otra semana: borde simple, fechas sin resaltar y botón «Esta semana» marcado');
  await p.click('#hoy'); await p.waitForTimeout(80);
  const sem0 = await p.textContent('#h-tema');
  await p.click('#next'); await p.click('#hoy'); await p.waitForTimeout(80);
  ok(await p.textContent('#h-tema') === sem0, 'flechas y «Esta semana» vuelven a la semana actual');

  // días al aire y tarjeta del día
  await p.click('[data-preset="1,2,3,4,5,6"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.getElementById('semana').hidden) && (await p.textContent('#pg-falta')).includes('tu nombre'), 'sin nombre, programa y horario la semana no se muestra');
  await configurar(p);
  ok(await p.$$eval('#dias [role=tab]', x => x.length) === 6, 'lunes a sábado: seis pestañas de día');
  ok(await p.$$eval('#dias details.punto', x => x.length) === 3, 'miércoles: tres puntos plegables');
  ok(await p.$$eval('#dias details.punto[open]', x => x.length) === 1, 'sin franja: un solo punto abierto');
  ok(await p.$$eval('#dias .deporte', x => x.length) === 1, 'frase deportiva en la tarjeta');
  ok(await p.$$eval('#dias .frase-aire cite', x => x.length) === 1 && await p.$$eval('#dias details.loc .frase', x => x.length) === 0, 'frase célebre visible para el aire (ya no escondida en «Para el locutor»)');
  ok(await p.evaluate(() => { const a = [...document.querySelectorAll('#dias article > *')].map(e => e.className); return a.indexOf('frases') > a.findIndex(c => c.includes('punto')); }), 'frase deportiva después de los puntos');
  await p.click('#dias [data-k="aire3"]'); await p.waitForTimeout(80);
  ok(await p.getAttribute('#dias [data-k="aire3"]', 'aria-pressed') === 'true', 'marcar «Al aire»');

  ok(await p.getAttribute('#dias .accesos a', 'href') === 'https://mensajerofm.org/grilla/publica.php', 'acceso rápido a la grilla de programación');
  await p.click('#dias details.mi-nota summary'); await p.setInputFiles('#dias input[data-adj-in]', {name: 'guion-invitado.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba')}); await p.waitForTimeout(400);
  ok((await p.textContent('#dias ul[data-adj]')).includes('guion-invitado.pdf') && await p.evaluate(() => Object.entries(JSON.parse(localStorage.getItem('mensajero:entries'))).some(([k, v]) => k.endsWith('/adj') && v.v.includes('guion-invitado.pdf'))), 'nota del día: adjuntar un documento (queda en la nota)');
  ok(await p.$$eval('#dias .accesos button', x => x.length) === 6, 'tarjeta del día: accesos rápidos (historia bíblica, preparación, informes, calendario, útiles, buscar)');
  await p.click('#dias .accesos [data-ira="s-reg"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.getElementById('s-reg').open), 'acceso rápido abre «Mis informes del mes»');
  await p.evaluate(() => { document.getElementById('s-reg').open = false; document.getElementById('s-dias').scrollIntoView(); });
  ok(await p.$$eval('.bar a', x => x.length) === 5, 'barra de atajos con 5 destinos');

  // mensajes de oyentes
  for (let k = 0; k < 3; k++) await p.click('#dias [data-msg-mas="wa"]');
  await p.click('#dias [data-msg-restar]'); await p.click('#dias [data-msg-mas="wa"]');
  ok(await p.textContent('#dias [data-msg-total]') === '2', 'mensajes: sumar 3 y «Restar» 1 da 2');
  ok(await p.getAttribute('#dias [data-msg-restar]', 'aria-pressed') === 'false', '«Restar» se apaga solo después de un toque');
  await p.click('#dias [data-modo="grabado"]'); await p.waitForTimeout(80);
  ok(await p.$$eval('#dias .msgs-dia', x => x.length) === 0 && await p.$$eval('#dias .msgs-grab', x => x.length) === 1, 'día grabado: sin cuadro de mensajes y con aviso para volver a «En vivo»');
  await p.click('#dias [data-modo="vivo"]'); await p.waitForTimeout(80);
  await p.click('#dias [data-d="4"]'); await p.waitForTimeout(80);
  ok(await p.getAttribute('#dias [data-k="aire4"]', 'aria-pressed') === 'false', 'jueves sin marcar');
  await p.click('#dias [data-msg-mas="fb"]'); await p.waitForTimeout(80);
  ok(await p.getAttribute('#dias [data-k="aire4"]', 'aria-pressed') === 'true' && (await p.textContent('#dias [data-d="4"] small')).includes('✓'), 'contar un mensaje marca «Al aire» solo');
  await p.click('#dias [data-msg-restar]'); await p.click('#dias [data-msg-mas="fb"]'); await p.click('#dias [data-k="aire4"]');
  await p.click('#dias [data-d="3"]'); await p.waitForTimeout(80);

  // franja horaria → un punto por programa
  await p.evaluate(() => document.getElementById('s-prep').open = true);
  await configurar(p, {nombre: 'Mi programa nuevo', desde: '20:00', hasta: '22:00'});
  ok(await p.$eval('#dias details.punto[open] summary span', e => e.textContent) === '3', 'horario de 20:00 a 22:00: franja noche, se abre el punto 3');
  ok((await p.textContent('#s-prog')).includes('de 20:00 a 22:00') && (await p.textContent('#s-prog')).includes('Mi programa nuevo') && (await p.textContent('#s-prog')).includes('Juan Pérez'), 'nombre libre del programa, locutor y horario a la vista');
  ok(await p.getAttribute('#dias a.yv', 'href') === 'https://www.bible.com/es/bible/146/PRO.12.10.RVC', 'versículo con enlace a YouVersion (RVC)');
  ok(/^\d{2}:\d{2}$/.test(await p.textContent('#reloj')), 'reloj en la portada');
  await p.evaluate(() => document.getElementById('s-marco').open = true);
  ok(await p.$$eval('#marco a.cita', x => x.length) >= 1 && (await p.getAttribute('#marco .marco-cab a.yv', 'href')).startsWith('https://www.bible.com/es/bible/146/'), 'historia bíblica: citas con enlace y botón «Ir a la Biblia»');
  await p.click('#dias [data-copiar="dia"]'); await p.waitForTimeout(80);
  let t = await texto(p);
  ok(/3\. .*← TU PUNTO DE HOY/.test(t), 'guion copiado marca «TU PUNTO DE HOY»');
  ok(t.indexOf('FRASE DEPORTIVA') > t.indexOf('PARA CERRAR'), 'guion copiado: frase deportiva al final');
  ok(/FRASE PARA EL AIRE: «.+» — .+/.test(t), 'guion copiado: frase para el aire con su autor');
  ok(t.includes('PARA HACERLO A TU ESTILO'), 'guion copiado: ideas para hacerlo a tu estilo');
  await cerrarCopia(p);

  // domingo y sábado
  await p.click('[data-vertodo]'); await p.click('#dias [data-d="0"]'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => { const a = [...document.querySelectorAll('#dias article > *')].map(e => e.className); return document.querySelectorAll('#dias .frase-aire').length === 0 && a.indexOf('frases') === a.indexOf('hist') + 1; }), 'domingo: frase deportiva después de la historia ilustrativa (sin frase célebre)');
  const fraseDe = async d => { await p.click(`#dias [data-d="${d}"]`); await p.waitForTimeout(60); return p.$eval('#dias .frase-aire p', e => e.textContent); };
  const fr = [await fraseDe(1), await fraseDe(2), await fraseDe(3), await fraseDe(4), await fraseDe(5)];
  ok(new Set(fr).size === 5, 'lunes a viernes: cinco frases para el aire distintas');
  await p.click('#dias [data-d="6"]'); await p.waitForTimeout(80);
  ok(await p.$$eval('#dias ol.ideas li', x => x.length) === 3, 'sábado: resumen con las tres ideas');
  const semN = +(await p.$eval('#h-meta b', e => e.textContent));
  const dias = async quitar => { if (await p.$('[data-dias-editar]')) await p.click('[data-dias-editar]'); await p.waitForTimeout(80);
    for (const d of quitar) { await p.click(`#s-prog [data-dia="${d}"]`); await p.waitForTimeout(60); }
    if (await p.$('[data-dias-listo]')) await p.click('[data-dias-listo]'); await p.waitForTimeout(120); };
  await dias([1, 2, 3, 4, 5]);
  if ((await p.textContent('[data-vertodo]')).includes('solo')) { await p.click('[data-vertodo]'); await p.waitForTimeout(100); }
  ok(await p.textContent('#dias .vers-base .ref') === await p.evaluate(n => DATA.semanas.find(w => w.n === n)?.dias[6].ref, semN), 'programa semanal de los sábados: usa el versículo de su día');
  await p.click('[data-preset="1,2,3,4,5,6"]').catch(async () => { await dias([1, 2, 3, 4, 5]); }); await p.waitForTimeout(150);
  await p.click('[data-vertodo]').catch(() => {}); await p.click('#dias [data-d="6"]'); await p.waitForTimeout(80);

  // flyer
  await p.click('#dias [data-flyer]'); await p.waitForTimeout(1500);
  ok((await p.getAttribute('#flyer-img', 'src') || '').startsWith('data:image/png'), 'flyer del versículo generado');
  const src0 = await p.getAttribute('#flyer-img', 'src'); await p.click('#flyer [data-fmodo="dia"]'); await p.waitForTimeout(1500);
  ok(await p.getAttribute('#flyer [data-fmodo="dia"]', 'aria-pressed') === 'true' && await p.getAttribute('#flyer-img', 'src') !== src0 && (await p.getAttribute('#flyer-bajar', 'download')).endsWith('-dia.png'), 'flyer en modo día');
  await p.click('#flyer [data-fmodo="noche"]'); await p.waitForTimeout(800);
  const src1 = await p.getAttribute('#flyer-img', 'src'); await p.fill('#flyer-firma', 'Ana Gómez'); await p.waitForTimeout(1500);
  ok(await p.getAttribute('#flyer-img', 'src') !== src1 && await p.evaluate(() => JSON.parse(localStorage.getItem('mensajero:entries'))['cfg/firma'].v) === 'Ana Gómez', 'flyer con la firma del locutor, guardada en el dispositivo');
  await p.evaluate(() => document.getElementById('flyer').close());

  // registro, informe, preparación
  ok(await p.$$eval('#dias [data-copiar="prompt"]', x => x.length) === 0 && await p.$$eval('#s-marco #copiar-ia', x => x.length) === 1, '«Copiar para IA» está en «La serie 2027», no en la tarjeta del día');
  ok(await p.$$eval('#notas, #s-inf, #mes-p', x => x.length) === 0 && await p.$$eval('#s-reg #inf, #s-reg #copiar-prep', x => x.length) === 2, 'una sola nota (la del día) y un solo lugar para los informes del mes');
  await p.evaluate(() => document.getElementById('s-reg').open = true); await p.selectOption('#mes', '2'); await p.waitForTimeout(80);
  ok((await p.textContent('#reg-v')).includes('3 mar'), 'registro de marzo: aparece el miércoles 3 al aire');
  ok((await p.textContent('#reg-msgs')).includes('2'), 'registro: mensajes del mes por canal');
  const pct0 = await p.textContent('#prep-pct');
  await p.click('#prep [data-p]'); await p.waitForTimeout(80);
  ok(await p.textContent('#prep-pct') !== pct0, 'preparación: marcar una tarea cambia el porcentaje');
  await p.click('#abrir-biblio'); await p.waitForTimeout(100);
  const nBib = await p.$$eval('#biblio input[data-b]', x => x.length);
  await p.click('#bib-sug'); await p.waitForTimeout(80);
  const sug = await p.$$eval('#biblio input[data-b]:checked', x => x.map(i => i.dataset.b));
  ok(sug.length === 6, 'la sugerencia trae 6 tareas básicas (cada uno puede sumar hasta 10)');
  ok(nBib === 18 && sug.includes('oyentes') && sug.includes('registro') && sug.includes('guion'), 'biblioteca revisada: 18 tareas agrupadas, saludo a la audiencia, «marcar al aire» y «mensajes» siempre sugeridas');
  await p.click('#bib-x'); await p.waitForTimeout(80);

  // buscar y números útiles
  await p.evaluate(() => document.getElementById('s-buscar').open = true); await p.fill('#q', 'lapacho'); await p.waitForTimeout(150);
  await p.fill('#q', 'perdón'); await p.waitForTimeout(150);
  ok(await p.$$eval('#res li button', x => x.length) > 0, 'buscador encuentra «perdón»');
  ok(await p.$$eval('#utiles ul.utiles a[href^="tel:"]', x => x.length) === 6 && await p.$$eval('#utiles ul.zona li', x => x.length) === 8 && await p.$eval('#utiles ul.zona a', e => e.getAttribute('href')) === 'tel:+595971942711', 'números útiles: seis emergencias y ocho contactos de salud de la zona');

  // tamaño de letra
  const tam = () => p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#dias .punto p') || document.querySelector('#dias .vtxt')).fontSize));
  const t0 = await tam();
  await p.click('#letra'); await p.click('#letra'); await p.waitForTimeout(100);
  ok(await tam() >= t0 * 1.25, 'letra «Muy grande» agranda de verdad el texto del guion (sin depender de zoom)');
  ok(await p.evaluate(() => document.documentElement.dataset.letra) === '2' && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'letra «Muy grande» sin desborde horizontal');
  await p.click('#letra'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => document.documentElement.dataset.letra) === '0', 'letra vuelve a «Normal»');

  // apariencia
  await p.click('#apariencia'); await p.click('#apariencia'); await p.reload(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.dataset.tema) === 'claro', 'apariencia clara elegida a mano se mantiene al recargar');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'celular: sin desborde horizontal');
  ok(p.errores.length === 0, 'celular: sin errores de JavaScript' + (p.errores.length ? ' → ' + p.errores.join(' | ') : ''));
  await p.close();

  // ── computadora ──
  p = await abrir(b, {w: 1280, h: 900});
  ok(await p.evaluate(() => document.documentElement.dataset.tema) === 'claro', 'apariencia automática: clara en la computadora');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'computadora: sin desborde horizontal');
  ok(p.errores.length === 0, 'computadora: sin errores de JavaScript');
  await p.close();

  // ── fechas especiales ──
  p = await abrir(b, {fecha: '2027-03-26T10:00:00'});
  await configurar(p);
  ok((await p.textContent('#dias .especial b') || '').includes('Viernes Santo') && (await p.textContent('#dias .vers-base .ref')).includes('1 Pedro 2:24'), 'Viernes Santo: aviso de especial y versículo propio');
  await p.click('[data-vertodo]'); await p.click('#dias [data-d="0"]'); await p.waitForTimeout(80);
  ok(await p.$$eval('#dias .especial', x => x.length) === 0, 'el domingo anterior no es especial');
  await p.close();
  p = await abrir(b, {fecha: '2027-12-25T10:00:00'});
  await configurar(p);
  ok((await p.textContent('#dias .especial b') || '').includes('Navidad') && (await p.textContent('#dias .vers-base .ref')).includes('Lucas 2:10-11'), 'Navidad: aviso de especial y Lucas 2:10-11');
  await p.close();

  // ── semana 1: solo viernes 1 y sábado 2 de enero ──
  p = await abrir(b, {fecha: '2027-01-01T10:00:00'});
  await configurar(p);
  ok((await p.textContent('#h-meta')).includes('Semana 1') && (await p.textContent('#h-meta')).includes('Azul'), '1 de enero: semana 1, azul');
  ok(await p.$$eval('#dias [role=tab]', x => x.length) === 2 && (await p.textContent('#dias .especial b')).includes('Año Nuevo'), 'semana 1: solo viernes y sábado, con el aviso de Año Nuevo');
  await p.click('#dias [data-d="6"]'); await p.waitForTimeout(80);
  ok(await p.$$eval('#dias ol.ideas li', x => x.length) === 3, 'semana 1: el sábado tiene su resumen');
  await p.click('#next'); await p.waitForTimeout(80);
  ok((await p.textContent('#h-meta')).includes('Semana 2') && (await p.textContent('#h-meta')).includes('Lila'), 'la semana del 3 de enero es la 2, lila');
  ok(p.errores.length === 0, 'semana 1 sin errores de JavaScript' + (p.errores.length ? ' → ' + p.errores.join(' | ') : ''));
  await p.close();

  // ── clima junto a la hora (servicio simulado; sin conexión no se muestra) ──
  p = await b.newPage({viewport: {width: 390, height: 844}});
  await p.route('https://api.open-meteo.com/**', r => r.fulfill({contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify({current: {temperature_2m: 27.6, weather_code: 2, is_day: 1}})}));
  await p.goto(URL); await p.waitForTimeout(500);
  ok(await p.isVisible('#clima') && (await p.textContent('#clima')).includes('28°') && (await p.getAttribute('#clima', 'title')).includes('Parcialmente nublado'), 'clima junto a la hora');
  await p.close();
  p = await b.newPage({viewport: {width: 390, height: 844}});
  await p.route('https://api.open-meteo.com/**', r => r.abort());
  await p.goto(URL); await p.waitForTimeout(500);
  ok(!(await p.isVisible('#clima')), 'sin conexión, el clima no se muestra');
  await p.close();

  // ── datos para coordinación y panel del director ──
  p = await b.newPage({viewport: {width: 390, height: 844}, acceptDownloads: true});
  await p.addInitScript(() => { if (!sessionStorage.z) { sessionStorage.z = 1; localStorage.setItem('mensajero:entries', JSON.stringify({'cfg/firma': {v: 'Juan Pérez', t: 1}, 'cfg/programa': {v: {nombre: 'Prueba', desde: '07:00', hasta: '08:00', modo: 'vivo', dias: [1,2,3,4,5]}, t: 1}, '2027/w2/aire1': {v: true, t: 1}, '2027/w2/msg1': {v: {wa: 3}, t: 1}, '2027/w2/reem3': {v: 'Noche de Paz', t: 1}})); } });
  await p.clock.install({time: new Date('2027-01-12T10:00:00')}); await p.goto(URL); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.getElementById('bajar-datos').click())]);
  const csv = require('fs').readFileSync(await dl.path(), 'utf8');
  ok(dl.suggestedFilename() === 'mensajero-2027-juan-perez.csv' && csv.includes('locutor,programa,horario') && csv.includes('Juan Pérez,Prueba,de 07:00 a 08:00,vivo,2027-01-04,Lunes,2') && csv.split('\n').length === 10 && csv.includes('Juan Pérez,Noche de Paz,,,2027-01-06,Miércoles,2') && csv.includes(',1,,0,sí,'), 'descargar mis datos: una fila por día del programa y una por cada reemplazo');
  await p.close();
  p = await b.newPage({viewport: {width: 1280, height: 900}}); p.errores = []; p.on('pageerror', e => p.errores.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../public/coordinacion.html')); await p.waitForTimeout(200);
  await p.click('#ejemplo'); await p.waitForTimeout(400);
  ok((await p.textContent('#kpis')).includes('Locutores12') && await p.$$eval('#tabla tbody tr', x => x.length) === 15 && await p.$$eval('#reems .f', x => x.length) > 0 && (await p.textContent('#reems')).includes('Noche de Paz') && p.errores.length === 0, 'panel de coordinación: ejemplo con 12 locutores, 15 programas y sus reemplazos, sin errores');
  await p.close();

  // ── sobre Mensajero: sin filas «por completar» ──
  p = await abrir(b);
  await p.evaluate(() => document.getElementById('s-mensajero').open = true);
  ok(!(await p.textContent('#mensajero')).includes('Por completar') && (await p.textContent('#mensajero')).includes('mensajero100.9fm') && await p.getAttribute('#mensajero a[href*="grilla"]', 'href') === 'https://mensajerofm.org/grilla/publica.php', 'sobre Mensajero: sin filas vacías, con redes y el enlace a la grilla de programación');
  await p.close();

  // ── historias de Mensajero y aniversario ──
  p = await abrir(b, {fecha: '2027-03-25T10:00:00'});
  await configurar(p);
  ok((await p.textContent('#dias')).includes('Aniversario de Mensajero · 28 años'), '25 de marzo: aviso de aniversario en la tarjeta del día');
  await p.evaluate(() => document.getElementById('s-mensajero').open = true);
  ok(await p.$$eval('#historias details.loc', x => x.length) === 24 && (await p.textContent('#historias')).includes('Historia de esta semana') && (await p.textContent('#historias')).includes('28 años'), 'historias de Mensajero: 24 aprobadas, la de la semana y el aniversario');
  ok(p.errores.length === 0, 'historias sin errores de JavaScript' + (p.errores.length ? ' → ' + p.errores.join(' | ') : ''));
  await p.close();

  // ── antes del año ──
  p = await abrir(b, {fecha: '2026-12-20T10:00:00'});
  ok((await p.textContent('#h-tema')).length > 0 && p.errores.length === 0, 'antes del 3 de enero de 2027 abre la semana 1 sin errores');
  await p.close();

  await b.close();
  console.log(fallas ? `\n${fallas} FALLA(S)` : '\nTodo en orden.');
  process.exit(fallas ? 1 : 0);
})();
