(function () {
  'use strict';

  const D = window.SUNSET_DATA;
  const STORE_KEY = 'sunset_2027_v1';
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
  function rgba(hex, a) { return 'rgba(' + hexToRgb(hex).join(',') + ',' + a + ')'; }
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // ── Calendario ──
  const START = new Date(D.firstSunday + 'T00:00:00');
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function weekOfDate(d) { return Math.floor((startOfDay(d) - START) / DAY_MS / 7 + 1e-9) + 1; }
  function dateOf(week, day) { const d = new Date(START); d.setDate(d.getDate() + (week - 1) * 7 + day); return d; }
  function fmtDate(d) { return d.getDate() + ' de ' + MONTHS[d.getMonth()]; }

  // ── Rotación ──
  // phase = floor((semana-1)/7); col = (3 + (semana-1) % 7) % 7; palabra_k = board[(phase+k) % 7][col]
  function rotation(week) {
    const phase = Math.floor((week - 1) / 7);
    const col = (3 + (week - 1) % 7) % 7;
    const words = [];
    for (let k = 0; k < 7; k++) {
      const dim = (phase + k) % 7;
      words.push({ word: D.board[dim][col], dim: dim, col: col });
    }
    return words;
  }
  function activeWords(week) { return rotation(week).slice(0, 3); }

  // Colores de la semana: el color de la columna, con contraste suficiente sobre fondo claro.
  // Negro usa negro real; Blanco usa su gris pizarra (el blanco no se lee sobre crema).
  const THEMES = D.colors.map(function (c) {
    const [p0, p1, p2] = c.palette;
    const strong = luminance(p0) > 0.6 ? p1 : p0;
    const soft = luminance(p2) > 0.75 && c.name !== 'Negro' ? p2 : '#EFEDE8';
    return { name: c.name, emoji: c.emoji, strong: strong, mid: p1, soft: soft };
  });

  // ── Estado ──
  let state = { answers: {}, welcomed: false };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* almacenamiento no disponible */ }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* sin persistencia */ }
  }
  function getAnswers(week, word) {
    const w = state.answers['w' + week];
    return (w && w[word]) || [null, null, null, null, null];
  }
  function setAnswer(week, word, qi, value) {
    const key = 'w' + week;
    state.answers[key] = state.answers[key] || {};
    const a = getAnswers(week, word).slice();
    a[qi] = a[qi] === value ? null : value;
    state.answers[key][word] = a;
    save();
  }

  // Puntaje de una palabra en una semana: suma / 25 (las no respondidas cuentan 0).
  function wordScore(week, word) {
    return getAnswers(week, word).reduce((s, v) => s + (v || 0), 0) / 25;
  }
  function wordAnswered(week, word) {
    return getAnswers(week, word).filter((v) => v != null).length;
  }
  function weekScore(week) {
    return activeWords(week).reduce((s, w) => s + wordScore(week, w.word), 0) / 3;
  }
  function weekCompletion(week) {
    return activeWords(week).reduce((s, w) => s + wordAnswered(week, w.word), 0) / 15;
  }

  // Semanas en que se evalúa cada palabra.
  const EVAL_WEEKS = {};
  for (let w = 1; w <= 52; w++) {
    activeWords(w).forEach(function (a) { (EVAL_WEEKS[a.word] = EVAL_WEEKS[a.word] || []).push(w); });
  }
  // Maestría acumulada: promedio del puntaje en las semanas en que la palabra tuvo respuestas.
  function mastery(word) {
    const scored = (EVAL_WEEKS[word] || []).filter((w) => wordAnswered(w, word) > 0);
    if (!scored.length) return 0;
    return scored.reduce((s, w) => s + wordScore(w, word), 0) / scored.length;
  }
  function nextEvalWeek(word, from) {
    const list = EVAL_WEEKS[word] || [];
    return list.find((w) => w >= from) || list[0];
  }

  // ── Vista ──
  const now = new Date();
  const CURRENT_WEEK = weekOfDate(now);
  const IN_YEAR = CURRENT_WEEK >= 1 && CURRENT_WEEK <= 52;
  let viewing = Math.min(52, Math.max(1, CURRENT_WEEK));
  let openWord = null;

  function applyTheme(week) {
    const t = THEMES[D.weeks[week - 1].col];
    const root = document.documentElement.style;
    root.setProperty('--wk', t.strong);
    root.setProperty('--wk-mid', t.mid);
    root.setProperty('--wk-soft', t.soft);
  }

  function renderHeader() {
    const h = $('headerDate');
    h.textContent = WEEKDAYS[now.getDay()] + ' ' + fmtDate(now);
    const sub = el('small', null, IN_YEAR ? 'Semana ' + CURRENT_WEEK + ' de 52'
      : CURRENT_WEEK < 1 ? 'Sunset ' + D.year + ' empieza el ' + fmtDate(START) : 'Sunset ' + D.year + ' terminado');
    h.appendChild(sub);
  }

  function renderWeekBar() {
    const wk = D.weeks[viewing - 1];
    const t = THEMES[wk.col];
    $('weekNum').textContent = 'Semana ' + viewing;
    $('weekSub').textContent = t.emoji + ' ' + t.name + ' · ' + wk.dates;
    $('prevWeek').disabled = viewing <= 1;
    $('nextWeek').disabled = viewing >= 52;
    $('todayBtn').hidden = !IN_YEAR || viewing === CURRENT_WEEK;
  }

  function todayIndex() {
    return viewing === CURRENT_WEEK ? now.getDay() : -1;
  }

  function dayHead(day, label, iconName) {
    const head = el('div', 'card-day');
    head.appendChild(icon(iconName));
    head.appendChild(document.createTextNode(WEEKDAYS[day] + ' ' + dateOf(viewing, day).getDate() + ' · ' + label));
    if (todayIndex() === day) head.appendChild(el('span', 'badge', 'Hoy'));
    return head;
  }

  function renderSunday() {
    const wk = D.weeks[viewing - 1];
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
  }

  function renderDays() {
    const wk = D.weeks[viewing - 1];
    const wrap = $('days');
    wrap.innerHTML = '';
    DAY_CARDS.forEach(function (d) {
      const card = el('article', 'card');
      card.classList.toggle('is-today', todayIndex() === d.day);
      card.appendChild(dayHead(d.day, d.label, d.icon));
      if (d.key === 'sabado') {
        const ol = el('ol', 'sat-list');
        wk.sabado.forEach((q) => ol.appendChild(el('li', null, q)));
        card.appendChild(ol);
      } else {
        card.appendChild(el('p', 'card-text', wk[d.key]));
      }
      wrap.appendChild(card);
    });
  }

  function renderEvaluation() {
    const score = weekScore(viewing);
    const done = weekCompletion(viewing);
    const pct = $('evalPct');
    pct.textContent = Math.round(score * 100);
    pct.appendChild(el('small', null, '%'));
    $('evalPctLabel').textContent = done === 0 ? 'Sin responder todavía'
      : done === 1 ? 'Autoevaluación completa' : Math.round(done * 15) + ' de 15 preguntas respondidas';

    const rot = rotation(viewing);
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
      label.appendChild(el('span', 'chip-dim', D.dimensions[r.dim]));
      label.appendChild(document.createElement('br'));
      label.appendChild(document.createTextNode(r.word));
      c.appendChild(label);
      c.appendChild(el('span', 'chip-pct', Math.round(wordScore(viewing, r.word) * 100) + '%'));
      c.addEventListener('click', function () {
        openWord = openWord === r.word ? null : r.word;
        renderEvaluation();
      });
      chips.appendChild(c);
    });

    const qs = $('questions');
    qs.innerHTML = '';
    if (!openWord) return;
    const answers = getAnswers(viewing, openWord);
    (D.questions[openWord] || []).forEach(function (q, qi) {
      const box = el('div', 'q');
      box.appendChild(el('p', 'q-text', q));
      const scale = el('div', 'q-scale');
      for (let v = 1; v <= 5; v++) {
        const b = el('button', null, String(v));
        b.setAttribute('aria-pressed', String(answers[qi] === v));
        b.setAttribute('aria-label', v + ' de 5');
        b.addEventListener('click', function () {
          setAnswer(viewing, openWord, qi, v);
          renderEvaluation();
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
  }

  function renderYear() {
    const grid = $('yearGrid');
    grid.innerHTML = '';
    D.weeks.forEach(function (wk) {
      const t = THEMES[wk.col];
      const done = weekCompletion(wk.week);
      const b = el('button', 'yw', String(wk.week));
      b.title = 'Semana ' + wk.week + ' · ' + wk.dates + ' · ' + Math.round(done * 100) + '% respondido';
      if (done > 0) {
        b.style.background = rgba(t.strong, 0.15 + done * 0.85);
        b.style.borderColor = t.strong;
        if (done > 0.5) b.style.color = '#fff';
      }
      if (wk.week === viewing) b.classList.add('is-viewing');
      if (wk.week === CURRENT_WEEK) b.classList.add('is-current');
      b.addEventListener('click', function () { goTo(wk.week); });
      grid.appendChild(b);
    });
  }

  function champion(words) {
    let best = null;
    words.forEach(function (w) {
      const m = mastery(w);
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
          const word = D.board[r][c];
          const m = mastery(word);
          const t = THEMES[c];
          const sq = el('button', 'sq ' + ((r + c) % 2 ? 'dark' : 'light'));
          const fill = el('span', 'fill');
          fill.style.background = rgba(t.strong, m * 0.9);
          sq.appendChild(fill);
          const lbl = el('span', 'lbl', word);
          if (m > 0) lbl.appendChild(el('small', null, Math.round(m * 100) + '%'));
          if (m > 0.55) sq.style.color = '#fff';
          sq.appendChild(lbl);
          const next = nextEvalWeek(word, viewing);
          sq.title = word + ' · ' + D.dimensions[r] + ' · ' + t.name + ' · próxima evaluación: semana ' + next;
          sq.addEventListener('click', function () { goTo(next); });
          board.appendChild(sq);
        } else if (r < 7) {
          board.appendChild(champCell(champion(D.board[r]), false));
        } else if (c < 7) {
          board.appendChild(champCell(champion(D.board.map((row) => row[c])), false));
        } else {
          board.appendChild(champCell(champion([].concat.apply([], D.board)), true));
        }
      }
    }
    const legend = $('boardLegend');
    if (!legend.childElementCount) {
      THEMES.forEach(function (t) {
        const s = el('span');
        const i = el('i');
        i.style.background = t.strong;
        s.appendChild(i);
        s.appendChild(document.createTextNode(t.name));
        legend.appendChild(s);
      });
    }
  }

  function render() {
    applyTheme(viewing);
    renderWeekBar();
    renderSunday();
    renderDays();
    renderEvaluation();
    renderYear();
    renderBoard();
  }

  function goTo(week) {
    viewing = Math.min(52, Math.max(1, week));
    openWord = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── Respaldo ──
  function exportData() {
    const payload = { app: 'sunset', year: D.year, exported: new Date().toISOString(), answers: state.answers };
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sunset-' + D.year + '-progreso-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Progreso exportado');
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        if (!data || data.app !== 'sunset' || typeof data.answers !== 'object') throw new Error('formato');
        if (!confirm('Esto reemplaza el progreso guardado en este dispositivo. ¿Continuar?')) return;
        state.answers = data.answers;
        save();
        render();
        toast('Progreso importado');
      } catch (e) {
        toast('El archivo no es un respaldo válido de Sunset');
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
  $('prevWeek').addEventListener('click', () => goTo(viewing - 1));
  $('nextWeek').addEventListener('click', () => goTo(viewing + 1));
  $('todayBtn').addEventListener('click', () => goTo(CURRENT_WEEK));
  $('exportBtn').addEventListener('click', exportData);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', function () {
    if (this.files[0]) importData(this.files[0]);
    this.value = '';
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input,textarea') || !$('welcome').hidden) return;
    if (e.key === 'ArrowLeft') goTo(viewing - 1);
    if (e.key === 'ArrowRight') goTo(viewing + 1);
  });

  if (!state.welcomed) {
    $('welcome').hidden = false;
    $('welcomeOk').addEventListener('click', function () {
      $('welcome').hidden = true;
      state.welcomed = true;
      save();
    });
  }

  renderHeader();
  render();
})();
