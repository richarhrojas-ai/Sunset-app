// Portada y celular: mismas medidas en las 7 semanas (para capturas), lo del día visible en la primera
// pantalla, barra de atajos sin desbordar y firmas bien detectadas.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, openApp, goView, box } from './helpers.mjs';

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });
const SAB = '2027-01-16T21:00:00';

for (const width of [430, 1180]) {
  test('portada idéntica en las 7 semanas (' + width + ' px)', async () => {
    const p = await openApp(env, { date: SAB, width, view: 'semana' });
    const sigs = new Set(), trees = new Set();
    for (let i = 0; i < 7; i++) {
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(400);
      const parts = [];
      // Posición vertical (relativa a la portada) y alto (el ancho del texto cambia con cada nombre, eso es contenido).
      const hero = await box(p, '.hero');
      for (const s of ['.hero', '#weekSub', '#weekNum', '#treeName', '.week-controls']) { const r = await box(p, s); parts.push(s + ':' + (r.top - hero.top) + '/' + r.height); }
      sigs.add(parts.join(' '));
      trees.add(await p.textContent('#treeName'));
      await p.click('#nextWeek');
    }
    assert.equal(trees.size, 7, 'siete árboles distintos');
    assert.equal(sigs.size, 1, 'mismas posiciones y tamaños:\n' + [...sigs].join('\n'));
    assert.deepEqual(p.errors, []);
  });
}

test('celular: el sábado se ven las 3 preguntas en la primera pantalla', async () => {
  const p = await openApp(env, { date: '2027-01-16T10:00:00', width: 430, height: 830 });
  const last = await box(p, '#hoyView .sat-list li:last-child');
  assert.ok(last.bottom <= 830, 'la tercera termina en ' + last.bottom + ' px');
});

test('celular: al tocar un ícono, el rótulo no aplasta la fila de íconos', async () => {
  const p = await openApp(env, { date: '2027-01-16T10:00:00', width: 360, height: 740 });
  await p.locator('#dims button').nth(6).click(); await p.waitForTimeout(400);
  const ico = await box(p, '#dims button');
  assert.ok(ico.height >= 30, 'íconos de ' + ico.height + ' px');
  const cap = await box(p, '#dimCap'), bottom = await box(p, '.hero-bottom');
  assert.ok(cap.bottom <= bottom.top + 1, 'el rótulo no se superpone a la semana');
});

for (const width of [360, 390, 430]) {
  test('barra de atajos con el botón de modo, sin desbordar (' + width + ' px)', async () => {
    const p = await openApp(env, { date: '2027-01-16T10:00:00', width });
    assert.equal(await p.evaluate(() => { const j = document.querySelector('.jump'); return j.scrollWidth - j.clientWidth; }), 0);
  });
}

test('un guion en medio de la frase no se toma como firma; «— Richarh Rojas» sí', async () => {
  const p = await openApp(env, { date: SAB, width: 430, view: 'semana' });
  await p.click('#nextWeek'); await p.waitForTimeout(200);   // Semana 4: «…a la sequía — porque sus raíces…»
  assert.match(await p.textContent('#todayText'), /sequía — porque/);
  assert.equal(await p.locator('#todayText .sig').count(), 0);
  assert.ok(await p.locator('#days .sig').count() >= 1, 'la firma del autor sigue marcada');
  await goView(p, 'hoy');
});
