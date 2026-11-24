// HERRAMIENTA (no se publica): dibuja el paisaje de cada semana y el logo en un canvas.
// Lo usa tools/render_trees.js para generar las imágenes fijas de public/images.
(function () {
  'use strict';

  // Árbol de cada color. form define la arquitectura de la copa.
  const TREES = {
    Lila: { form: 'lapacho',
      flowers: ['#B565C9', '#D58AD8', '#E9B6E6', '#9B4FB8'], leaves: ['#7E3A93', '#93489F'] },
    Azul: { form: 'jacaranda',
      flowers: ['#7B83E0', '#9AA0EC', '#6A6CC9', '#B7B9F2'], leaves: ['#4B4FA8', '#5A60B8'] },
    Rojo: { form: 'flamboyan',
      flowers: ['#E2341D', '#D42A18', '#C81E14', '#EF4B2A'], leaves: ['#8E1410', '#A81C12'] },
    Amarillo: { form: 'lapacho',
      flowers: ['#F5C518', '#FFD84D', '#E8A90C', '#FFE58A'], leaves: ['#B8840A', '#C9940C'] },
    Blanco: { form: 'lapacho',
      flowers: ['#FFFFFF', '#FDFCF8', '#F6F3EC', '#FFFDF6'], leaves: ['#DCD8CF', '#E8E4DC'] },
    Verde: { form: 'leafy',
      flowers: ['#4E9A3B', '#79B84E', '#A9D46F', '#2F6E2C'], leaves: ['#2C5E24', '#3A7330'] },
    Negro: { form: 'silhouette',
      flowers: ['#0D0705', '#140B07', '#1C120C', '#24170F'], leaves: ['#060302', '#0A0504'] },
  };

  // Cielo de cada color: sale de los mismos datos que usa la app (public/js/tree.js), así no se desfasan.
  const T = window.SunsetTree.TREES;
  // mode 'day': cielo de mañana del mismo color (claro, con el sol bajo y tibio); por defecto, el de la noche.
  const skyOf = (name, mode) => {
    const t = T[name] || T.Lila;
    const b = mode === 'day' ? (t.daySky || t.day || t.bg) : t.bg;   // daySky: cielo de la imagen distinto del fondo de la página
    return { top: b.top, mid: b.mid, low: b.low, glow: mode === 'day' ? '#fff6dc' : t.glow, warm: b.warm, bark: t.bark, day: mode === 'day' };
  };
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (hex, a) => 'rgba(' + rgbOf(hex).join(',') + ',' + a + ')';
  const mixHex = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };

  const FORMS = {
    // spread: apertura entre ramas · decay: acortamiento por nivel · depth: niveles
    // lift: cuánto tienden a subir · trunk: largo del tronco relativo · bloom: densidad de flores
    // Todos comparten la arquitectura del flamboyán (copa ancha y horizontal, tronco corto): la forma más natural.
    // Cambian el color, la densidad, el tamaño de flor y si son flores u hojas, con un leve matiz en la apertura.
    lapacho: { spread: 0.95, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 10, petal: 1.12, flat: true },
    jacaranda: { spread: 0.96, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 10, petal: 1.1, flat: true },
    flamboyan: { spread: 0.95, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 8, petal: 1.05, flat: true },
    leafy: { spread: 0.95, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 11, petal: 1.3, leaf: true, flat: true },
    silhouette: { spread: 0.95, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 11, petal: 1.3, leaf: true, flat: true },
  };

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Cielo de noche con un halo de luz detrás de la copa y calidez al ras del horizonte.
  function drawSky(ctx, w, h, horizon, sky, cx, cy, R) {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, sky.top);
    g.addColorStop(0.6, sky.mid);
    g.addColorStop(1, mixHex(sky.mid, sky.warm, 0.78));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizon);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, horizon); ctx.clip();
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    halo.addColorStop(0, rgba(sky.glow, 0.7));
    halo.addColorStop(0.4, rgba(sky.glow, 0.3));
    halo.addColorStop(1, rgba(sky.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, horizon);
    // Luz baja y ancha en el horizonte.
    ctx.translate(cx, horizon);
    ctx.scale(1, 0.26);
    const low = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.75);
    low.addColorStop(0, rgba(sky.warm, 0.55));
    low.addColorStop(0.5, rgba(sky.warm, 0.18));
    low.addColorStop(1, rgba(sky.warm, 0));
    ctx.fillStyle = low;
    ctx.fillRect(-w, -h * 2, w * 2, h * 4);
    ctx.restore();
  }

  // Suelo oscuro con un reflejo de luz y una alfombra de pétalos caídos.
  function drawGround(ctx, rand, w, h, horizon, sky, flowers, cx, scale, dark) {
    const g = ctx.createLinearGradient(0, horizon, 0, h);
    g.addColorStop(0, sky.day ? mixHex(sky.low, '#a08a66', 0.62) : mixHex(sky.warm, '#000000', 0.78));
    g.addColorStop(1, sky.day ? mixHex(sky.mid, '#7a6447', 0.72) : mixHex(sky.top, '#000000', 0.45));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, horizon, w, h - horizon); ctx.clip();
    ctx.translate(cx, horizon);
    ctx.scale(1, 0.22);
    const lit = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
    lit.addColorStop(0, rgba(sky.warm, dark ? 0.35 : 0.6));
    lit.addColorStop(1, rgba(sky.warm, 0));
    ctx.fillStyle = lit;
    ctx.fillRect(-w, -h, w * 2, h * 4);
    ctx.restore();
    // Alfombra de pétalos: más densa y chica cerca del horizonte, más grande hacia adelante.
    const n = Math.round(w * 0.55);
    for (let i = 0; i < n; i++) {
      const v = Math.pow(rand(), 1.5);                       // 0 = horizonte, 1 = abajo
      const spread = scale * (4.2 + v * 4.5);
      const x = cx + (rand() * 2 - 1) * spread;
      const y = horizon + 3 + v * (h - horizon) * 0.62;
      const edge = Math.abs(x - cx) / spread;
      ctx.globalAlpha = Math.max(0.15, (dark ? 0.55 : 0.85) * (1 - edge * 0.8));
      drawFlower(ctx, x, y, 1.1 + v * 2.2, flowers[Math.floor(rand() * flowers.length)], rand() * 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawFlower(ctx, x, y, r, color, rot) {
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const a = rot + (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, r * 0.34, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLeaf(ctx, x, y, r, color, rot) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.42, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dibuja el tronco y las ramas; devuelve las puntas donde van las flores.
  function growTree(ctx, rand, x, y, len, form, barkColor) {
    const tips = [];
    function branch(x0, y0, l, a, wdt, d) {
      const bend = (rand() - 0.5) * 0.35;
      const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l;
      const mx = x0 + Math.cos(a + bend) * l * 0.5, my = y0 + Math.sin(a + bend) * l * 0.5;
      ctx.strokeStyle = barkColor;
      ctx.lineWidth = Math.max(0.6, wdt); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      if (d <= 0 || l < 3) { tips.push([x1, y1, l]); return; }
      if (d <= 3) tips.push([x1, y1, l]);
      const n = d > 4 ? 2 : (rand() < 0.55 ? 2 : 3);
      for (let i = 0; i < n; i++) {
        let na = a + (n === 2 ? (i === 0 ? -1 : 1) : (i - 1)) * form.spread * (0.6 + rand() * 0.8);
        // Tendencia a subir (lapacho) o a abrirse en horizontal (flamboyán).
        const k = form.lift * 0.15;
        na = na * (1 - k) + (-Math.PI / 2) * k;
        // Ninguna rama cae por debajo de la horizontal: copa ancha, no llorona.
        const lim = form.flat ? 0.25 : 0.4;
        na = Math.max(-Math.PI + lim, Math.min(-lim, na));
        branch(x1, y1, l * (form.decay + (rand() - 0.5) * 0.12), na, wdt * 0.66, d - 1);
      }
    }
    // Tronco de árbol viejo: grueso, con base ensanchada, raíces y corteza.
    const lean = (rand() - 0.5) * 0.12;
    const tl = len * (form.trunkK || 1);   // alto del tronco (el logo lo usa más largo)
    const top = [x + Math.sin(lean) * tl, y - Math.cos(lean) * tl];
    const ctrl = [x - len * 0.07 + (rand() - 0.5) * len * 0.08, y - tl * 0.5];
    const thick = form.thick || 1;   // el logo usa un tronco algo más grueso
    const baseW = len * 0.44 * thick, topW = len * 0.25 * thick;
    const at = function (t) {
      const u = 1 - t;
      return [u * u * x + 2 * u * t * ctrl[0] + t * t * top[0], u * u * y + 2 * u * t * ctrl[1] + t * t * top[1]];
    };
    const half = function (t) { return (baseW + (topW - baseW) * t + baseW * 0.9 * Math.exp(-t * 9)) / 2; };
    const left = [], right = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, c = at(t), hw = half(t) * (1 + (rand() - 0.5) * 0.06);
      left.push([c[0] - hw, c[1]]); right.push([c[0] + hw, c[1]]);
    }
    ctx.fillStyle = barkColor;
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    left.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    right.slice().reverse().forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    ctx.closePath(); ctx.fill();
    // Raíces que se hunden en la tierra.
    ctx.strokeStyle = barkColor; ctx.lineCap = 'round';
    [[-1, 0.55], [1, 0.6], [-1, 0.3], [1, 0.28]].forEach(function (r) {
      ctx.lineWidth = len * (r[1] > 0.4 ? 0.1 : 0.07);
      ctx.beginPath(); ctx.moveTo(x + r[0] * baseW * 0.3, y - len * 0.06);
      ctx.quadraticCurveTo(x + r[0] * len * r[1] * 0.6, y - len * 0.01, x + r[0] * len * r[1], y + 5);
      ctx.stroke();
    });
    // Corteza: vetas y un nudo.
    ctx.save();
    ctx.globalAlpha = 0.28; ctx.lineWidth = Math.max(0.8, len * 0.012);
    for (let i = 0; i < 6; i++) {
      const off = (rand() - 0.5) * 1.4, t0 = rand() * 0.3, t1 = 0.6 + rand() * 0.4;
      ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.9)' : 'rgba(120,80,50,.9)';
      ctx.beginPath();
      for (let j = 0; j <= 8; j++) {
        const t = t0 + (t1 - t0) * j / 8, c = at(t);
        const px = c[0] + off * half(t) * 0.8 + Math.sin(j * 1.3 + i) * len * 0.008;
        if (j === 0) ctx.moveTo(px, c[1]); else ctx.lineTo(px, c[1]);
      }
      ctx.stroke();
    }
    const knot = at(0.45 + rand() * 0.2);
    ctx.globalAlpha = 0.35; ctx.strokeStyle = 'rgba(0,0,0,.9)';
    ctx.beginPath(); ctx.ellipse(knot[0] + (rand() - 0.5) * topW * 0.3, knot[1], topW * 0.12, topW * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    const firstLen = len * (form.flat ? 0.95 : 0.8);
    const starts = form.flat ? [-Math.PI / 2 - 0.85, -Math.PI / 2 + 0.85, -Math.PI / 2] : [-Math.PI / 2 - (form.wide || 0.7), -Math.PI / 2 + (form.wide || 0.7), -Math.PI / 2 + (rand() - 0.5) * 0.3];
    starts.forEach(function (a) { branch(top[0], top[1], firstLen, a + lean, topW * 0.74, form.depth - 1); });
    return tips;
  }

  function render(canvas, colorName, seed, mode) {
    const tree = TREES[colorName] || TREES.Lila;
    const form = FORMS[tree.form];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (!cssW || !cssH) return tree;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    // Capa fija: cielo, sol, suelo y árbol.
    const layer = document.createElement('canvas');
    layer.width = canvas.width; layer.height = canvas.height;
    const ctx = layer.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = cssW, h = cssH;
    const wideFmt = w > h;
    const horizon = h * (wideFmt ? 0.85 : 0.87);       // el árbol se apoya abajo: arriba queda lugar para la franja de íconos
    const treeX = w * 0.5;
    const dark = tree.form === 'silhouette';
    const sky = skyOf(colorName, mode);

    const rand = rng(seed);
    const scale = Math.min(h * (wideFmt ? 0.115 : 0.1), w * 0.125) * (form.flat && w < 640 ? 0.9 : 1);
    const bark = sky.bark;
    const glowY = horizon - scale * 3.2;                 // centro de la copa
    drawSky(ctx, w, h, horizon, sky, treeX, glowY, scale * 7.5);
    const tips = growTree(ctx, rand, treeX, horizon + 2, scale, form, bark);

    // Flores (u hojas) en las puntas.
    const blossoms = [];
    tips.forEach(function (t) {
      const n = Math.round(form.bloom * (0.6 + rand() * 0.8));
      for (let i = 0; i < n; i++) {
        const spread = Math.max(6, t[2] * 0.9);
        const x = t[0] + (rand() - 0.5) * spread * 1.6;
        const y = t[1] + (rand() - 0.5) * spread * 1.2 - spread * 0.2;
        const r = (2.4 + rand() * 2.8) * form.petal * (w < 400 ? 0.85 : 1);
        const c = tree.flowers[Math.floor(rand() * tree.flowers.length)];
        blossoms.push([x, y, r, c, rand() * Math.PI]);
      }
    });
    // Copa en cúpula (como en el logo): desde cada punta se rellena hacia arriba hasta una
    // curva suave, así la parte alta nace de las ramas y no queda como una capa aparte.
    let minX = Infinity, maxX = -Infinity;
    tips.forEach(function (t) { minX = Math.min(minX, t[0]); maxX = Math.max(maxX, t[0]); });
    const domeCx = (minX + maxX) / 2, domeRx = (maxX - minX) / 2;
    const domeH = scale * (form.flat ? 0.6 : 1.0);
    // Altura extra según la posición: máxima en el centro, nula en los bordes.
    const lift = function (x) {
      const u = (x - domeCx) / domeRx;
      return domeH * Math.sqrt(Math.max(0, 1 - u * u));
    };
    tips.forEach(function (t) {
      const room = lift(t[0]) * (0.7 + rand() * 0.3);
      if (room < 2) return;
      const k = Math.min(24, Math.round(form.bloom * 0.45 * room / (scale * 0.3)));
      for (let i = 0; i < k; i++) {
        const x = t[0] + (rand() - 0.5) * Math.max(8, t[2] * 1.3);
        const y = t[1] - Math.pow(rand(), 0.85) * room;
        const useDeep = tree.leaves && rand() < 0.2;
        const pal = useDeep ? tree.leaves : tree.flowers;
        blossoms.push([x, y, (2.4 + rand() * 2.8) * form.petal * (w < 400 ? 0.85 : 1), pal[Math.floor(rand() * pal.length)], rand() * Math.PI]);
      }
    });
    // Terminación de los costados: un contorno redondeado que cierra la copa por los lados y por
    // abajo, para que no termine en un borde recto.
    const sideTips = tips.filter(function (t) { return Math.abs((t[0] - domeCx) / domeRx) > 0.65; });
    if (sideTips.length) {
      const baseY = sideTips.reduce(function (a, t) { return a + t[1]; }, 0) / sideTips.length;
      const shoulderCy = baseY - domeH * 0.3, shoulderRy = domeH * 0.55 + scale * 0.25;
      const n = Math.round(tips.length * form.bloom * 0.3);
      for (let i = 0; i < n; i++) {
        const left = rand() < 0.5;
        const th = (rand() - 0.5) * 2.2;                     // de arriba-costado a abajo-costado
        const d = 0.78 + 0.22 * Math.sqrt(rand());           // pegado al borde, apenas hacia dentro
        const x = domeCx + (left ? -1 : 1) * Math.cos(th) * domeRx * 1.02 * d;
        const y = shoulderCy + Math.sin(th) * shoulderRy * d;
        const useDeep = tree.leaves && rand() < 0.25;
        const pal = useDeep ? tree.leaves : tree.flowers;
        blossoms.push([x, y, (2.4 + rand() * 2.8) * form.petal * (w < 400 ? 0.85 : 1), pal[Math.floor(rand() * pal.length)], rand() * Math.PI]);
      }
    }
    // Las flores oscuras van primero (al fondo) para dar volumen.
    if (tree.leaves) {
      const deep = new Set(tree.leaves);
      blossoms.sort(function (a, b) { return (deep.has(b[3]) ? 1 : 0) - (deep.has(a[3]) ? 1 : 0); });
    }
    if (tree.leaves) {
      tips.forEach(function (t) {
        for (let i = 0; i < 4; i++) {
          drawLeaf(ctx, t[0] + (rand() - 0.5) * 18, t[1] + (rand() - 0.5) * 12, 4 + rand() * 4,
            tree.leaves[Math.floor(rand() * tree.leaves.length)], rand() * Math.PI);
        }
      });
    }
    ctx.globalAlpha = dark ? 0.92 : 0.95;
    blossoms.forEach(function (b) {
      let c = b[3];
      if (!dark) {   // luz de atrás: las flores cercanas al halo se aclaran
        const d = Math.hypot(b[0] - treeX, b[1] - glowY) / (scale * 3.8);
        c = mixHex(c, '#ffd9a0', Math.max(0, 1 - d) * 0.36);
      }
      if (form.leaf) drawLeaf(ctx, b[0], b[1], b[2] * 1.15, c, b[4]);
      else drawFlower(ctx, b[0], b[1], b[2], c, b[4]);
    });
    ctx.globalAlpha = 1;
    drawGround(ctx, rand, w, h, horizon, sky, tree.flowers, treeX, scale, dark);

    canvas.getContext('2d').drawImage(layer, 0, 0);
    return tree;
  }

  // Marca del logo: sol con franjas y árbol de bronce (misma forma que los paisajes), con raíces que salen del círculo.
  // Sirve para la cabecera y para generar los íconos de la app.
  function logo(canvas, opts) {
    opts = opts || {};
    const dpr = opts.dpr || Math.min(window.devicePixelRatio || 1, 3);
    const S = opts.size || canvas.clientWidth;
    if (!S) return;
    canvas.width = canvas.height = Math.round(S * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    if (opts.background) { ctx.fillStyle = opts.background; ctx.fillRect(0, 0, S, S); }
    const cx = S / 2, cy = S * 0.46, R = S * 0.42;

    // Halo suave alrededor del sol: da un borde limpio y luminoso.
    const halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.1);
    halo.addColorStop(0, 'rgba(248,178,92,0.55)');
    halo.addColorStop(0.45, 'rgba(248,178,92,0.18)');
    halo.addColorStop(1, 'rgba(248,178,92,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2); ctx.fill();

    // Sol: degradé arriba y franjas separadas por líneas oscuras abajo.
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(0, cy - R, 0, cy + R * 0.1);
    g.addColorStop(0, '#F5A052'); g.addColorStop(1, '#E8663C');
    ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 1.1);
    const bands = ['#EF7A46', '#F59A4E', '#F8C25E', '#FBE08E', '#FCEFB8'];
    const top = cy + R * 0.1, bandH = (R * 0.9) / bands.length, gap = Math.max(0.7, R * 0.045);
    bands.forEach(function (c, i) {
      ctx.fillStyle = c;
      ctx.fillRect(cx - R, top + i * bandH + gap, R * 2, bandH - gap);
    });
    ctx.restore();

    // ── Árbol del logo ──
    // Se dibuja en una capa aparte, se mide y se escala para que la copa entre en el sol con aire a los
    // costados (nada cortado por el borde). Copa en racimos redondeados con luz arriba y sombra abajo:
    // menos tupida y de silueta limpia, que se lee bien tanto grande como chica.
    const BARK = '#4F2C16';
    const off = document.createElement('canvas');
    off.width = off.height = Math.round(S * dpr);
    const o = off.getContext('2d');
    o.scale(dpr, dpr);
    const form = Object.assign({}, FORMS.leafy, { thick: 1.5, trunkK: 2.25, depth: 7, lift: 1.1, spread: 0.82 });
    const rand = rng(11);
    const base = cy + R * 0.93;
    const scale = R * 0.3;
    const tips = growTree(o, rand, cx, base, scale, form, BARK);
    // Racimos: uno por cada punta final (las intermedias quedan como ramas que se ven entre racimos).
    const ends = tips.filter(function (t) { return t[2] < scale * 0.5; });
    const ys = ends.map(function (t) { return t[1]; }).sort(function (a, b) { return a - b; });
    const yTop = ys[0], yBot = ys[ys.length - 1];
    const clusters = ends.filter(function () { return rand() < 0.5; }).map(function (t) {
      const up = (yBot - t[1]) / Math.max(1, yBot - yTop);          // 0 abajo, 1 arriba
      return { x: t[0], y: t[1] - scale * 0.06, r: scale * (0.17 + rand() * 0.07 + up * 0.03), up: up };
    });
    // Hacia los bordes los racimos se achican: la silueta termina suave, sin discos sueltos a los costados.
    let cx0 = Infinity, cx1 = -Infinity;
    clusters.forEach(function (c) { cx0 = Math.min(cx0, c.x); cx1 = Math.max(cx1, c.x); });
    const dmx = (cx0 + cx1) / 2, drx = Math.max(1, (cx1 - cx0) / 2);
    clusters.forEach(function (c) { const u = Math.abs(c.x - dmx) / drx; c.r *= 1 - 0.4 * Math.max(0, u - 0.55) / 0.45; c.edge = u; });
    clusters.sort(function (a, b) { return b.y - a.y; });               // de abajo hacia arriba
    // Capas de follaje achatadas (como la copa de un flamboyán): sombra abajo, cuerpo y luz arriba,
    // con un borde de hojitas en la parte superior para que la silueta no sea lisa.
    const pad = function (c, dy, kx, ky, color) {
      o.fillStyle = color;
      o.beginPath(); o.ellipse(c.x, c.y + dy, c.r * kx, c.r * ky, 0, 0, Math.PI * 2); o.fill();
    };
    const kx = function (c) { return 1.25 - 0.3 * Math.max(0, (c.edge || 0) - 0.6); };
    clusters.forEach(function (c) { pad(c, c.r * 0.12, kx(c) + 0.03, 0.6, '#3A200F'); });
    clusters.forEach(function (c) { pad(c, 0, kx(c), 0.56, '#54301A'); });
    clusters.forEach(function (c) {
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI * (0.04 + 0.92 * rand());
        const d = 0.85 + rand() * 0.2;
        drawLeaf(o, c.x + Math.cos(a) * c.r * 1.2 * d, c.y + Math.sin(a) * c.r * 0.55 * d, c.r * (0.15 + rand() * 0.06),
          c.up > 0.45 ? (rand() < 0.5 ? '#7E4B25' : '#6C3F1F') : '#5E3519', (rand() - 0.5) * 0.7);
      }
    });
    // Medir y encajar: la copa entra en el ancho y la altura del sol, apoyada en la misma base.
    const px = o.getImageData(0, 0, off.width, off.height).data;
    let bx0 = off.width, bx1 = 0, by0 = off.height;
    for (let y = 0; y < off.height; y++) {
      for (let x = 0; x < off.width; x++) {
        if (px[(y * off.width + x) * 4 + 3] > 20) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; }
      }
    }
    bx0 /= dpr; bx1 /= dpr; by0 /= dpr;
    const fit = Math.min(1.25, (R * 1.66) / (bx1 - bx0), (base - (cy - R * 0.8)) / (base - by0));
    const mid = (bx0 + bx1) / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();   // por seguridad; con el encaje no corta nada
    ctx.translate(cx - fit * (mid - cx), base);
    ctx.scale(fit, fit);
    ctx.drawImage(off, -cx, -base, S, S);
    ctx.restore();

    // Raíces: se afinan hacia la punta y salen apenas del sol, con una curva suave.
    ctx.fillStyle = BARK;
    [[-1, 0.74, 0.045, 0.045], [1, 0.72, 0.045, 0.05], [-1, 0.46, 0.03, 0.025], [1, 0.5, 0.03, 0.03]].forEach(function (r) {
      const sx = r[0], reach = R * r[1], w0 = R * r[2], drop = R * r[3];
      const x0 = cx + sx * R * 0.05, y0 = base - R * 0.01;
      const x1 = cx + sx * reach, y1 = base + drop;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - w0 / 2);
      ctx.quadraticCurveTo(cx + sx * reach * 0.45, y0 - w0 * 0.1, x1, y1);
      ctx.quadraticCurveTo(cx + sx * reach * 0.45, y0 + w0 * 0.9, x0, y0 + w0 / 2);
      ctx.closePath();
      ctx.fill();
    });
  }

  window.SunsetTreeRender = { render: render, logo: logo };
})();
