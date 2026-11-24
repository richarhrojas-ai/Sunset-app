// Reglas del sistema y de Hoy: meta anual del 70 %, sábado de evaluación y domingo de preparación,
// días anteriores, semanas cerradas con nota posterior y la ficha de cada dimensión.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openApp, goView } from './helpers.mjs';

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });
const SAB = '2027-01-16T10:00:00';   // sábado de la semana verde (Semana 3)
const prevDay = (p) => p.locator('#hoyView button[aria-label="Día anterior"]').click().then(() => p.waitForTimeout(150));

test('meta del año: porcentaje de días con registro sobre los días vividos', async () => {
  const p = await openApp(env, { date: SAB });
  await goView(p, 'ano');
  let t = await p.innerText('#yearGoal');
  assert.match(t, /0 de 16 días/);
  assert.match(t, /Te faltan 12 días/, '70 % de 16 = 11,2 → faltan 12');
  await goView(p, 'hoy');
  await p.fill('#hoyView textarea[placeholder="Lo que te dejó la semana…"]', 'Una semana tranquila');
  await p.waitForTimeout(700);
  await goView(p, 'ano');
  t = await p.innerText('#yearGoal');
  assert.match(t, /1 de 16 días/);
  assert.deepEqual(p.errors, []);
});

test('Hoy: sábado de evaluación, días anteriores y domingo con la historia', async () => {
  const p = await openApp(env, { date: SAB });
  assert.equal(await p.innerText('#hoyView .hoy-mode'), 'DÍA DE EVALUACIÓN');
  assert.equal(await p.locator('#hoyView .sat-list li').count(), 3);
  await prevDay(p);
  assert.match(await p.innerText('#hoyView .hoy-title'), /Viernes 15 de enero/);
  assert.ok(await p.isVisible('#hoyView .hoy-back'), 'aparece «Volver a hoy»');
  assert.ok((await p.locator('#hoyView .field-label').allInnerTexts()).some((x) => /registro del viernes/i.test(x)));
  for (let i = 0; i < 5; i++) await prevDay(p);
  assert.match(await p.innerText('#hoyView .hoy-title'), /Domingo 10 de enero/);
  assert.equal(await p.innerText('#hoyView .hoy-mode'), 'DÍA DE PREPARACIÓN');
  assert.ok(await p.isVisible('#hoyView .hoy-story'), 'la historia de la semana a la vista');
  await p.click('#hoyView .hoy-back');
  assert.match(await p.innerText('#hoyView .hoy-title'), /Sábado 16 de enero/);
  assert.deepEqual(p.errors, []);
});

test('preguntas repartidas de lunes a viernes; las pendientes pasan al día siguiente', async () => {
  const p = await openApp(env, { date: '2027-01-11T10:00:00' });   // lunes: 2 de las 9
  assert.equal(await p.locator('#hoyView .dq .dq-item').count(), 2);
  assert.equal(await p.innerText('#hoyView .dq .dq-label'), 'PREGUNTAS DE HOY');
  const q = await openApp(env, { date: '2027-01-13T10:00:00' });   // miércoles: 2 de hoy + 4 pendientes
  const words = await q.locator('#hoyView .dq .dq-word').allInnerTexts();
  assert.equal(words.filter((x) => /DE LUNES|DE MARTES/.test(x)).length, 4, words.join(' | '));
  await q.locator('#hoyView .dq .q-scale').first().locator('button').nth(4).click();
  await q.waitForTimeout(500);
  assert.equal(await q.locator('#hoyView .dq .dq-item').count(), 5, 'la respondida se va');
  assert.deepEqual(p.errors.concat(q.errors), []);
});

