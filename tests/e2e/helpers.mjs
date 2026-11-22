// Ayudas comunes de las pruebas de navegador (Playwright + axe-core).
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { start, KEY } from './server.mjs';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

// Levanta el servidor (con su propio almacenamiento en memoria) y un navegador.
export async function setup() {
  const srv = await start();
  const browser = await chromium.launch();
  return { url: srv.url, browser, close: async () => { await browser.close(); await srv.close(); } };
}

// Abre la app en una fecha y tamaño dados, entra con la clave y cierra la bienvenida.
// Cada llamada usa un contexto nuevo: es como otro dispositivo (sin datos locales).
export async function openApp(env, { date, width = 390, height = 900, theme, key = KEY, view } = {}) {
  const ctx = await env.browser.newContext({ viewport: { width, height }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  if (theme) await page.addInitScript((t) => { try { localStorage.setItem('sunset_tema', t); } catch (e) { /* */ } }, theme);
  if (date) await page.clock.install({ time: new Date(date) });
  await page.goto(env.url);
  if (key) await login(page, key);
  if (view) await goView(page, view);
  return page;
}

export async function login(page, key = KEY) {
  await page.fill('#lockInput', key);
  await page.click('#lockBtn');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.waitForSelector('#welcomeOk', { state: 'visible', timeout: 1500 }).catch(() => {});
  for (let i = 0; i < 3; i++) if (await page.isVisible('#welcomeOk')) { await page.click('#welcomeOk'); await page.waitForTimeout(80); }
}

export async function goView(page, view) {
  await page.click('.jump [data-view="' + view + '"]');
  await page.waitForTimeout(150);
}

// Violaciones de accesibilidad (axe) en la página o en un selector.
export async function axeViolations(page, selector) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE });
  return page.evaluate(async (sel) => {
    const r = await window.axe.run(sel ? document.querySelector(sel) : document, { resultTypes: ['violations'] });
    return r.violations.map((v) => v.id + ': ' + v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | '));
  }, selector || null);
}

// Rectángulo redondeado de un elemento.
export const box = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), height: Math.round(r.height) };
}, sel);
