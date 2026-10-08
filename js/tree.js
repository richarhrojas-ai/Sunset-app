// Paisaje de la semana: cielo al atardecer, sol con franjas (como el logo) y el árbol
// en flor del color de la semana. Se dibuja con canvas para que la app siga liviana
// y funcione sin conexión. Los pétalos que caen respetan "reducir movimiento".
(function () {
  'use strict';

  // Árbol de cada color. form define la arquitectura de la copa.
  const TREES = {
    Lila: { ink: ['#B565C9', '#D58AD8'], name: 'Lapacho morado', sci: 'Handroanthus impetiginosus', form: 'lapacho',
      flowers: ['#B565C9', '#D58AD8', '#E9B6E6', '#9B4FB8'] },
    Azul: { ink: ['#6A6CC9', '#9AA0EC'], name: 'Jacarandá', sci: 'Jacaranda mimosifolia', form: 'jacaranda',
      flowers: ['#7B83E0', '#9AA0EC', '#6A6CC9', '#B7B9F2'] },
    Rojo: { ink: ['#E2341D', '#F47A3A'], name: 'Flamboyán', sci: 'Delonix regia', form: 'flamboyan',
      flowers: ['#E2341D', '#F45B26', '#C81E14', '#FF8A3D'], leaves: ['#3F6B25', '#568530'] },
    Amarillo: { ink: ['#E8A90C', '#F5C518'], name: 'Lapacho amarillo', sci: 'Handroanthus albus', form: 'lapacho',
      flowers: ['#F5C518', '#FFD84D', '#E8A90C', '#FFE58A'] },
    Blanco: { ink: ['#E9CFDB', '#FBF1F5'], name: 'Lapacho blanco', sci: 'Tabebuia roseoalba', form: 'lapacho',
      flowers: ['#FFFFFF', '#FBF4F6', '#F3DCE6', '#FFF6E8'] },
    Verde: { ink: ['#4E9A3B', '#86C25A'], name: 'Árbol en hoja nueva', sci: '', form: 'leafy',
      flowers: ['#4E9A3B', '#79B84E', '#A9D46F', '#2F6E2C'] },
    Negro: { ink: ['#2A2420', '#B8860B'], name: 'Silueta al atardecer', sci: '', form: 'silhouette',
      flowers: ['#E8B04A', '#C8900A'] },
  };

  const FORMS = {
    // spread: apertura entre ramas · decay: acortamiento por nivel · depth: niveles
    // lift: cuánto tienden a subir · trunk: largo del tronco relativo · bloom: densidad de flores
    lapacho: { spread: 0.42, decay: 0.74, depth: 7, lift: 0.9, trunk: 0.30, bloom: 9, petal: 1 },
    jacaranda: { spread: 0.58, decay: 0.76, depth: 7, lift: 0.55, trunk: 0.26, bloom: 7, petal: 0.9 },
    flamboyan: { spread: 0.95, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 8, petal: 1.05, flat: true },
    leafy: { spread: 0.5, decay: 0.74, depth: 7, lift: 0.7, trunk: 0.28, bloom: 10, petal: 1.2, leaf: true },
    silhouette: { spread: 0.5, decay: 0.75, depth: 7, lift: 0.6, trunk: 0.28, bloom: 1.2, petal: 0.8 },
  };

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawSky(ctx, w, h, horizon, dark) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    if (dark) {
      sky.addColorStop(0, '#1d0f1f'); sky.addColorStop(0.45, '#6b1f1a');
      sky.addColorStop(0.8, '#d0521c'); sky.addColorStop(1, '#f0a03a');
    } else {
      sky.addColorStop(0, '#3b1d36'); sky.addColorStop(0.4, '#8c3a2c');
      sky.addColorStop(0.78, '#e07a2c'); sky.addColorStop(1, '#f6c46a');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);
  }

  function drawSun(ctx, cx, horizon, r) {
    const g = ctx.createLinearGradient(0, horizon - r, 0, horizon);
    g.addColorStop(0, '#ffd27a'); g.addColorStop(0.6, '#f59a32'); g.addColorStop(1, '#e0561c');
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, ctx.canvas.width, horizon); ctx.clip();
    ctx.fillStyle = 'rgba(255,210,130,0.18)';
    ctx.beginPath(); ctx.arc(cx, horizon, r * 1.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, horizon, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Franjas del horizonte, como las del logo.
  function drawGround(ctx, w, h, horizon) {
    const bands = [0.18, 0.38, 0.58, 0.78];
    const bh = (h - horizon) / (bands.length + 1);
    bands.forEach(function (o, i) {
      ctx.fillStyle = 'rgba(12,6,3,' + o + ')';
      ctx.fillRect(0, horizon + i * bh * 0.55, w, bh * 0.4);
    });
    ctx.fillStyle = '#140904';
    ctx.fillRect(0, horizon + bands.length * bh * 0.55, w, h);
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
      ctx.lineWidth = Math.max(0.6, wdt);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      if (d <= 0 || l < 3) { tips.push([x1, y1, l]); return; }
      if (d <= 3) tips.push([x1, y1, l]);
      const n = d > 4 ? 2 : (rand() < 0.55 ? 2 : 3);
      for (let i = 0; i < n; i++) {
        let na = a + (n === 2 ? (i === 0 ? -1 : 1) : (i - 1)) * form.spread * (0.6 + rand() * 0.8);
        // Tendencia a subir (lapacho) o a abrirse en horizontal (flamboyán).
        const k = form.lift * 0.15;
        na = na * (1 - k) + (-Math.PI / 2) * k;
        if (form.flat) na = Math.max(-Math.PI + 0.25, Math.min(-0.25, na));
        branch(x1, y1, l * (form.decay + (rand() - 0.5) * 0.12), na, wdt * 0.68, d - 1);
      }
    }
    // Tronco con una leve inclinación.
    const lean = (rand() - 0.5) * 0.12;
    const trunkTop = [x + Math.sin(lean) * len, y - Math.cos(lean) * len];
    ctx.strokeStyle = barkColor; ctx.lineCap = 'round';
    ctx.lineWidth = len * 0.11;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - len * 0.05, y - len * 0.5, trunkTop[0], trunkTop[1]); ctx.stroke();
    // Raíces
    ctx.lineWidth = len * 0.05;
    ctx.beginPath(); ctx.moveTo(x, y - len * 0.08); ctx.quadraticCurveTo(x - len * 0.2, y, x - len * 0.38, y + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - len * 0.08); ctx.quadraticCurveTo(x + len * 0.2, y, x + len * 0.4, y + 4); ctx.stroke();
    const firstLen = len * (form.flat ? 0.95 : 0.8);
    const starts = form.flat ? [-Math.PI / 2 - 0.85, -Math.PI / 2 + 0.85, -Math.PI / 2] : [-Math.PI / 2 - form.spread * 0.7, -Math.PI / 2 + form.spread * 0.7];
    starts.forEach(function (a) { branch(trunkTop[0], trunkTop[1], firstLen, a + lean, len * 0.075, form.depth - 1); });
    return tips;
  }

  // Estado de la animación de pétalos.
  let anim = null;

  function render(canvas, colorName, seed) {
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
    const horizon = h * 0.74;
    const narrow = w < 640;
    const treeX = narrow ? w * 0.5 : w * 0.66;
    const dark = tree.form === 'silhouette';
    drawSky(ctx, w, h, horizon, dark);
    drawSun(ctx, narrow ? w * 0.5 : w * 0.66, horizon, Math.min(w, h) * (narrow ? 0.34 : 0.3));

    const rand = rng(seed);
    const scale = Math.min(h * (narrow ? 0.135 : 0.155), w * (narrow ? 0.15 : 0.11)) * (form.flat && narrow ? 0.85 : 1);
    const bark = dark ? '#0b0604' : '#2a150a';
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
    if (tree.leaves) {
      tips.forEach(function (t) {
        for (let i = 0; i < 4; i++) {
          drawLeaf(ctx, t[0] + (rand() - 0.5) * 18, t[1] + (rand() - 0.5) * 12, 4 + rand() * 4,
            tree.leaves[Math.floor(rand() * tree.leaves.length)], rand() * Math.PI);
        }
      });
    }
    ctx.globalAlpha = dark ? 0.9 : 0.92;
    blossoms.forEach(function (b) {
      if (form.leaf) drawLeaf(ctx, b[0], b[1], b[2] * 1.15, b[3], b[4]);
      else drawFlower(ctx, b[0], b[1], b[2], b[3], b[4]);
    });
    ctx.globalAlpha = 1;
    drawGround(ctx, w, h, horizon);

    // Pétalos caídos en el suelo.
    for (let i = 0; i < 26; i++) {
      const x = treeX + (rand() - 0.5) * scale * 4.2;
      const y = horizon + 4 + rand() * (h - horizon) * 0.35;
      ctx.globalAlpha = 0.55;
      drawFlower(ctx, x, y, 1.6 + rand() * 1.2, tree.flowers[i % tree.flowers.length], rand() * 3);
    }
    ctx.globalAlpha = 1;

    startPetals(canvas, layer, blossoms, tree, horizon, dpr, w, h, form);
    return tree;
  }

  function startPetals(canvas, layer, blossoms, tree, horizon, dpr, w, h, form) {
    if (anim) cancelAnimationFrame(anim.raf);
    const out = canvas.getContext('2d');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.drawImage(layer, 0, 0);
    if (reduce || !blossoms.length) { anim = null; return; }

    const count = w < 500 ? 9 : 16;
    const petals = [];
    function spawn(p, initial) {
      const b = blossoms[Math.floor(Math.random() * blossoms.length)];
      p.x = b[0]; p.y = initial ? b[1] + Math.random() * (horizon - b[1]) : b[1];
      p.vy = 0.18 + Math.random() * 0.3; p.sway = Math.random() * Math.PI * 2;
      p.r = 1.6 + Math.random() * 1.8; p.c = b[3]; p.rot = Math.random() * 3;
      return p;
    }
    for (let i = 0; i < count; i++) petals.push(spawn({}, true));

    let visible = true;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }) : null;
    if (io) io.observe(canvas);

    anim = { raf: 0 };
    let last = 0;
    function frame(t) {
      anim.raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || t - last < 33) return;
      last = t;
      out.setTransform(1, 0, 0, 1, 0, 0);
      out.drawImage(layer, 0, 0);
      out.setTransform(dpr, 0, 0, dpr, 0, 0);
      out.globalAlpha = 0.85;
      petals.forEach(function (p) {
        p.sway += 0.03; p.y += p.vy; p.x += Math.sin(p.sway) * 0.35 + 0.08; p.rot += 0.02;
        if (p.y > horizon + 6) spawn(p, false);
        if (form.leaf) drawLeaf(out, p.x, p.y, p.r * 1.3, p.c, p.rot);
        else drawFlower(out, p.x, p.y, p.r, p.c, p.rot);
      });
      out.globalAlpha = 1;
    }
    anim.raf = requestAnimationFrame(frame);
  }

  // Flor sola en SVG, para el progreso del año y el tablero.
  function flowerSVG(colors, open, crown) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-12 -12 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS(ns, 'g');
    const s = open <= 0 ? 1 : 0.5 + 0.5 * open;
    g.setAttribute('transform', 'scale(' + s.toFixed(3) + ')');
    if (open <= 0) {
      const bud = document.createElementNS(ns, 'circle');
      bud.setAttribute('r', '3.6'); bud.setAttribute('fill', colors[0]); bud.setAttribute('opacity', '0.55');
      bud.setAttribute('stroke', 'rgba(60,30,10,.35)'); bud.setAttribute('stroke-width', '0.8');
      g.appendChild(bud);
    } else {
      for (let i = 0; i < 5; i++) {
        const p = document.createElementNS(ns, 'ellipse');
        p.setAttribute('stroke', 'rgba(60,30,10,.25)'); p.setAttribute('stroke-width', '0.6');
        const a = -90 + i * 72;
        p.setAttribute('cx', '0'); p.setAttribute('cy', '-5.6');
        p.setAttribute('rx', '4.2'); p.setAttribute('ry', '5.8');
        p.setAttribute('fill', colors[i % 2 ? 1 : 0]);
        p.setAttribute('transform', 'rotate(' + (a + 90) + ')');
        g.appendChild(p);
      }
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('r', crown ? '3.4' : '2.4');
      c.setAttribute('fill', crown ? '#E8B04A' : '#fff6dc');
      if (crown) { c.setAttribute('stroke', '#7a4a00'); c.setAttribute('stroke-width', '0.8'); }
      g.appendChild(c);
    }
    svg.appendChild(g);
    return svg;
  }

  window.SunsetTree = { TREES: TREES, render: render, flowerSVG: flowerSVG };
})();