test('sábado: lo pendiente de a una (con avance, teclas y «Anterior») y el cierre de cada palabra', async () => {
  const p = await openApp(env, { date: SAB, width: 1180 });
  const ev = '#hoyView .hoy-eval';
  const total = await p.textContent(ev + ' .ev-count');
  assert.match(total, / de 9 respondidas/);
  const q1 = await p.textContent(ev + ' .ev-q');
  const before = Number(total.split(' ')[0]);
  await p.locator(ev + ' .ev-card .q-scale button').nth(3).click();
  assert.equal(await p.textContent(ev + ' .ev-card .ans-label'), 'Casi siempre', 'cada número con su palabra');
  await p.waitForFunction((a) => document.querySelector('#hoyView .ev-q').textContent !== a, q1);
  assert.equal(await p.textContent(ev + ' .ev-count'), (before + 1) + ' de 9 respondidas', 'pasa sola a la siguiente');
  await p.locator(ev + ' .ev-card .q-scale button').first().focus();
  await p.keyboard.press('5');
  await p.waitForFunction((n) => document.querySelector('#hoyView .ev-count').textContent.startsWith(String(n)), before + 2);
  await p.click(ev + ' .ev-link:first-child');
  await p.click(ev + ' .ev-link:first-child');
  assert.equal(await p.textContent(ev + ' .ev-q'), q1, '«Anterior» vuelve a la primera');
  assert.equal(await p.locator(ev + ' .ev-card .q-scale button[aria-pressed="true"]').textContent(), '4', 'con su respuesta marcada');
  assert.equal(await p.locator(ev + ' .ev-close-row').count(), 3, 'cierre de las 3 palabras');
  await p.locator(ev + ' .ev-close-row textarea').first().fill('Ordenar antes de quejarme');
  await p.locator(ev + ' .ev-close-row textarea').first().blur();
  await p.waitForTimeout(300);
  const c = await p.evaluate(() => JSON.parse(localStorage.getItem('sunset_v2')).entries['2027/w2/c/Entorno']);
  assert.equal(c && c.v, 'Ordenar antes de quejarme', 'la frase de cierre se guarda');
  assert.deepEqual(p.errors, []);
});

test('sábado: las tres preguntas de reflexión se responden en Hoy y en la semana', async () => {
  const p = await openApp(env, { date: SAB });
  assert.equal(await p.locator('#hoyView .sat-list li .sat-open').count(), 3, 'un «Responder» discreto por pregunta');
  await p.locator('#hoyView .sat-list li .sat-open').first().click();
  await p.locator('#hoyView .sat-list li textarea').first().fill('Pagué un café sin decir nada');
  await p.locator('#hoyView .sat-list li textarea').first().blur();
  await p.waitForTimeout(300);
  await p.locator('#hoyView .sat-list li .sat-open').first().click();
  assert.equal(await p.locator('#hoyView .sat-list li textarea').count(), 0, '«Ocultar» esconde la respuesta');
  assert.equal(await p.locator('#hoyView .sat-list li .sat-open').first().textContent(), 'ver respuesta');
  await goView(p, 'semana');
  assert.equal(await p.locator('#days .card.day-6 .sat-list textarea').count(), 0, 'en la semana también empieza oculta');
  await p.locator('#days .card.day-6 .sat-list .sat-open').first().click();
  assert.equal(await p.locator('#days .card.day-6 .sat-list textarea').first().inputValue(), 'Pagué un café sin decir nada');
  await p.click('#searchBtn'); await p.fill('#searchInput', 'café sin decir'); await p.waitForTimeout(300);
  assert.equal(await p.locator('.result').count(), 1, 'el buscador la encuentra');
  assert.deepEqual(p.errors, []);
});

