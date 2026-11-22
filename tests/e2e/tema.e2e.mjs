// Modo Auto / Día / Noche: Auto sigue la hora (día de 7 a 19 h), la elección se recuerda.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openApp } from './helpers.mjs';

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });
const theme = (p) => p.evaluate(() => document.documentElement.dataset.theme);

for (const [hour, expect] of [['10:00', 'day'], ['21:00', 'night']]) {
  test('Auto a las ' + hour + ' → ' + expect + ', con su paisaje', async () => {
    const p = await openApp(env, { date: '2027-01-06T' + hour + ':00' });
    assert.equal(await theme(p), expect);
    assert.ok((await p.getAttribute('#heroImg', 'src')).endsWith(expect === 'day' ? '-tall-day.webp' : '-tall.webp'));
  });
}

test('el botón recorre Día, Noche y Auto, y se recuerda al recargar', async () => {
  const p = await openApp(env, { date: '2027-01-06T10:00:00' });
  assert.ok(await p.isVisible('.jump #themeBtn'), 'está en la barra de atajos');
  await p.click('#themeBtn'); assert.equal(await theme(p), 'day');
  await p.click('#themeBtn'); assert.equal(await theme(p), 'night');
  await p.reload(); await p.waitForTimeout(900);
  assert.equal(await theme(p), 'night');
  assert.ok((await p.getAttribute('#themeBtn', 'aria-label')).includes('Noche'));
  await p.click('#themeBtn');
  assert.ok((await p.getAttribute('#themeBtn', 'aria-label')).includes('Auto'));
  assert.deepEqual(p.errors, []);
});
