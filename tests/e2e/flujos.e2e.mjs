// Recorrido completo: clave, registro, autoevaluación, sincronización entre dos dispositivos, buscador,
// exportar, copias y navegación de semanas.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setup, openApp, login, goView } from './helpers.mjs';

let env, A, B;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const sync = async (p) => { await p.waitForTimeout(1200); await p.click('#syncNow').catch(() => {}); await p.waitForTimeout(700); };

test('una clave incorrecta no entra', async () => {
  const p = await openApp(env, { date: '2027-01-06T10:00:00', width: 1180, key: null });
  await p.fill('#lockInput', 'mala');
  await p.click('#lockBtn');
  await p.waitForFunction(() => document.getElementById('lockError').textContent.length > 0);
  assert.equal(await p.isHidden('#lock'), false);
  await login(p);
  await goView(p, 'semana');
  assert.equal(await p.textContent('#weekNum'), 'Semana 2', 'entra en la semana actual (Lila = 2)');
  A = p;
});

test('registro, ánimo, gratitud y autoevaluación', async () => {
  const today = A.locator('.card.is-today');
  await today.locator('textarea.note').first().fill('Registro desde A');
  await today.locator('.grat-note').fill('Gracias A');
  await today.locator('.mood-dot').nth(4).click();
  await A.locator('.chip').first().click();
  for (const i of [4, 9, 14]) await A.locator('#questions .q-scale button').nth(i).click();
  assert.ok((await A.textContent('#evalPct')).startsWith('100'), '3 respuestas de 5 → 100 %');
  await sync(A);
});

test('otro dispositivo recibe los datos y gana la edición más reciente', async () => {
  B = await openApp(env, { date: '2027-01-06T12:00:00', width: 1180, view: 'semana' });
  await B.waitForTimeout(800);
  assert.equal(await B.locator('.card.is-today textarea.note').first().inputValue(), 'Registro desde A');
  assert.equal(await B.locator('.card.is-today .mood-dot.on').count(), 5);
  await B.locator('.card.is-today textarea.note').first().fill('Editado en B');
  await sync(B);
  await A.reload(); await A.waitForTimeout(1200); await goView(A, 'semana');
  assert.equal(await A.locator('.card.is-today textarea.note').first().inputValue(), 'Editado en B');
});

test('el buscador encuentra el registro', async () => {
  await A.click('#searchBtn');
  await A.fill('#searchInput', 'editado');
  await A.waitForTimeout(300);
  assert.equal(await A.locator('.result').count(), 1);
  await A.keyboard.press('Escape');
});

test('exportar planilla CSV y respaldo JSON', async () => {
  await goView(A, 'ano');
  await A.evaluate(() => { document.getElementById('backupFold').open = true; });
  const [csv] = await Promise.all([A.waitForEvent('download'), A.click('#exportCsvBtn')]);
  const txt = fs.readFileSync(await csv.path(), 'utf8');
  assert.ok(txt.includes('Editado en B'));
  assert.equal(txt.split('\r\n').length, 54, '53 semanas + cabecera');
  const [js] = await Promise.all([A.waitForEvent('download'), A.click('#exportJsonBtn')]);
  const bk = JSON.parse(fs.readFileSync(await js.path(), 'utf8'));
  assert.equal(bk.app, 'sunset');
  assert.ok(Object.keys(bk.entries).length >= 4);
  await A.click('#backupsBtn'); await A.waitForTimeout(500);
});

test('navegación de semanas', async () => {
  await goView(A, 'semana');
  await A.click('#prevWeek'); await A.waitForTimeout(200);
  assert.equal(await A.textContent('#weekNum'), 'Semana 1', 'la anterior es la introducción');
  assert.ok(await A.isDisabled('#prevWeek'), 'no hay semana antes de la 1');
  await goView(A, 'hoy'); await goView(A, 'semana');
  assert.equal(await A.textContent('#weekNum'), 'Semana 2', 'Hoy vuelve a la semana actual');
});

test('un campo viejo no pisa el dato nuevo de otro dispositivo', async () => {
  await A.locator('.card.is-today textarea.note').first().focus();
  await B.locator('#closing textarea').first().fill('Funcionó en B');
  await sync(B);
  await A.evaluate(() => window.dispatchEvent(new Event('online'))); await A.waitForTimeout(1200);
  await A.locator('#closing textarea').first().focus(); await A.waitForTimeout(100);
  await A.locator('#closing textarea').first().blur();
  await sync(A);
  await B.reload(); await B.waitForTimeout(1200); await goView(B, 'semana');
  assert.equal(await B.locator('#closing textarea').first().inputValue(), 'Funcionó en B');
  assert.equal(await A.locator('#closing textarea').first().inputValue(), 'Funcionó en B', 'A se redibujó');
});

test('sin errores de página', () => {
  assert.deepEqual(A.errors.concat(B.errors), []);
});
