(function () {
  'use strict';

  let YEARS = [];
  const STORE_KEY = 'sunset_v2';
  const SYNC_KEY = 'sunset_sync_key';       // la clave de acceso; también autoriza la sincronización
  const CONTENT_KEY = 'sunset_content';     // contenido del año guardado en el dispositivo (para abrir sin conexión)
  const UNDO_KEY = 'sunset_undo';           // estado anterior a la última restauración
  const DAY_MS = 864e5;
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const DAY_CARDS = [
    { day: 1, key: 'regalo', label: '@Regalo', icon: 'gift' },
    { day: 2, key: 'pensamiento', label: '@Pensamiento', icon: 'bulb' },
    { day: 3, key: 'desafio', label: '@Desafío', icon: 'flag' },
    { day: 4, key: 'consejo', label: '@Consejo', icon: 'compass' },
    { day: 5, key: 'frase', label: '@Frase', icon: 'quote' },
    { day: 6, key: 'sabado', label: 'Evaluación', icon: 'check' },
  ];

  // ── Utilidades ──
  const $ = (id) => document.getElementById(id);
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(name, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ico' + (cls ? ' ' + cls : ''));
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // Días enteros desde una fecha de referencia, sin que el horario de verano cambie el resultado.
  const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  function fmtDate(d) { return d.getDate() + ' de ' + MONTHS[d.getMonth()]; }
  function debounce(fn, ms) {
    let t = null;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  // ── Años ──
  // Cada año trae su planilla: semanas, tablero 7×7, preguntas y colores.
  // Colores: el de la columna, con contraste suficiente sobre fondo claro.
  // Negro usa negro real; Blanco usa su gris pizarra (el blanco no se lee sobre crema).
  function prepare(data) {
  YEARS = data.years;
  YEARS.forEach(function (Y) {
    Y.start = new Date(Y.firstSunday + 'T00:00:00');
    Y.themes = Y.colors.map(function (c) {
      const [p0, p1, p2] = c.palette;
      const strong = luminance(p0) > 0.6 ? p1 : p0;
      const soft = luminance(p2) > 0.75 && c.name !== 'Negro' ? p2 : '#EFEDE8';
      return { name: c.name, emoji: c.emoji, strong: strong, mid: p1, soft: soft };
    });
    // Semanas en que se evalúa cada palabra.
    Y.evalWeeks = {};
    Y.weeks.forEach(function (wk) {
      activeWords(Y, wk.week).forEach(function (a) { (Y.evalWeeks[a.word] = Y.evalWeeks[a.word] || []).push(wk.week); });
    });
  });
  }
  const yearIndex = (year) => YEARS.findIndex((Y) => Y.year === year);
  function dateOf(Y, week, day) { const d = new Date(Y.start); d.setDate(d.getDate() + (week - 1) * 7 + day); return d; }

  // Año y semana de una fecha. Antes del primer año → su semana 1; después del último → su última semana.
  function locateDate(d) {
    const t = utcDay(d);
    for (const Y of YEARS) {
      const week = Math.floor((t - utcDay(Y.start)) / DAY_MS / 7) + 1;
      if (week >= 1 && week <= Y.weeks.length) return { Y: Y, week: week, inRange: true };
    }
    const first = YEARS[0], last = YEARS[YEARS.length - 1];
    return t < utcDay(first.start) ? { Y: first, week: 1, inRange: false, before: true }
      : { Y: last, week: last.weeks.length, inRange: false };
  }

  // ── Rotación ──
  // Cada semana trae su fila de inicio (phase) y columna/color (col): palabra_k = board[(phase+k) % 7][col].
  // k = 0..2 son las 3 palabras activas; k = 3..6 completan las 7 en juego.
  function rotation(Y, week) {
    const wk = Y.weeks[week - 1];
    const words = [];
    for (let k = 0; k < 7; k++) {
      const dim = (wk.phase + k) % 7;
      words.push({ word: Y.board[dim][wk.col], dim: dim, col: wk.col });
    }
    return words;
  }
  function activeWords(Y, week) { return rotation(Y, week).slice(0, 3); }

  // ── Estado ──
  // Todo lo que registra el usuario vive en entries[clave] = { v: valor, t: milisegundos }.
  // Claves (por año y semana):
  //   AAAA/wN/a/Palabra   respuestas [5 valores de 1 a 5 o null]
  //   AAAA/wN/c/Palabra   comentario sobre la palabra
  //   AAAA/wN/d0..d6      registro del día (0 = domingo)
  //   AAAA/wN/maestria    palabra confirmada como maestría de la semana
  //   AAAA/wN/funciono    ¿qué funcionó? ¿qué mejorar?
  //   AAAA/wN/intencion   intención para la próxima semana
  // Al sincronizar, por cada clave gana la entrada más reciente.
  let state = { entries: {}, welcomed: false };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* almacenamiento no disponible */ }

  const k = (Y, week, rest) => Y.year + '/w' + week + '/' + rest;
  function getV(key, fallback) { const e = state.entries[key]; return e && e.v != null ? e.v : fallback; }
  function setV(key, value) {
    state.entries[key] = { v: value, t: Date.now() };
    save();
    scheduleSync();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* sin persistencia */ }
  }
  function mergeEntries(base, incoming) {
    const out = Object.assign({}, base);
    let changed = false;
    Object.keys(incoming || {}).forEach(function (key) {
      const e = incoming[key];
      if (!e || typeof e.t !== 'number') return;
      if (!out[key] || e.t > out[key].t) { out[key] = e; changed = true; }
    });
    return { entries: out, changed: changed };
  }

  function getAnswers(Y, week, word) { return getV(k(Y, week, 'a/' + word), [null, null, null, null, null]); }
  function setAnswer(Y, week, word, qi, value) {
    const a = getAnswers(Y, week, word).slice();
    a[qi] = a[qi] === value ? null : value;
    setV(k(Y, week, 'a/' + word), a);
  }

  // Puntaje de una palabra en una semana: suma / 25 (las no respondidas cuentan 0).
  function wordScore(Y, week, word) {
    return getAnswers(Y, week, word).reduce((s, v) => s + (v || 0), 0) / 25;
  }
  function wordAnswered(Y, week, word) {
    return getAnswers(Y, week, word).filter((v) => v != null).length;
  }
  function weekScore(Y, week) {
    return activeWords(Y, week).reduce((s, w) => s + wordScore(Y, week, w.word), 0) / 3;
  }
  function weekCompletion(Y, week) {
    return activeWords(Y, week).reduce((s, w) => s + wordAnswered(Y, week, w.word), 0) / 15;
  }
  // Maestría acumulada en el año: promedio del puntaje en las semanas en que la palabra tuvo respuestas.
  function mastery(Y, word) {
    const scored = (Y.evalWeeks[word] || []).filter((w) => wordAnswered(Y, w, word) > 0);
    if (!scored.length) return 0;
    return scored.reduce((s, w) => s + wordScore(Y, w, word), 0) / scored.length;
  }
  // Semanas en que la palabra fue confirmada como maestría de la semana.
  function crowns(Y, word) {
    return (Y.evalWeeks[word] || []).filter((w) => getV(k(Y, w, 'maestria'), '') === word).length;
  }
  // Sugerencia: la palabra activa con mayor puntaje esa semana.
  function suggestedMastery(Y, week) {
    let best = null;
    activeWords(Y, week).forEach(function (a) {
      const s = wordScore(Y, week, a.word);
      if (s > 0 && (!best || s > best.s)) best = { word: a.word, s: s };
    });
    return best && best.word;
  }
  function nextEvalWeek(Y, word, from) {
    const list = Y.evalWeeks[word] || [];
    return list.find((w) => w >= from) || list[0];
  }

  // ── Vista ──
  let now, TODAY, Y, viewing;
  let openWord = null;

  const isCurrent = () => TODAY.inRange && Y === TODAY.Y && viewing === TODAY.week;
  const todayIndex = () => (isCurrent() ? now.getDay() : -1);

  // Área de texto que guarda sola mientras se escribe.
  function noteField(key, placeholder, rows) {
    const ta = el('textarea', 'note');
    ta.rows = rows || 2;
    ta.placeholder = placeholder;
    ta.value = getV(key, '');
    const commit = debounce(function () { setV(key, ta.value); }, 500);
    ta.addEventListener('input', commit);
    ta.addEventListener('blur', function () { if (ta.value !== getV(key, '')) setV(key, ta.value); });
    return ta;
  }

  const treeOf = (colorName) => window.SunsetTree.TREES[colorName] || window.SunsetTree.TREES.Lila;
  let shown = '';
  function applyTheme() {
    const col = Y.weeks[viewing - 1].col;
    const t = Y.themes[col];
    const root = document.documentElement.style;
    root.setProperty('--wk', t.strong);
    root.setProperty('--wk-mid', t.mid);
    root.setProperty('--wk-soft', t.soft);
    // Paisaje de la semana: una imagen fija por color (ancha para pantallas grandes, alta para celulares).
    if (shown !== t.name) {
      shown = t.name;
      const base = 'images/trees/' + t.name;
      $('hero').style.backgroundColor = t.name === 'Negro' ? '#120a0e' : '#4a2238';
      $('heroWide').srcset = base + '-wide.webp';
      $('heroImg').src = base + '-tall.webp';
    }
  }
  window.addEventListener('resize', debounce(function () { if (Y) renderYear(); }, 200));

  function renderHeader() {
    const h = $('headerDate');
    h.textContent = WEEKDAYS[now.getDay()] + ' ' + fmtDate(now);
    const sub = TODAY.inRange ? 'Sunset ' + TODAY.Y.year + ' · semana ' + TODAY.week + ' de ' + TODAY.Y.weeks.length
      : TODAY.before ? 'Sunset ' + TODAY.Y.year + ' empieza el ' + fmtDate(TODAY.Y.start)
        : 'Falta cargar la planilla del año siguiente';
    h.appendChild(el('small', null, sub));
  }

  function renderWeekBar() {
    const wk = Y.weeks[viewing - 1];
    const t = Y.themes[wk.col];
    const yi = yearIndex(Y.year);
    const tree = treeOf(t.name);
    $('weekNum').textContent = 'Semana ' + viewing + (YEARS.length > 1 ? ' · ' + Y.year : '');
    $('weekSub').textContent = t.name + ' · ' + wk.dates;
    const tn = $('treeName');
    tn.textContent = tree.name;
    if (tree.sci) tn.appendChild(el('i', null, tree.sci));
    $('prevWeek').disabled = viewing <= 1 && yi === 0;
    $('nextWeek').disabled = viewing >= Y.weeks.length && yi === YEARS.length - 1;
    $('todayBtn').hidden = !TODAY.inRange || isCurrent();
    $('yearTitle').textContent = 'Progreso ' + Y.year;
  }

  function dayHead(day, label, iconName) {
    const head = el('div', 'card-day');
    head.appendChild(icon(iconName));
    head.appendChild(document.createTextNode(WEEKDAYS[day] + ' ' + dateOf(Y, viewing, day).getDate() + ' · ' + label));
    if (todayIndex() === day) head.appendChild(el('span', 'badge', 'Hoy'));
    return head;
  }

  function renderSunday() {
    const wk = Y.weeks[viewing - 1];
    const card = $('sunday');
    card.innerHTML = '';
    card.classList.toggle('is-today', todayIndex() === 0);
    card.appendChild(dayHead(0, 'Título', 'sun'));
    card.appendChild(el('h1', 'sunday-title', wk.title));
    card.appendChild(el('p', 'sunday-hook', wk.hook));

    const btn = el('button', 'story-btn');
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(document.createTextNode('Historia interna'));
    btn.appendChild(icon('down'));
    const story = el('div', 'story');
    story.hidden = true;
    story.appendChild(el('p', null, wk.story));
    if (wk.image) story.appendChild(el('p', 'story-image', 'Imagen sugerida: ' + wk.image));
    if (wk.puente) {
      const p = wk.puente;
      story.appendChild(el('p', 'story-image', 'El Puente · ' + p.stage + ' · ' + p.axis + ' · Factor ' + p.factor));
      story.appendChild(el('p', 'story-image', p.note));
    }
    btn.addEventListener('click', function () {
      story.hidden = !story.hidden;
      btn.setAttribute('aria-expanded', String(!story.hidden));
    });
    card.appendChild(btn);
    card.appendChild(story);
    card.appendChild(noteField(k(Y, viewing, 'd0'), 'Registro del domingo…'));
  }

  function renderDays() {
    const wk = Y.weeks[viewing - 1];
    const wrap = $('days');
    wrap.innerHTML = '';
    DAY_CARDS.forEach(function (d) {
      const card = el('article', 'card day-' + d.day);
      card.classList.toggle('is-today', todayIndex() === d.day);
      card.appendChild(dayHead(d.day, d.label, d.icon));
      if (d.key === 'sabado') {
        const ol = el('ol', 'sat-list');
        wk.sabado.forEach((q) => ol.appendChild(el('li', null, q)));
        card.appendChild(ol);
      } else {
        card.appendChild(el('p', 'card-text', wk[d.key]));
      }
      card.appendChild(noteField(k(Y, viewing, 'd' + d.day), 'Registro del ' + WEEKDAYS[d.day].toLowerCase() + '…'));
      wrap.appendChild(card);
    });
  }

  function renderEvaluation() {
    const score = weekScore(Y, viewing);
    const done = weekCompletion(Y, viewing);
    const pct = $('evalPct');
    if (done === 0) pct.textContent = '—';
    else { pct.textContent = Math.round(score * 100); pct.appendChild(el('small', null, '%')); }
    $('evalPctLabel').textContent = done === 0 ? 'Sin responder todavía'
      : done === 1 ? 'Autoevaluación completa' : Math.round(done * 15) + ' de 15 preguntas respondidas';

    const rot = rotation(Y, viewing);
    const inPlay = $('inPlay');
    inPlay.innerHTML = '';
    inPlay.appendChild(document.createTextNode('En juego esta semana: '));
    rot.forEach(function (r, i) {
      inPlay.appendChild(i < 3 ? el('b', null, r.word) : document.createTextNode(r.word));
      if (i < 6) inPlay.appendChild(document.createTextNode(' · '));
    });

    const chips = $('chips');
    chips.innerHTML = '';
    rot.slice(0, 3).forEach(function (r) {
      const c = el('button', 'chip');
      c.setAttribute('aria-expanded', String(openWord === r.word));
      const label = el('span');
      label.appendChild(el('span', 'chip-dim', Y.dimensions[r.dim]));
      label.appendChild(document.createElement('br'));
      label.appendChild(document.createTextNode(r.word));
      c.appendChild(label);
      c.appendChild(el('span', 'chip-pct', Math.round(wordScore(Y, viewing, r.word) * 100) + '%'));
      c.addEventListener('click', function () {
        openWord = openWord === r.word ? null : r.word;
        renderEvaluation();
      });
      chips.appendChild(c);
    });

    const qs = $('questions');
    qs.innerHTML = '';
    if (!openWord) return;
    const word = openWord;
    const answers = getAnswers(Y, viewing, word);
    (Y.questions[word] || []).forEach(function (q, qi) {
      const box = el('div', 'q');
      box.appendChild(el('p', 'q-text', q));
      const scale = el('div', 'q-scale');
      for (let v = 1; v <= 5; v++) {
        const b = el('button', null, String(v));
        b.setAttribute('aria-pressed', String(answers[qi] === v));
        b.setAttribute('aria-label', v + ' de 5');
        b.addEventListener('click', function () {
          setAnswer(Y, viewing, word, qi, v);
          renderEvaluation();
          renderClosing();
          renderYear();
          renderBoard();
        });
        scale.appendChild(b);
      }
      box.appendChild(scale);
      const ends = el('div', 'q-ends');
      ends.appendChild(el('span', null, 'Nunca'));
      ends.appendChild(el('span', null, 'Siempre'));
      box.appendChild(ends);
      qs.appendChild(box);
    });
    qs.appendChild(noteField(k(Y, viewing, 'c/' + word), 'Comentario sobre ' + word + '…', 3));
  }

  function renderClosing() {
    const wrap = $('closing');
    wrap.innerHTML = '';
    const confirmed = getV(k(Y, viewing, 'maestria'), '');
    const suggested = suggestedMastery(Y, viewing);

    wrap.appendChild(el('div', 'field-label', 'Maestría de la semana'));
    wrap.appendChild(el('p', 'field-hint', confirmed ? 'Confirmada. Tocá otra palabra para cambiarla, o la misma para quitarla.'
      : suggested ? 'Sugerida: ' + suggested + ' (la de mayor puntaje). Tocá una palabra para confirmarla.'
        : 'Respondé la autoevaluación para ver la sugerencia, o elegí directamente.'));
    const opts = el('div', 'mastery-opts');
    activeWords(Y, viewing).forEach(function (a) {
      const b = el('button', 'mastery-opt');
      b.setAttribute('aria-pressed', String(confirmed === a.word));
      if (!confirmed && suggested === a.word) b.classList.add('is-suggested');
      if (confirmed === a.word) b.appendChild(icon('crown'));
      b.appendChild(document.createTextNode(a.word));
      b.appendChild(el('span', 'chip-pct', Math.round(wordScore(Y, viewing, a.word) * 100) + '%'));
      b.addEventListener('click', function () {
        setV(k(Y, viewing, 'maestria'), confirmed === a.word ? '' : a.word);
        renderClosing();
        renderYear();
        renderBoard();
      });
      opts.appendChild(b);
    });
    wrap.appendChild(opts);

    wrap.appendChild(el('div', 'field-label', '¿Qué funcionó? ¿Qué mejorar?'));
    wrap.appendChild(noteField(k(Y, viewing, 'funciono'), 'Mirando la semana completa…', 3));
    wrap.appendChild(el('div', 'field-label', 'Intención para la próxima semana'));
    wrap.appendChild(noteField(k(Y, viewing, 'intencion'), 'La semana que viene quiero…', 2));
  }

  // Progreso del año: ramas con una flor por semana. La flor se abre según lo respondido.
  function renderYear() {
    const wrap = $('yearGrid');
    wrap.innerHTML = '';
    const per = wrap.clientWidth && wrap.clientWidth < 560 ? 7 : 13;
    for (let start = 0; start < Y.weeks.length; start += per) {
      const row = el('div', 'branch');
      row.style.setProperty('--per', per);
      const ns = 'http://www.w3.org/2000/svg';
      const line = document.createElementNS(ns, 'svg');
      line.setAttribute('class', 'branch-line');
      line.setAttribute('viewBox', '0 0 100 10');
      line.setAttribute('preserveAspectRatio', 'none');
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M0 6 C 20 3, 35 8, 50 5 S 80 3, 100 6');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      line.appendChild(path);
      row.appendChild(line);
      Y.weeks.slice(start, start + per).forEach(function (wk) {
        const t = Y.themes[wk.col];
        const done = weekCompletion(Y, wk.week);
        const m = getV(k(Y, wk.week, 'maestria'), '');
        const b = el('button', 'yw');
        b.setAttribute('aria-label', 'Semana ' + wk.week + ', ' + wk.dates + ', ' + Math.round(done * 100) + '% respondido' + (m ? ', maestría ' + m : ''));
        b.title = 'Semana ' + wk.week + ' · ' + treeOf(t.name).name + ' · ' + Math.round(done * 100) + '%' + (m ? ' · Maestría: ' + m : '');
        b.appendChild(window.SunsetTree.flowerSVG(treeOf(t.name).ink, done, !!m));
        b.appendChild(el('span', null, String(wk.week)));
        if (wk.week === viewing) b.classList.add('is-viewing');
        if (TODAY.inRange && Y === TODAY.Y && wk.week === TODAY.week) b.classList.add('is-current');
        b.addEventListener('click', function () { goTo(Y, wk.week); });
        row.appendChild(b);
      });
      wrap.appendChild(row);
    }
  }
  $('yearFold').addEventListener('toggle', function () { if (this.open) renderYear(); });

  function champion(words) {
    let best = null;
    words.forEach(function (w) {
      const m = mastery(Y, w);
      if (m > 0 && (!best || m > best.m)) best = { word: w, m: m };
    });
    return best;
  }

  function renderBoard() {
    const board = $('board');
    board.innerHTML = '';
    const champCell = function (best, crown) {
      const sq = el('div', 'sq champ' + (crown ? ' crown' : ''));
      const lbl = el('span', 'lbl', best ? best.word : '—');
      if (best) lbl.appendChild(el('small', null, Math.round(best.m * 100) + '%'));
      sq.appendChild(lbl);
      sq.title = crown ? 'Campeona general' : 'Campeona de la línea';
      return sq;
    };
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r < 7 && c < 7) {
          const word = Y.board[r][c];
          const m = mastery(Y, word);
          const n = crowns(Y, word);
          const t = Y.themes[c];
          const sq = el('button', 'sq ' + ((r + c) % 2 ? 'dark' : 'light'));
          const bloom = el('span', 'bloom');
          bloom.appendChild(window.SunsetTree.flowerSVG(treeOf(t.name).ink, m, n > 0));
          sq.appendChild(bloom);
          const lbl = el('span', 'lbl', word);
          if (m > 0) lbl.appendChild(el('small', null, (m > 0 ? Math.round(m * 100) + '%' : '') + (n > 1 ? ' ×' + n : '')));
          sq.appendChild(lbl);
          const next = nextEvalWeek(Y, word, viewing);
          sq.title = word + ' · ' + Y.dimensions[r] + ' · ' + t.name + (n ? ' · maestría ' + n + ' vez/veces' : '') + ' · próxima evaluación: semana ' + next;
          sq.addEventListener('click', function () { goTo(Y, next); });
          board.appendChild(sq);
        } else if (r < 7) {
          board.appendChild(champCell(champion(Y.board[r]), false));
        } else if (c < 7) {
          board.appendChild(champCell(champion(Y.board.map((row) => row[c])), false));
        } else {
          board.appendChild(champCell(champion([].concat.apply([], Y.board)), true));
        }
      }
    }
    const legend = $('boardLegend');
    legend.innerHTML = '';
    Y.themes.forEach(function (t) {
      const s = el('span');
      const i = el('i');
      i.style.background = treeOf(t.name).ink[0];
      s.appendChild(i);
      s.appendChild(document.createTextNode(t.name + ' · ' + treeOf(t.name).name));
      legend.appendChild(s);
    });
    legend.appendChild(el('span', null, 'Centro dorado = fue maestría de la semana'));
  }

  function render() {
    applyTheme();
    renderWeekBar();
    renderSunday();
    renderDays();
    renderEvaluation();
    renderClosing();
    renderYear();
    renderBoard();
  }

  function goTo(year, week) {
    Y = year;
    viewing = Math.min(Y.weeks.length, Math.max(1, week));
    openWord = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Avanza o retrocede una semana, pasando de un año al otro.
  function step(delta) {
    const yi = yearIndex(Y.year);
    const target = viewing + delta;
    if (target < 1 && yi > 0) goTo(YEARS[yi - 1], YEARS[yi - 1].weeks.length);
    else if (target > Y.weeks.length && yi < YEARS.length - 1) goTo(YEARS[yi + 1], 1);
    else goTo(Y, target);
  }

  // ── Toast ──
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ── Acceso y sincronización (Netlify) ──
  // Una sola clave: abre la app (entrega el contenido del año) y autoriza la sincronización.
  function syncKey() { try { return localStorage.getItem(SYNC_KEY) || ''; } catch (e) { return ''; } }
  function setSyncStatus(text, kind) {
    const st = $('syncStatus');
    st.textContent = text;
    st.className = 'sync-status' + (kind ? ' is-' + kind : '');
  }
  const authHeaders = () => ({ 'x-sunset-key': syncKey() });

  let syncing = false, syncAgain = false;
  async function sync() {
    const key = syncKey();
    if (!key || !Y || location.protocol === 'file:') return;
    if (syncing) { syncAgain = true; return; }
    syncing = true;
    setSyncStatus('Sincronizando…');
    try {
      const resp = await fetch('/api/sync', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({ entries: state.entries }),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 401) { logout('La clave cambió. Escríbela de nuevo.'); return; }
      if (!resp.ok) throw new Error(body.error || 'Error ' + resp.status);
      const res = mergeEntries(state.entries, body.entries);
      state.entries = res.entries;
      save();
      // No redibujar mientras se escribe: se perdería el foco del campo.
      if (res.changed && !(document.activeElement && document.activeElement.tagName === 'TEXTAREA')) render();
      setSyncStatus('Sincronizado ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), 'ok');
    } catch (e) {
      setSyncStatus(navigator.onLine === false ? 'Sin conexión: se guardó en este dispositivo' : 'No se pudo sincronizar: ' + e.message, 'error');
    } finally {
      syncing = false;
      if (syncAgain) { syncAgain = false; sync(); }
    }
  }
  const scheduleSync = debounce(sync, 1500);

  function renderSyncPanel() {
    const on = !!syncKey();
    $('syncHint').textContent = on
      ? 'Cada cambio se guarda en línea a los pocos segundos y aparece igual en tus otros dispositivos.'
      : 'Esta copia no está conectada: lo que registres queda solo en este dispositivo.';
    $('syncNow').hidden = !on;
    $('logoutBtn').hidden = !on;
    $('backupsBtn').hidden = !on;
    if (!on) setSyncStatus('Solo en este dispositivo');
  }

  // ── Pantalla de clave ──
  function readCached() {
    try { return JSON.parse(localStorage.getItem(CONTENT_KEY)); } catch (e) { return null; }
  }
  async function fetchContent(key) {
    let resp;
    try { resp = await fetch('/api/content', { headers: { 'x-sunset-key': key } }); }
    catch (e) { throw new Error(location.protocol === 'file:' ? 'Abrí la app desde su dirección en internet.' : 'No hay conexión con el servidor.'); }
    if (resp.status === 401) { const err = new Error('Clave incorrecta.'); err.code = 401; throw err; }
    if (!resp.ok) throw new Error('El servidor respondió ' + resp.status + '.');
    return resp.json();
  }
  function showLock(message) {
    $('lock').hidden = false;
    $('lockError').textContent = message || '';
    $('lockInput').value = '';
    setTimeout(function () { $('lockInput').focus(); }, 50);
  }
  function logout(message) {
    try { localStorage.removeItem(SYNC_KEY); localStorage.removeItem(CONTENT_KEY); } catch (e) { /* sin persistencia */ }
    renderSyncPanel();
    showLock(message);
  }
  $('lockForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const key = $('lockInput').value.trim();
    if (!key) return;
    const btn = $('lockBtn');
    btn.disabled = true; btn.textContent = 'Abriendo…'; $('lockError').textContent = '';
    try {
      const data = await fetchContent(key);
      try { localStorage.setItem(SYNC_KEY, key); localStorage.setItem(CONTENT_KEY, JSON.stringify(data)); } catch (err) { /* sin persistencia */ }
      $('lock').hidden = true;
      boot(data);
    } catch (err) {
      $('lockError').textContent = err.message;
      $('lockInput').select();
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
  // Con la clave y el contenido ya guardados, la app abre sin conexión y actualiza el contenido por detrás.
  async function refreshContent() {
    try {
      const data = await fetchContent(syncKey());
      const text = JSON.stringify(data);
      if (text === localStorage.getItem(CONTENT_KEY)) return;
      try { localStorage.setItem(CONTENT_KEY, text); } catch (e) { /* sin persistencia */ }
      const year = Y.year;
      prepare(data);
      TODAY = locateDate(now);
      Y = YEARS[yearIndex(year)] || TODAY.Y;
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
      render();
    } catch (e) {
      if (e.code === 401) logout('La clave cambió. Escríbela de nuevo.');
    }
  }

  // ── Confirmaciones dentro de la página ──
  // actions: [{ label, value, primary }] → resuelve con el value elegido (o null si se cancela)
  function ask(title, text, actions) {
    return new Promise(function (resolve) {
      $('askTitle').textContent = title;
      $('askText').textContent = text;
      const box = $('askActions');
      box.innerHTML = '';
      const close = (value) => { $('ask').hidden = true; resolve(value); };
      actions.concat([{ label: 'Cancelar', value: null }]).forEach(function (a) {
        const b = el('button', 'btn' + (a.primary ? ' primary' : ''), a.label);
        b.addEventListener('click', () => close(a.value));
        box.appendChild(b);
      });
      $('ask').hidden = false;
      box.firstChild.focus();
    });
  }

  // ── Restaurar ──
  // Una restauración escribe cada dato con la hora actual (y borra los que no estaban en la copia),
  // así gana también sobre otros dispositivos al sincronizar. Antes se guarda el estado actual para poder deshacer.
  function readUndo() { try { return JSON.parse(localStorage.getItem(UNDO_KEY)); } catch (e) { return null; } }
  function renderUndo() { $('undoBtn').hidden = !readUndo(); }
  function applySnapshot(entries, isUndo) {
    const prev = state.entries;
    try {
      if (isUndo) localStorage.removeItem(UNDO_KEY);
      else localStorage.setItem(UNDO_KEY, JSON.stringify(prev));
    } catch (e) { /* sin persistencia */ }
    const t = Date.now(), next = {};
    Object.keys(entries).forEach(function (key) { next[key] = { v: entries[key].v, t: t }; });
    Object.keys(prev).forEach(function (key) {
      if (key in next) return;
      next[key] = prev[key].v != null ? { v: null, t: t } : prev[key];
    });
    state.entries = next;
    save();
    render();
    renderUndo();
    sync();
  }
  const longDate = (iso) => { const d = new Date(iso + 'T00:00:00'); return d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear(); };

  async function loadBackups() {
    const list = $('backupList');
    list.hidden = false;
    list.innerHTML = '';
    list.appendChild(el('li', null, 'Buscando copias…'));
    try {
      const resp = await fetch('/api/sync?list=backups', { headers: authHeaders() });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 401) { logout('La clave cambió. Escríbela de nuevo.'); return; }
      if (!resp.ok) throw new Error(body.error || 'Error ' + resp.status);
      list.innerHTML = '';
      if (!body.dates.length) { list.appendChild(el('li', null, 'Todavía no hay copias: se crea la primera con el primer cambio de un día.')); return; }
      body.dates.forEach(function (day) {
        const li = el('li');
        li.appendChild(el('span', null, 'Cómo estaba al empezar el ' + longDate(day)));
        const b = el('button', 'btn', 'Restaurar');
        b.addEventListener('click', () => restoreBackup(day));
        li.appendChild(b);
        list.appendChild(li);
      });
    } catch (e) {
      list.innerHTML = '';
      list.appendChild(el('li', null, 'No se pudieron buscar las copias: ' + e.message));
    }
  }
  async function restoreBackup(day) {
    const choice = await ask('¿Volver al ' + longDate(day) + '?',
      'Todo vuelve a como estaba al empezar ese día. Lo que escribiste después se reemplaza, en todos tus dispositivos. Podés deshacerlo desde esta misma sección.',
      [{ label: 'Restaurar esa copia', value: 'yes', primary: true }]);
    if (choice !== 'yes') return;
    try {
      const resp = await fetch('/api/sync?backup=' + encodeURIComponent(day), { headers: authHeaders() });
      const copy = await resp.json();
      if (!resp.ok) throw new Error(copy.error || 'Error ' + resp.status);
      applySnapshot(copy.entries);
      toast('Copia restaurada');
    } catch (e) {
      toast('No se pudo restaurar: ' + e.message);
    }
  }

  // ── Respaldo ──
  function download(name, content, type) {
    const blob = new Blob([content], { type: type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  function exportJson() {
    const payload = { app: 'sunset', version: 2, exported: new Date().toISOString(), entries: state.entries };
    download('sunset-respaldo-' + stamp() + '.json', JSON.stringify(payload, null, 1), 'application/json');
    toast('Respaldo descargado');
  }

  // Una fila por semana, lista para abrir en Excel o Google Sheets.
  function exportCsv() {
    const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['Año', 'Semana', 'Fechas', 'Color'];
    WEEKDAYS.forEach((d) => head.push('Registro ' + d));
    for (let i = 1; i <= 3; i++) head.push('Palabra ' + i, 'Respuestas ' + i, '% ' + i, 'Comentario ' + i);
    head.push('% semana', 'Maestría', 'Qué funcionó / mejorar', 'Intención');
    const rows = [head];
    YEARS.forEach(function (YY) {
      YY.weeks.forEach(function (wk) {
        const w = wk.week;
        const row = [YY.year, w, wk.dates, YY.themes[wk.col].name];
        for (let d = 0; d < 7; d++) row.push(getV(k(YY, w, 'd' + d), ''));
        activeWords(YY, w).forEach(function (a) {
          row.push(a.word, getAnswers(YY, w, a.word).map((v) => v || '-').join(' '),
            Math.round(wordScore(YY, w, a.word) * 100), getV(k(YY, w, 'c/' + a.word), ''));
        });
        row.push(Math.round(weekScore(YY, w) * 100), getV(k(YY, w, 'maestria'), ''),
          getV(k(YY, w, 'funciono'), ''), getV(k(YY, w, 'intencion'), ''));
        rows.push(row);
      });
    });
    download('sunset-registro-' + stamp() + '.csv', '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    toast('Planilla descargada');
  }

  // Importar: se puede combinar con lo que hay (gana el dato más reciente) o reemplazar todo.
  function importData(file) {
    const reader = new FileReader();
    reader.onload = async function () {
      let data;
      try {
        data = JSON.parse(reader.result);
        if (!data || data.app !== 'sunset' || typeof data.entries !== 'object') throw new Error('formato');
      } catch (e) {
        toast('El archivo no es un respaldo válido de Sunset');
        return;
      }
      const choice = await ask('¿Cómo importar este respaldo?',
        'Combinar suma el respaldo a lo que ya tenés y, si hay un mismo dato en los dos, queda el más reciente. Reemplazar deja todo exactamente como estaba en el respaldo.',
        [{ label: 'Combinar', value: 'merge', primary: true }, { label: 'Reemplazar todo', value: 'replace' }]);
      if (choice === 'merge') {
        state.entries = mergeEntries(state.entries, data.entries).entries;
        save(); render(); sync();
        toast('Respaldo combinado');
      } else if (choice === 'replace') {
        applySnapshot(data.entries);
        toast('Respaldo restaurado');
      }
    };
    reader.readAsText(file);
  }

  // ── Instalación (PWA) ──
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    $('installBtn').hidden = false;
  });
  $('installBtn').addEventListener('click', async function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('installBtn').hidden = true;
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  // ── Eventos ──
  $('prevWeek').addEventListener('click', () => step(-1));
  $('nextWeek').addEventListener('click', () => step(1));
  $('todayBtn').addEventListener('click', () => goTo(TODAY.Y, TODAY.week));
  $('exportJsonBtn').addEventListener('click', exportJson);
  $('exportCsvBtn').addEventListener('click', exportCsv);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', function () {
    if (this.files[0]) importData(this.files[0]);
    this.value = '';
  });
  $('syncNow').addEventListener('click', sync);
  $('logoutBtn').addEventListener('click', async function () {
    const choice = await ask('¿Cerrar sesión en este dispositivo?',
      'Se borra de este dispositivo la clave y el contenido. Tus registros siguen guardados en línea y vuelven al entrar de nuevo.',
      [{ label: 'Cerrar sesión', value: 'yes', primary: true }]);
    if (choice === 'yes') logout('');
  });
  $('backupsBtn').addEventListener('click', loadBackups);
  $('undoBtn').addEventListener('click', function () {
    const undo = readUndo();
    if (undo) { applySnapshot(undo, true); toast('Restauración deshecha'); }
  });
  window.addEventListener('online', sync);

  // Si la app queda abierta de un día para otro, "hoy" se actualiza al volver a ella.
  function refreshToday() {
    if (!Y) return;
    const n = new Date();
    if (n.toDateString() === now.toDateString()) return;
    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
    const followToday = isCurrent();
    now = n;
    TODAY = locateDate(now);
    if (followToday) { Y = TODAY.Y; viewing = TODAY.week; }
    renderHeader();
    render();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    refreshToday();
    sync();
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input,textarea') || !$('welcome').hidden) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  $('welcomeOk').addEventListener('click', function () {
    $('welcome').hidden = true;
    state.welcomed = true;
    save();
  });

  // Arranque con el contenido ya disponible.
  function boot(data) {
    prepare(data);
    now = new Date();
    TODAY = locateDate(now);
    Y = TODAY.Y;
    viewing = TODAY.week;
    openWord = null;
    renderHeader();
    renderSyncPanel();
    renderUndo();
    render();
    if (!state.welcomed) $('welcome').hidden = false;
    sync();
  }

  // Sin clave no hay contenido: la app pide la clave. Con clave y contenido guardados abre directo.
  async function start() {
    if (window.SUNSET_DATA) { boot(window.SUNSET_DATA); return; }   // vista previa con datos incluidos
    const key = syncKey(), cached = readCached();
    if (key && cached) { boot(cached); refreshContent(); return; }
    if (!key) { showLock(''); return; }
    try {
      const data = await fetchContent(key);
      try { localStorage.setItem(CONTENT_KEY, JSON.stringify(data)); } catch (e) { /* sin persistencia */ }
      boot(data);
    } catch (e) {
      if (e.code === 401) logout('La clave cambió. Escríbela de nuevo.');
      else showLock(e.message);
    }
  }
  start();
})();
