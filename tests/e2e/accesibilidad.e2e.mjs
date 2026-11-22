// Accesibilidad con axe-core: cada vista (Hoy, Semana, Mi año) en modo día y noche, en varios colores
// y tamaños, más la ficha de una dimensión. Se espera 0 violaciones.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openApp, goView, axeViolations } from './helpers.mjs';

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const CASES = [
  ['introducción, celular', 390, '2027-01-01T10:00:00'],
  ['Verde, celular', 390, '2027-01-16T10:00:00'],
  ['Negro, celular', 390, '2027-01-31T10:00:00'],
  ['Rojo, escritorio', 1180, '2027-02-10T10:00:00'],
  ['Blanco, escritorio', 1180, '2027-01-27T10:00:00'],
];
for (const theme of ['night', 'day']) {
  for (const [label, width, date] of CASES) {
    test(label + ' · ' + theme, async () => {
      const p = await openApp(env, { date, width, theme });
      const all = [];
      for (const view of ['hoy', 'semana', 'ano']) {
        await goView(p, view);
        if (view !== 'hoy') await p.evaluate(() => ['recursos', 'yearFold', 'moodFold', 'boardFold', 'diaryFold', 'backupFold'].forEach((i) => { const d = document.getElementById(i); if (d && !d.hidden) d.open = true; }));
        await p.waitForTimeout(250);
        (await axeViolations(p)).forEach((v) => all.push(view + ' · ' + v));
      }
      assert.deepEqual(all, []);
      assert.deepEqual(p.errors, []);
    });
  }
}

test('ficha de una dimensión', async () => {
  const p = await openApp(env, { date: '2027-01-16T10:00:00' });
  await p.locator('#dims button').nth(0).click();
  await p.click('#capGo');
  assert.deepEqual(await axeViolations(p, '#wordModal'), []);
});
