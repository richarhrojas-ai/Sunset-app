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
const texto = p => p.evaluate(() => document.getElementById('copia-txt').value);
const cerrarCopia = p => p.evaluate(() => document.getElementById('copia').close());

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});

  // ── celular ──
  let p = await abrir(b);
  ok(await p.evaluate(() => DATA.semanas.length === 52), '52 semanas cargadas');
  ok(await p.evaluate(() => DATA.semanas.every(w => w.dias.every((d, i) => i === 0 || d.guion) && w.dias.every(d => d.deporte))), 'guion de lunes a sábado y frase deportiva en los 364 días');
  ok(await p.evaluate(() => document.documentElement.dataset.tema) === 'oscuro', 'apariencia automática: oscura en el celular');
  ok((await p.textContent('#h-tema')).includes('Producción'), 'portada del 3 de marzo: semana de Producción y Desarrollo');
  ok(await p.evaluate(() => [...document.querySelectorAll('#scene svg [transform="translate(268 180)"]')].length === 1), 'escena de Producción con su molino (no la de Salud)');
  for (const t of ['Vida Cristiana', 'Liderazgo', 'Familia', 'Finanzas', 'Crecimiento Personal', 'Produccion y Desarrollo', 'Salud']) {
    await p.click(`#temas [data-t="${t}"]`); await p.waitForTimeout(80);
    const n = await p.$$eval('#hoja li', x => x.length);
    ok(n >= 7, `hoja del tema ${t}: ${n} semanas`);
    await p.evaluate(() => document.getElementById('hoja').close());
  }
  const sem0 = await p.textContent('#h-tema');
  await p.click('#next'); await p.click('#hoy'); await p.waitForTimeout(80);
  ok(await p.textContent('#h-tema') === sem0, 'flechas y «Esta semana» vuelven a la semana actual');

  // días al aire y tarjeta del día
  await p.click('[data-preset="1,2,3,4,5,6"]'); await p.waitForTimeout(200);
  ok(await p.$$eval('#dias [role=tab]', x => x.length) === 6, 'lunes a sábado: seis pestañas de día');
  ok(await p.$$eval('#dias details.punto', x => x.length) === 3, 'miércoles: tres puntos plegables');
  ok(await p.$$eval('#dias details.punto[open]', x => x.length) === 1, 'sin franja: un solo punto abierto');
  ok(await p.$$eval('#dias .deporte', x => x.length) === 1, 'frase deportiva en la tarjeta');
  ok(await p.evaluate(() => { const a = [...document.querySelectorAll('#dias article > *')].map(e => e.className); return a.indexOf('deporte') > a.findIndex(c => c.includes('punto')); }), 'frase deportiva después de los puntos');
  await p.click('#dias [data-k="aire3"]'); await p.waitForTimeout(80);
  ok(await p.getAttribute('#dias [data-k="aire3"]', 'aria-pressed') === 'true', 'marcar «Al aire»');

  // mensajes de oyentes
  for (let k = 0; k < 3; k++) await p.click('#dias [data-msg-mas="wa"]');
  await p.click('#dias [data-msg-restar]'); await p.click('#dias [data-msg-mas="wa"]');
  ok(await p.textContent('#dias [data-msg-total]') === '2', 'mensajes: sumar 3 y «Restar» 1 da 2');
  ok(await p.getAttribute('#dias [data-msg-restar]', 'aria-pressed') === 'false', '«Restar» se apaga solo después de un toque');
  await p.click('#dias [data-modo="grabado"]'); await p.waitForTimeout(80);
  ok(await p.$$eval('#dias .msgs-dia', x => x.length) === 0, 'día grabado: sin cuadro de mensajes');
  await p.click('#dias [data-modo="vivo"]'); await p.waitForTimeout(80);

  // franja horaria → un punto por programa
  await p.evaluate(() => document.getElementById('s-prep').open = true);
  await p.selectOption('#pg-franja', 'noche'); await p.waitForTimeout(150);
  ok(await p.$eval('#dias details.punto[open] summary span', e => e.textContent) === '3', 'franja noche: se abre el punto 3');
  await p.click('#dias [data-copiar="dia"]'); await p.waitForTimeout(80);
  let t = await texto(p);
  ok(/3\. .*← TU PUNTO DE HOY/.test(t), 'guion copiado marca «TU PUNTO DE HOY»');
  ok(t.indexOf('FRASE DEPORTIVA') > t.indexOf('PARA CERRAR'), 'guion copiado: frase deportiva al final');
  ok(t.includes('PARA HACERLO A TU ESTILO'), 'guion copiado: ideas para hacerlo a tu estilo');
  await cerrarCopia(p);

  // domingo y sábado
  await p.click('[data-vertodo]'); await p.click('#dias [data-d="0"]'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => { const a = [...document.querySelectorAll('#dias article > *')].map(e => e.className); return a.indexOf('deporte') === a.indexOf('hist') + 1; }), 'domingo: frase deportiva después de la historia ilustrativa');
  await p.click('#dias [data-d="6"]'); await p.waitForTimeout(80);
  ok(await p.$$eval('#dias ol.ideas li', x => x.length) === 3, 'sábado: resumen con las tres ideas');

  // flyer
  await p.click('#dias [data-flyer]'); await p.waitForTimeout(1500);
  ok((await p.getAttribute('#flyer-img', 'src') || '').startsWith('data:image/png'), 'flyer del versículo generado');
  await p.evaluate(() => document.getElementById('flyer').close());

  // registro, informe, preparación
  await p.evaluate(() => document.getElementById('s-reg').open = true); await p.selectOption('#mes', '2'); await p.waitForTimeout(80);
  ok((await p.textContent('#reg-v')).includes('3 mar'), 'registro de marzo: aparece el miércoles 3 al aire');
  ok((await p.textContent('#reg-msgs')).includes('2'), 'registro: mensajes del mes por canal');
  const pct0 = await p.textContent('#prep-pct');
  await p.click('#prep [data-p]'); await p.waitForTimeout(80);
  ok(await p.textContent('#prep-pct') !== pct0, 'preparación: marcar una tarea cambia el porcentaje');

  // buscar y números útiles
  await p.evaluate(() => document.getElementById('s-buscar').open = true); await p.fill('#q', 'lapacho'); await p.waitForTimeout(150);
  await p.fill('#q', 'perdón'); await p.waitForTimeout(150);
  ok(await p.$$eval('#res li button', x => x.length) > 0, 'buscador encuentra «perdón»');
  ok(await p.$$eval('#utiles a[href^="tel:"]', x => x.length) === 6, 'números útiles: seis números para llamar');

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

  // ── antes del año ──
  p = await abrir(b, {fecha: '2026-12-20T10:00:00'});
  ok((await p.textContent('#h-tema')).length > 0 && p.errores.length === 0, 'antes del 3 de enero de 2027 abre la semana 1 sin errores');
  await p.close();

  await b.close();
  console.log(fallas ? `\n${fallas} FALLA(S)` : '\nTodo en orden.');
  process.exit(fallas ? 1 : 0);
})();
