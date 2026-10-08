// Paisaje de la semana: cielo al atardecer, sol con franjas (como el logo) y el árbol
// en flor del color de la semana. Se dibuja con canvas para que la app siga liviana
// y funcione sin conexión. Los pétalos que caen respetan "reducir movimiento".
(function () {
  'use strict';

  // Árbol de cada color. form define la arquitectura de la copa.
  const TREES = {
    Lila: { ink: ['#B565C9', '#D58AD8'], name: 'Lapacho morado', sci: 'Handroanthus impetiginosus', form: 'lapacho',
      flowers: ['#B565C9', '#D58AD8', '#E9B6E6', '#9B4FB8'], leaves: ['#7E3A93', '#93489F'] },
    Azul: { ink: ['#6A6CC9', '#9AA0EC'], name: 'Jacarandá', sci: 'Jacaranda mimosifolia', form: 'jacaranda',
      flowers: ['#7B83E0', '#9AA0EC', '#6A6CC9', '#B7B9F2'], leaves: ['#4B4FA8', '#5A60B8'] },
    Rojo: { ink: ['#D42A18', '#EF5A44'], name: 'Flamboyán', sci: 'Delonix regia', form: 'flamboyan',
      flowers: ['#E2341D', '#D42A18', '#C81E14', '#EF4B2A'], leaves: ['#8E1410', '#A81C12'] },
    Amarillo: { ink: ['#E8A90C', '#F5C518'], name: 'Lapacho amarillo', sci: 'Handroanthus albus', form: 'lapacho',
      flowers: ['#F5C518', '#FFD84D', '#E8A90C', '#FFE58A'], leaves: ['#B8840A', '#C9940C'] },
    Blanco: { ink: ['#E9CFDB', '#FBF1F5'], name: 'Lapacho blanco', sci: 'Tabebuia roseoalba', form: 'lapacho',
      flowers: ['#FFFFFF', '#FBF4F6', '#F3DCE6', '#FFF6E8'], leaves: ['#D9C3CC', '#E6D3DA'] },
    Verde: { ink: ['#4E9A3B', '#86C25A'], name: 'Árbol en hoja nueva', sci: '', form: 'leafy',
      flowers: ['#4E9A3B', '#79B84E', '#A9D46F', '#2F6E2C'], leaves: ['#2C5E24', '#3A7330'] },
    Negro: { ink: ['#2A2420', '#5A4C42'], name: 'Silueta al atardecer', sci: '', form: 'silhouette',
      flowers: ['#0D0705', '#140B07', '#1C120C', '#24170F'], leaves: ['#060302', '#0A0504'] },
  };

  const FORMS = {
    // spread: apertura entre ramas · decay: acortamiento por nivel · depth: niveles
    // lift: cuánto tienden a subir · trunk: largo del tronco relativo · bloom: densidad de flores
    lapacho: { spread: 0.72, decay: 0.77, depth: 7, lift: 0.4, trunk: 0.30, bloom: 9, petal: 1.05, wide: 0.88 },
    jacaranda: { spread: 0.82, decay: 0.78, depth: 7, lift: 0.28, trunk: 0.26, bloom: 8, petal: 1, wide: 0.92 },
    flamboyan: { spread: 0.95, decay: 0.79, depth: 6, lift: 0.18, trunk: 0.22, bloom: 8, petal: 1.05, flat: true },
    leafy: { spread: 0.74, decay: 0.77, depth: 7, lift: 0.4, trunk: 0.28, bloom: 10, petal: 1.25, leaf: true, wide: 0.86 },
    silhouette: { spread: 0.76, decay: 0.77, depth: 7, lift: 0.38, trunk: 0.28, bloom: 10, petal: 1.3, leaf: true, wide: 0.9 },
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
      sky.addColorStop(0, '#120a0e'); sky.addColorStop(0.6, '#3a1614'); sky.addColorStop(1, '#8a3a1c');
    } else {
      sky.addColorStop(0, '#4a2238'); sky.addColorStop(0.55, '#b8502e'); sky.addColorStop(1, '#f2b45e');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);
  }

  // Sol como el del logo: disco con franjas en la mitad de abajo.
  function drawSun(ctx, cx, horizon, r, dark) {
    const g = ctx.createLinearGradient(0, horizon - r, 0, horizon);
    if (dark) { g.addColorStop(0, '#c9773a'); g.addColorStop(1, '#7a2a12'); }
    else { g.addColorStop(0, '#ffd27a'); g.addColorStop(0.55, '#f7a646'); g.addColorStop(1, '#ec6a2c'); }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, ctx.canvas.width, horizon); ctx.clip();
    ctx.beginPath(); ctx.arc(cx, horizon, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, horizon - r, r * 2, r);
    // Franjas: líneas del color del cielo, cada vez más gruesas hacia el horizonte.
    ctx.fillStyle = dark ? '#5a2416' : '#e08a44';
    for (let i = 0; i < 4; i++) {
      const y = horizon - r * (0.42 - i * 0.1);
      ctx.fillRect(cx - r, y, r * 2, r * (0.018 + i * 0.012));
    }
    ctx.restore();
  }

  function drawGround(ctx, w, h, horizon) {
    const g = ctx.createLinearGradient(0, horizon, 0, h);
    g.addColorStop(0, '#24110a'); g.addColorStop(1, '#0e0604');
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = 'rgba(255,190,120,0.18)';
    ctx.fillRect(0, horizon, w, 1);
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
    const top = [x + Math.sin(lean) * len, y - Math.cos(lean) * len];
    const ctrl = [x - len * 0.07 + (rand() - 0.5) * len * 0.08, y - len * 0.5];
    const baseW = len * 0.44, topW = len * 0.25;
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
    drawSun(ctx, narrow ? w * 0.5 : w * 0.66, horizon, Math.min(w, h) * (narrow ? 0.34 : 0.3), dark);

    const rand = rng(seed);
    const scale = Math.min(h * (narrow ? 0.12 : 0.135), w * (narrow ? 0.15 : 0.11)) * (form.flat && narrow ? 0.85 : 1);
    const bark = dark ? '#070403' : '#2a150a';
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
    ctx.globalAlpha = dark ? 0.9 : 0.92;
    blossoms.forEach(function (b) {
      if (form.leaf) drawLeaf(ctx, b[0], b[1], b[2] * 1.15, b[3], b[4]);
      else drawFlower(ctx, b[0], b[1], b[2], b[3], b[4]);
    });
    ctx.globalAlpha = 1;
    drawGround(ctx, w, h, horizon);

    // Pétalos caídos en el suelo.
    for (let i = 0; i < 10; i++) {
      const x = treeX + (rand() - 0.5) * scale * 2.6;
      const y = horizon + 3 + rand() * (h - horizon) * 0.12;
      ctx.globalAlpha = 0.45;
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

  // Marca del logo: sol con franjas y árbol de bronce sin hojas, con raíces que salen del círculo.
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

    // Árbol de bronce.
    const form = { spread: 0.5, decay: 0.75, depth: S > 120 ? 8 : 7, lift: 0.75, bloom: 0, petal: 1, wide: 0.62 };
    const rand = rng(11);
    const base = cy + R * 0.93;
    const len = R * 0.37;
    const tips = growTree(ctx, rand, cx, base, len, form, '#55301A');
    // Copa tupida: hojas en tonos de bronce, primero las oscuras (fondo) y luego las claras.
    const leaves = [];
    const lf = S < 120 ? 1.9 : 1;   // a tamaño chico, hojas más grandes para que la copa se vea llena
    tips.forEach(function (t) {
      const n = 8 + Math.floor(rand() * 6);
      for (let i = 0; i < n; i++) {
        const spread = Math.max(R * 0.04, t[2] * 0.75);
        // Más hojas hacia arriba: la copa crece en alto.
        leaves.push([t[0] + (rand() - 0.5) * spread * 1.5, t[1] - rand() * spread * 2.4 + spread * 0.3,
          R * (0.028 + rand() * 0.03) * lf, rand() * Math.PI, rand()]);
      }
    });
    // Cúpula de hojas sobre la copa, para que gane altura.
    let minX = Infinity, maxX = -Infinity, minY = Infinity;
    tips.forEach(function (t) { minX = Math.min(minX, t[0]); maxX = Math.max(maxX, t[0]); minY = Math.min(minY, t[1]); });
    const domeCx = (minX + maxX) / 2, domeRx = (maxX - minX) / 2 * 0.9, domeRy = R * 0.5, domeCy = minY + R * 0.18;
    for (let i = 0; i < (S < 120 ? 90 : 380); i++) {
      const a = Math.PI + rand() * Math.PI, d = Math.sqrt(rand());
      leaves.push([domeCx + Math.cos(a) * domeRx * d, domeCy + Math.sin(a) * domeRy * d,
        R * (0.028 + rand() * 0.03) * lf, rand() * Math.PI, rand()]);
    }
    const shades = ['#2E180B', '#3D2210', '#4D2C15', '#5E381B', '#704422'];
    leaves.sort(function (a, b) { return a[4] - b[4]; }).forEach(function (l) {
      drawLeaf(ctx, l[0], l[1], l[2], shades[Math.min(4, Math.floor(l[4] * 5))], l[3]);
    });
    // Raíces largas que se extienden fuera del círculo.
    ctx.strokeStyle = '#55301A';
    [[-1, 0.85, 0.06], [1, 0.82, 0.06], [-1, 0.55, 0.04], [1, 0.6, 0.04]].forEach(function (r) {
      ctx.lineWidth = Math.max(0.6, len * r[2]);
      ctx.beginPath(); ctx.moveTo(cx, base - len * 0.04);
      ctx.quadraticCurveTo(cx + r[0] * R * r[1] * 0.45, base + R * 0.02, cx + r[0] * R * r[1], base + R * 0.07);
      ctx.stroke();
    });
  }

  window.SunsetTree = { TREES: TREES, render: render, flowerSVG: flowerSVG, logo: logo };
})();
