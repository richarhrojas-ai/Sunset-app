// Genera las imágenes fijas de la app a partir de tools/tree-render.js:
//   public/images/trees/<Color>-wide.webp   paisaje para pantallas anchas
//   public/images/trees/<Color>-tall.webp   paisaje para celulares
//   public/images/logo.png                  logo de la cabecera
//   public/icons/*.png                      íconos de la app instalada
//
// Uso:  node tools/render_trees.cjs        (requiere playwright y python3 con Pillow)
// Para usar una foto real en lugar de la ilustración, ver tools/hero_from_photo.py.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const TMP = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'sunset-render-'));
const COLORS = ['Lila', 'Verde', 'Amarillo', 'Blanco', 'Negro', 'Rojo', 'Azul'];
const SIZES = { wide: [1180, 560], tall: [480, 640] };   // tamaño en píxeles CSS; se dibuja al doble
const COL = { Negro: 0, Rojo: 1, Azul: 2, Lila: 3, Verde: 4, Amarillo: 5, Blanco: 6 };   // columna del tablero; define la variante de cada árbol

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'tools', 'tree-render.js'), 'utf8') });
  const draw = (fn, args) => page.evaluate(fn, args);

  for (const color of COLORS) {
    for (const [kind, [w, h]] of Object.entries(SIZES)) {
      const png = await draw(({ color, w, h, seed }) => {
        const c = document.createElement('canvas');
        Object.defineProperty(c, 'clientWidth', { value: w });
        Object.defineProperty(c, 'clientHeight', { value: h });
        Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
        window.SunsetTreeRender.render(c, color, seed);
        return c.toDataURL('image/png');
      }, { color, w, h, seed: 2027 * 10 + COL[color] });
      fs.writeFileSync(path.join(TMP, `${color}-${kind}.png`), Buffer.from(png.split(',')[1], 'base64'));
    }
  }
  // Logo solo, o ícono: el logo centrado sobre fondo carbón con un margen (pad) alrededor.
  const logo = (size, pad) => draw(({ size, pad }) => {
    const inner = Math.round(size * (1 - 2 * pad));
    const m = document.createElement('canvas');
    window.SunsetTreeRender.logo(m, { size: inner, dpr: 1 });
    if (!pad) return m.toDataURL('image/png');
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#262321'; ctx.fillRect(0, 0, size, size);
    ctx.drawImage(m, (size - inner) / 2, (size - inner) / 2 + size * 0.03);
    return c.toDataURL('image/png');
  }, { size, pad });
  const save = (rel, dataUrl) => fs.writeFileSync(path.join(TMP, rel), Buffer.from(dataUrl.split(',')[1], 'base64'));

  save('logo.png', await logo(216, 0));
  save('icon-192.png', await logo(192, 0.04));
  save('icon-512.png', await logo(512, 0.04));
  save('icon-maskable-512.png', await logo(512, 0.14));
  save('apple-touch-icon.png', await logo(180, 0.06));
  await browser.close();

  // PNG → WebP (imágenes) y copia de logo e íconos.
  execFileSync('python3', ['-I', '-c', `
import sys, shutil, pathlib
from PIL import Image
tmp, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
(out / 'images' / 'trees').mkdir(parents=True, exist_ok=True)
for p in sorted(tmp.glob('*-*.png')):
    if p.name.startswith(('icon-', 'apple-')): continue
    Image.open(p).convert('RGB').save(out / 'images' / 'trees' / (p.stem + '.webp'), 'WEBP', quality=82, method=6)
shutil.copy(tmp / 'logo.png', out / 'images' / 'logo.png')
for n in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'):
    shutil.copy(tmp / n, out / 'icons' / n)
`, TMP, OUT], { stdio: 'inherit' });
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('Imágenes generadas en public/images y public/icons');
})();