test('tendencia: cómo se movió la palabra desde la última vez que se evaluó', async () => {
  // Entorno se evalúa en las semanas internas 2 y 37 (visibles 3 y 38). Sábado de la 38.
  const ctx = await env.browser.newContext({ viewport: { width: 1180, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    const t = Date.UTC(2027, 8, 18);   // fecha fija: más nueva que lo que otras pruebas dejaron en el servidor
    localStorage.setItem('sunset_v2', JSON.stringify({ entries: { '2027/w2/a/Entorno': { v: [3, 3, 3], t }, '2027/w37/a/Entorno': { v: [4, 4, 4], t } }, welcomed: true }));
  });
  await p.clock.install({ time: new Date('2027-09-18T10:00:00') });
  await p.goto(env.url);
  await p.fill('#lockInput', 'clave123'); await p.click('#lockBtn');
  await p.waitForSelector('#lock', { state: 'hidden' });
  await p.waitForSelector('#hoyView .ev-trend');
  const trends = await p.locator('#hoyView .ev-trend').allInnerTexts();
  assert.ok(trends.some((x) => /^↑ 20 desde la semana 3$/.test(x)), trends.join(' | '));
});

test('semanas cerradas: se edita la actual y la anterior; las más viejas solo con nota posterior', async () => {
  const p = await openApp(env, { date: SAB, view: 'semana' });
  assert.equal(await p.textContent('#weekNum'), 'Semana 3');
  assert.ok(await p.isHidden('#lockBox'), 'la semana actual se edita');
  await p.click('#prevWeek'); await p.waitForTimeout(200);
  assert.ok(await p.isHidden('#lockBox'), 'la anterior también');
  await p.click('#prevWeek'); await p.waitForTimeout(200);
  assert.equal(await p.textContent('#weekNum'), 'Semana 1');
  assert.ok(await p.isVisible('#lockBox'), 'la de hace dos semanas está cerrada');
  const ro = await p.evaluate(() => [...document.querySelectorAll('main textarea')].filter((t) => t.offsetParent && !t.closest('#lockBox')).map((t) => t.readOnly));
  assert.ok(ro.length > 0 && ro.every(Boolean), 'sus campos son de solo lectura');
  await p.locator('#lockBox textarea').fill('No pude registrar: viaje');
  await p.locator('#lockBox textarea').blur();
  await p.waitForTimeout(300);
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('sunset_v2')).entries['2027/w0/nota']);
  assert.equal(saved && saved.v, 'No pude registrar: viaje', 'la nota posterior se guarda');
  await p.locator('#days .record-tab').first().click();
  assert.equal(await p.evaluate(() => document.getElementById('editorText').readOnly), true, 'la pantalla grande también es de solo lectura');
  assert.match(await p.textContent('#editorSaved'), /solo lectura/);
  await p.click('#editorDone');
  // En Hoy, un día de esa semana muestra el aviso.
  await goView(p, 'hoy');
  for (let i = 0; i < 14; i++) await prevDay(p);
  assert.match(await p.innerText('#hoyView .hoy-title'), /Sábado 2 de enero/);
  assert.ok(await p.isVisible('#hoyView .lock-box'));
  assert.deepEqual(p.errors, []);
});

test('ícono de dimensión: concepto, ficha completa y paso a la autoevaluación', async () => {
  const p = await openApp(env, { date: SAB });
  await p.locator('#dims button').nth(0).click();
  assert.equal(await p.textContent('#capDef'), 'Lo que no se gana: se recibe.');
  assert.equal(await p.textContent('#capAsk'), '¿Qué me fue dado que no estoy viendo?');
  await p.click('#capGo');
  assert.ok(await p.isVisible('#wordModal'));
  assert.equal(await p.locator('#dimWords li').count(), 7, 'sus 7 palabras');
  assert.equal(await p.locator('#dimWords li.is-now').count(), 1, 'la de esta semana resaltada');
  assert.equal(await p.textContent('#wordGo'), 'Responder la autoevaluación');
  await p.click('#wordGo'); await p.waitForTimeout(300);
  assert.ok(await p.evaluate(() => document.body.classList.contains('view-semana')), 'pasa a la semana');
  assert.equal(await p.locator('.chip[aria-expanded="true"]').count(), 1, 'con la palabra abierta');
  // Una palabra en juego (no principal) lleva a la semana en que se evalúa.
  await p.locator('#dims button').nth(5).click();
  await p.click('#capGo');
  assert.match(await p.textContent('#wordGo'), /^(Ir a la semana|Ver la autoevaluación)/);
  assert.deepEqual(p.errors, []);
});

test('nombres completos en pantalla (Ahorro de Tiempo)', async () => {
  const p = await openApp(env, { date: '2027-03-10T10:00:00' });
  await p.locator('#dims button').nth(5).click();
  assert.equal(await p.textContent('#capWord'), 'Ahorro de Tiempo');
});
