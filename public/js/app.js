(function () {
  'use strict';

  let YEARS = [];
  let RECURSOS = {};
  let CONFIG = {};
  let TEMAS = {};
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
  // Días enteros desde una fecha de referencia, sin que el horario de verano cambie el resultado.
  const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  function fmtDate(d) { return d.getDate() + ' de ' + MONTHS[d.getMonth()]; }
  function debounce(fn, ms) {
    let t = null;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  // ── Años ──
  // Cada año trae su planilla: semanas, tablero 7×7, preguntas y colores.
  // Colores de la semana: el acento de su árbol (claro, para leerse sobre el fondo nocturno).
  function prepare(data) {
  YEARS = data.years;
  RECURSOS = data.recursos || {};
  CONFIG = data.config || {};
  TEMAS = data.temas || {};
  YEARS.forEach(function (Y) {
    Y.start = new Date(Y.firstSunday + 'T00:00:00');
    Y.themes = Y.colors.map(function (c) {
      const t = window.SunsetTree.TREES[c.name];
      return { name: c.name, emoji: c.emoji, strong: t.accent, mid: t.mid };
    });
    if (Y.intro) {
      const ci = Y.colors.findIndex((c) => c.name === Y.intro.color);
      const ref = Y.weeks.find((w) => w.col === ci);
      Y.intro.week = 0;
      Y.intro.dias = Y.intro.dias || [];
      Y.intro.firstDay = Math.min.apply(null, Y.intro.dias.map((d) => d.dia).concat([6]));
      Y.intro.cero = Y.intro.numeracion === 'cero';
      Y.intro.col = ci < 0 ? 0 : ci;
      Y.intro.phase = ref ? ref.phase : 0;
    }
    // Los @ del viernes traen un emoji de color al final (para los flyers); en la app el color lo da el guion de la firma.
    Y.weeks.forEach(function (wk) {
      ['regalo', 'pensamiento', 'desafio', 'consejo', 'frase', 'hook'].forEach(function (key) {
        if (typeof wk[key] === 'string') wk[key] = wk[key].replace(/\s*[\u{1F7E0}-\u{1F7EB}\u{2B1B}\u{2B1C}\u{1F534}\u{1F535}\u{1F3A8}]\uFE0F?\s*$/u, '').trim();
      });
    });
    // Semanas en que se evalúa cada palabra.
    Y.evalWeeks = {};
    Y.weeks.forEach(function (wk) {
      activeWords(Y, wk.week).forEach(function (a) { (Y.evalWeeks[a.word] = Y.evalWeeks[a.word] || []).push(wk.week); });
    });
  });
  }
  // Hora actual. Solo la vista previa (con datos incluidos) puede fijar una fecha de demostración.
  const clock = () => (window.SUNSET_DATA && window.SUNSET_NOW ? new Date(window.SUNSET_NOW) : new Date());
  const yearIndex = (year) => YEARS.findIndex((Y) => Y.year === year);
  // Introducción: los días de enero que quedan antes de la semana 1 (semana 0). Solo existe si el año trae «intro».
  const weekAt = (YY, w) => (w === 0 ? YY.intro : YY.weeks[w - 1]);
  const minWeek = (YY) => (YY.intro ? 0 : 1);
  const allWeeks = (YY) => (YY.intro ? [YY.intro] : []).concat(YY.weeks);
  // Número que ve el usuario: con introducción, la introducción es la semana 1 y todo lo demás corre un número (Lila = 2).
  const num = (YY, w) => w + (YY.intro && !YY.intro.cero ? 1 : 0);
  const totalWeeks = (YY) => YY.weeks.length + (YY.intro && !YY.intro.cero ? 1 : 0);
  const introDay = (wk, day) => (wk.dias || []).find((d) => d.dia === day);
  const introText = (d) => (d ? (d.preguntas ? d.preguntas.join('  ') : d.texto) : '');
  const weekName = (w, YY) => (w === 0 && !(YY || Y).intro ? 'Antes de la semana 1' : 'Semana ' + num(YY || Y, w));
  function dateOf(Y, week, day) { const d = new Date(Y.start); d.setDate(d.getDate() + (week - 1) * 7 + day); return d; }

  // Año y semana de una fecha. Antes del primer año → su semana 1; después del último → su última semana.
  function locateDate(d) {
    const t = utcDay(d);
    for (const Y of YEARS) {
      if (Y.intro) {
        const diff0 = Math.floor((t - utcDay(Y.start)) / DAY_MS);
        if (diff0 < 0 && diff0 >= Y.intro.firstDay - 7) return { Y: Y, week: 0, inRange: true };
      }
    }
    for (const Y of YEARS) {
      const diff = Math.floor((t - utcDay(Y.start)) / DAY_MS);
      const week = Math.floor(diff / 7) + 1;
      if (week >= 1 && week <= Y.weeks.length) return { Y: Y, week: week, inRange: true };
    }
    const first = YEARS[0], last = YEARS[YEARS.length - 1];
    return t < utcDay(first.start) ? { Y: first, week: first.intro ? 0 : 1, inRange: false, before: true }
      : { Y: last, week: last.weeks.length, inRange: false };
  }

  // ── Rotación ──
  // Cada semana trae su fila de inicio (phase) y columna/color (col): palabra_k = board[(phase+k) % 7][col].
  // k = 0..2 son las 3 palabras activas; k = 3..6 completan las 7 en juego.
  function rotation(Y, week) {
    const wk = weekAt(Y, week);
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
  //   AAAA/wN/p0..p6      cumplimiento del día (0 a 100), del control deslizante
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
  // Regla del sistema: se puede modificar la semana actual y la anterior. Las más antiguas quedan de solo lectura;
  // solo admiten una nota posterior (clave AAAA/wN/nota). Las semanas futuras no se bloquean.
  function absWeek(YY, w) {
    let n = 0;
    for (const y of YEARS) {
      if (y === YY) return n + (w - minWeek(y));
      n += y.weeks.length - minWeek(y) + 1;
    }
    return n;
  }
  function weekLocked(YY, w) {
    const t = locateDate(now);
    if (!t.inRange && t.before) return false;
    const cur = absWeek(t.Y, t.week) + (t.inRange ? 0 : 1);
    return absWeek(YY, w) < cur - 1;
  }
  function keyLocked(key) {
    const m = String(key).match(/^(\d{4})\/w(\d+)\/(.+)$/);
    if (!m || m[3] === 'nota') return false;
    const YY = YEARS.find((y) => String(y.year) === m[1]);
    return !!YY && weekLocked(YY, Number(m[2]));
  }
  function setV(key, value) {
    if (keyLocked(key)) return;
    state.entries[key] = { v: value, t: Date.now() };
    save();
    scheduleSync();
  }
  let dataVer = 0;   // sube con cada cambio guardado: las vistas pesadas saben si deben redibujarse
  function save() {
    dataVer++;
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

  // Nombres completos para mostrar (la planilla los abrevia; las claves guardadas siguen usando la palabra original).
  const FULL_NAMES = { 'Ahorro T.': 'Ahorro de Tiempo', 'Equipo Aux.': 'Equipo de Auxilio', 'V. Cristiana': 'Vida Cristiana' };
  const wordName = (w) => FULL_NAMES[w] || w;
  // Concepto de cada dimensión (el mismo que abre cada parte del libro): qué es y su pregunta central.
  const DIM_CONCEPTS = [
    ['Lo que no se gana: se recibe.', '¿Qué me fue dado que no estoy viendo?'],
    ['A quién le doy mi tiempo y mi presencia.', '¿Quién ocupa el lugar que le corresponde?'],
    ['Donde me formo para servir mejor.', '¿Qué estoy aprendiendo y para qué?'],
    ['La persona en la que me propongo convertirme.', '¿Qué rasgo me toca forjar ahora?'],
    ['Lo que no se negocia.', '¿Qué sostengo aunque cueste?'],
    ['Las herramientas que multiplican lo que hago.', '¿Cómo me organizo, me presento y me apoyo?'],
    ['La vida como una partida: comenzar, ordenar, cerrar, no perder el rey.', '¿Juego por reacción o con un plan?'],
  ];
  // Explicación completa de cada dimensión, para quien recién empieza (se muestra en la ficha al abrir un ícono).
  const DIM_ABOUT = [
    'Todo lo que tienes y no ganaste: el camino que se abre, la energía de cada día, la provisión, la protección, el entorno, el tiempo y la sabiduría. Esta dimensión te invita a reconocerlo y agradecerlo antes de pedir más. De aquí parte todo lo demás: primero se recibe, después se construye.',
    'El orden de los lugares que ocupan las personas y las responsabilidades en tu vida: tú mismo, tu familia, tu empresa, tu trabajo, tu núcleo cercano, tus amigos y tus hermanos en la fe. No se trata solo de cuánto tiempo das, sino de que cada uno reciba el lugar que le corresponde y tu presencia real.',
    'Las áreas en las que eliges aprender y crecer: liderazgo, vida espiritual, finanzas, crecimiento personal, relaciones, estrategias y vida cristiana. No es acumular información: es formarte para servir mejor a otros. Cada semana, «Para profundizar» trae ideas y datos sobre el tema.',
    'Los rasgos de carácter que te propones forjar, uno a la vez: creativo, humilde, constante, valiente, alegre, atleta y social. Se lee en primera persona: mi desafío es ser humilde, luego valiente. No describe quién eres hoy, sino en quién te estás convirtiendo.',
    'Los principios que sostienes aunque cueste: responsabilidad, amor, integridad, gratitud, respeto, disciplina y solidaridad. Son tu base firme; cuando todo cambia, ellos no se negocian. Cada semana revisas uno en tus decisiones concretas.',
    'Las herramientas prácticas que multiplican tu esfuerzo: tomar la iniciativa, hacer las cosas bien y a tiempo, delegar, cuidar cómo te presentas, apalancarte en recursos y personas, ahorrar tiempo y contar con tu equipo de auxilio: las personas que te sostienen en tiempos difíciles.',
    'La vida vista como una partida de ajedrez: una buena apertura, pensamiento estratégico, estructura, táctica para el momento, saber cerrar, prevenir antes de que pase y avanzar con decisión. Lo esencial es no perder el rey: puedes perder piezas, pero no lo que más importa.',
  ];
  const qCount = (Y, word) => (Y.questions[word] || []).length;
  function getAnswers(Y, week, word) {
    const a = getV(k(Y, week, 'a/' + word), null);
    const n = qCount(Y, word);
    return a ? a.slice(0, n).concat(Array(Math.max(0, n - a.length)).fill(null)) : Array(n).fill(null);
  }
  // Total de preguntas de la semana (3 palabras × las preguntas de cada una).
  const weekTotal = (Y, week) => activeWords(Y, week).reduce((s, a) => s + qCount(Y, a.word), 0);
  function setAnswer(Y, week, word, qi, value) {
    const a = getAnswers(Y, week, word).slice();
    a[qi] = a[qi] === value ? null : value;
    setV(k(Y, week, 'a/' + word), a);
  }

  // Puntaje de una palabra en una semana: promedio de las preguntas respondidas (1 a 5 → hasta 100%).
  // Las preguntas sin responder no cuentan: una semana a medio responder no parece una semana mala.
  function wordAnswered(Y, week, word) {
    return getAnswers(Y, week, word).filter((v) => v != null).length;
  }
  function wordScore(Y, week, word) {
    const a = getAnswers(Y, week, word).filter((v) => v != null);
    return a.length ? a.reduce((s, v) => s + v, 0) / (5 * a.length) : 0;
  }
  const pctText = (Y, week, word) => (wordAnswered(Y, week, word) ? Math.round(wordScore(Y, week, word) * 100) + '%' : '—');
  // Promedio de la semana: solo entre las palabras que tienen respuestas.
  function weekScore(Y, week) {
    const used = activeWords(Y, week).filter((w) => wordAnswered(Y, week, w.word) > 0);
    return used.length ? used.reduce((s, w) => s + wordScore(Y, week, w.word), 0) / used.length : 0;
  }
  function weekCompletion(Y, week) {
    const t = weekTotal(Y, week);
    return t ? activeWords(Y, week).reduce((s, w) => s + wordAnswered(Y, week, w.word), 0) / t : 0;
  }
  // Maestría acumulada en el año: promedio del puntaje en las semanas en que la palabra tuvo respuestas.
  function mastery(Y, word) {
    const scored = (Y.evalWeeks[word] || []).filter((w) => wordAnswered(Y, w, word) > 0);
    if (!scored.length) return 0;
    return scored.reduce((s, w) => s + wordScore(Y, w, word), 0) / scored.length;
  }
  // Maestría del color: se calcula sola. Cuando las 7 palabras de la columna ya pasaron por una evaluación,
  // la de mejor puntaje acumulado es la maestría del color. Mientras tanto solo hay una líder provisoria.
  function colorMastery(Y, col) {
    const words = Y.board.map((row) => row[col]);
    let leader = null, done = 0;
    words.forEach(function (w) {
      const m = mastery(Y, w);
      if (m > 0) { done++; if (!leader || m > leader.m) leader = { word: w, m: m }; }
    });
    return { done: done, complete: done === words.length, leader: leader };
  }
  const isMastery = (Y, col, word) => { const cm = colorMastery(Y, col); return cm.complete && cm.leader.word === word; };
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
  // Guardados pendientes de los campos de texto (se vacían si la app se cierra o se oculta).
  const pendingNotes = new Set();
  const flushNotes = () => Array.from(pendingNotes).forEach((f) => f());
  function noteField(key, placeholder, rows) {
    const ta = el('textarea', 'note');
    ta.rows = rows || 2;
    ta.placeholder = placeholder;
    ta.value = getV(key, '');
    if (keyLocked(key)) {
      ta.readOnly = true;
      ta.classList.add('is-locked');
      ta.placeholder = 'Sin registro';
      return ta;
    }
    // Solo guarda lo que se escribió aquí: enfocar y salir de un campo no pisa un dato más nuevo de otro dispositivo.
    let dirty = false;
    const flush = function () { if (dirty) { dirty = false; pendingNotes.delete(flush); setV(key, ta.value); } };
    const commit = debounce(flush, 500);
    ta.addEventListener('input', function () { dirty = true; pendingNotes.add(flush); commit(); });
    ta.addEventListener('blur', flush);
    return ta;
  }

  const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

  // Ánimo del día (1 a 5, cinco puntos que se encienden) y gratitud corta. Claves AAAA/wN/m0..m6 y g0..g6.
  const MOOD_NAMES = ['Bajo', 'Algo bajo', 'Normal', 'Bien', 'Genial'];
  function moodRow(day, onChange, YY, w) {
    const key = k(YY || Y, w === undefined ? viewing : w, 'm' + day);
    const row = el('div', 'mood');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Ánimo del día');
    row.appendChild(el('span', 'mood-label', 'Ánimo'));
    const dots = [];
    row.appendChild(el('span', 'mood-end', 'bajo'));
    const paint = function () {
      const v = getV(key, 0);
      dots.forEach((b, i) => { b.classList.toggle('on', i < v); b.setAttribute('aria-pressed', String(v === i + 1)); });
    };
    for (let i = 1; i <= 5; i++) {
      const b = el('button', 'mood-dot');
      b.type = 'button';
      b.setAttribute('aria-label', MOOD_NAMES[i - 1] + ', ' + i + ' de 5');
      b.disabled = keyLocked(key);
      b.addEventListener('click', function () { setV(key, getV(key, 0) === i ? null : i); paint(); if (onChange) onChange(); });
      dots.push(b); row.appendChild(b);
    }
    row.appendChild(el('span', 'mood-end', 'genial'));
    paint();
    return row;
  }

  // Ánimo de una semana: valor por día (D a S), promedio y cuántos días se registraron.
  const DAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  function weekMood(YY, w) {
    const vals = [0, 1, 2, 3, 4, 5, 6].map((d) => getV(k(YY, w, 'm' + d), null));
    const used = vals.filter((v) => v != null);
    return { vals: vals, n: used.length, avg: used.length ? used.reduce((s, v) => s + v, 0) / used.length : null };
  }
  const fmt1 = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');
  const refreshMood = function () { renderClosing(); renderYear(); };

  // Registro del día. Hoy: cuadro para escribir unas líneas, con "Ampliar" para escribir largo.
  // Otros días: solo una pestaña que abre el registro; lo escrito no se ve en la tarjeta.
  function dayRecord(day) {
    const key = k(Y, viewing, 'd' + day);
    const dayName = WEEKDAYS[day].toLowerCase();
    if (todayIndex() === day) {
      const box = el('div', 'record record-today');
      box.appendChild(noteField(key, 'Registro de hoy…'));
      const gr = noteField(k(Y, viewing, 'g' + day), 'Hoy agradezco…', 1);
      gr.classList.add('grat-note');
      box.appendChild(gr);
      box.appendChild(moodRow(day, refreshMood));
      box.appendChild(questionBox(Y, viewing, day, refreshEval));
      const tools = el('div', 'record-tools');
      const mic = micButton(box.querySelector('textarea'));
      if (mic) tools.appendChild(mic);
      const expand = el('button', 'expand-btn');
      expand.appendChild(icon('expand'));
      expand.appendChild(document.createTextNode('Ampliar'));
      expand.setAttribute('aria-label', 'Abrir el registro de hoy en pantalla grande');
      expand.addEventListener('click', () => openEditor(day));
      tools.appendChild(expand);
      box.appendChild(tools);
      return box;
    }
    const words = countWords(getV(key, ''));
    const tab = el('button', 'record-tab' + (words ? ' has-text' : ''));
    tab.dataset.day = day;
    tab.setAttribute('aria-label', 'Abrir el registro del ' + dayName + (words ? ', ' + words + ' palabras' : ', vacío'));
    tab.appendChild(icon('pen'));
    tab.appendChild(el('span', null, words ? 'Registro' : 'Registro, ánimo y gratitud'));
    if (words) tab.appendChild(el('span', 'count', words + (words === 1 ? ' palabra' : ' palabras')));
    tab.addEventListener('click', () => openEditor(day));
    return tab;
  }

  // Frase con firma: el guion «—» toma el color de la semana, sutil.
  function phraseInto(node, text) {
    node.textContent = '';
    const m = String(text || '').match(/^([\s\S]*?)\s+—\s+([^—]+)$/);
    // Solo es firma si lo que sigue al guion es corto y empieza con mayúscula (un nombre o una cita bíblica);
    // un guion en medio de la frase («…a la sequía — porque sus raíces…») es parte del texto.
    if (!m || m[2].length > 60 || !/^[A-ZÁÉÍÓÚÑ0-9]/.test(m[2].trim())) { node.textContent = text || ''; return node; }
    const box = el('span');   // un solo bloque: la tarjeta centra con flex y no debe separar la firma
    box.appendChild(document.createTextNode(m[1] + ' '));
    const sig = el('span', 'sig');
    sig.appendChild(el('span', 'sig-dash', '—'));
    sig.appendChild(document.createTextNode(' ' + m[2]));
    box.appendChild(sig);
    node.appendChild(box);
    return node;
  }

  // ── Editor grande del registro ──
  let editing = null;   // { key, day, timer }
  function dayReference(day) {
    const wk = weekAt(Y, viewing);
    if (day === 0) return wk.hook;
    if (viewing === 0) return introText(introDay(wk, day));
    const d = DAY_CARDS.find((c) => c.day === day);
    return d.key === 'sabado' ? wk.sabado.join('  ') : wk[d.key];
  }
  function openEditor(day) {
    if (document.activeElement && document.activeElement.classList.contains('note')) document.activeElement.blur();
    const key = k(Y, viewing, 'd' + day);
    const date = dateOf(Y, viewing, day);
    const wk = weekAt(Y, viewing);
    editing = { key: key, day: day, timer: null };
    $('editorEyebrow').textContent = weekName(viewing) + ' · ' + Y.themes[wk.col].name;
    $('editorTitle').textContent = WEEKDAYS[day] + ' ' + date.getDate() + ' de ' + MONTHS[date.getMonth()];
    $('editorRefText').textContent = dayReference(day);
    $('editorRef').open = false;
    const ta = $('editorText');
    ta.value = getV(key, '');
    const locked = keyLocked(key);
    ta.readOnly = locked;
    $('editorGrat').readOnly = locked;
    $('editor').classList.toggle('is-locked', locked);
    const mood = $('editorMood');
    mood.textContent = '';
    mood.appendChild(moodRow(day));
    const grat = $('editorGrat');
    grat.value = getV(k(Y, viewing, 'g' + day), '');
    editing.gKey = k(Y, viewing, 'g' + day);
    $('editor').hidden = false;
    document.documentElement.classList.add('no-scroll');
    updateEditorStatus(locked ? 'Semana cerrada: solo lectura' : '');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function updateEditorStatus(saved) {
    const n = countWords($('editorText').value);
    $('editorCount').textContent = n + (n === 1 ? ' palabra' : ' palabras');
    $('editorSaved').textContent = saved;
  }
  function flushEditor() {
    if (!editing) return;
    clearTimeout(editing.timer);
    const text = $('editorText').value;
    if (text !== getV(editing.key, '')) setV(editing.key, text);
    const g = $('editorGrat').value;
    if (editing.gKey && g !== getV(editing.gKey, '')) setV(editing.gKey, g);
  }
  function closeEditor() {
    if (!editing) return;
    flushEditor();
    const day = editing.day;
    editing = null;
    $('editor').hidden = true;
    document.documentElement.classList.remove('no-scroll');
    renderSunday();
    renderDays();
    renderHoy();
    renderClosing();
    renderYear();
    const back = document.querySelector('.record-tab[data-day="' + day + '"]') || document.querySelector('.expand-btn');
    if (back) back.focus({ preventScroll: true });
  }
  $('editorText').addEventListener('input', function () {
    if (!editing) return;
    updateEditorStatus('Escribiendo…');
    clearTimeout(editing.timer);
    editing.timer = setTimeout(function () {
      if (!editing) return;
      setV(editing.key, $('editorText').value);
      updateEditorStatus('Guardado');
    }, 600);
  });
  $('editorGrat').addEventListener('input', debounce(function () {
    if (editing && editing.gKey) setV(editing.gKey, $('editorGrat').value);
  }, 500));
  $('editorDone').addEventListener('click', closeEditor);
  (function () { const m = micButton($('editorText')); if (m) $('editorSaved').parentNode.insertBefore(m, $('editorSaved')); })();
  window.addEventListener('pagehide', function () { flushEditor(); flushNotes(); });

  // ── Tema: Auto (de día entre las 7:00 y las 18:59), Día o Noche ──
  const THEMES = ['auto', 'day', 'night'];
  const THEME_LABEL = { auto: 'Auto', day: 'Día', night: 'Noche' };
  const THEME_ICON = { auto: 'auto', day: 'sun', night: 'moon' };
  let themePref = 'auto';
  try { themePref = localStorage.getItem('sunset_tema') || 'auto'; } catch (e) { /* sin almacenamiento */ }
  if (THEMES.indexOf(themePref) < 0) themePref = 'auto';
  function themeNow() {
    if (themePref !== 'auto') return themePref;
    const h = (now || clock()).getHours();
    return h >= 7 && h < 19 ? 'day' : 'night';
  }
  function applyMode() {
    const mode = themeNow();
    document.documentElement.dataset.theme = mode;
    const b = $('themeBtn');
    b.textContent = '';
    b.appendChild(icon(THEME_ICON[themePref]));
    b.setAttribute('aria-label', 'Tema: ' + THEME_LABEL[themePref] + (themePref === 'auto' ? ' (ahora ' + THEME_LABEL[mode].toLowerCase() + ')' : '') + '. Toca para cambiar.');
    b.title = themePref === 'auto' ? 'Automático: día de 7 a 19 h' : 'Modo ' + THEME_LABEL[themePref].toLowerCase();
    if (Y) applyTheme();
  }
  $('themeBtn').addEventListener('click', function () {
    themePref = THEMES[(THEMES.indexOf(themePref) + 1) % THEMES.length];
    try { localStorage.setItem('sunset_tema', themePref); } catch (e) { /* sin almacenamiento */ }
    applyMode();
    toast(themePref === 'auto' ? 'Modo automático: día de 7 a 19 h' : 'Modo ' + THEME_LABEL[themePref].toLowerCase());
  });

  // Precarga el paisaje de la semana anterior y la siguiente: el cambio de semana no espera la descarga.
  const preloaded = new Set();
  function preloadNeighbors(day) {
    const kind = matchMedia('(min-width: 521px)').matches ? '-wide' : '-tall';
    [viewing - 1, viewing + 1].forEach(function (w) {
      const wk = w >= minWeek(Y) && w <= Y.weeks.length ? weekAt(Y, w) : null;
      if (!wk) return;
      const src = 'images/trees/' + Y.themes[wk.col].name + kind + (day ? '-day' : '') + '.webp';
      if (preloaded.has(src)) return;
      preloaded.add(src);
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
  }

  const treeOf = (colorName) => window.SunsetTree.TREES[colorName] || window.SunsetTree.TREES.Lila;
  let shown = '';
  function applyTheme() {
    const col = weekAt(Y, viewing).col;
    const t = Y.themes[col];
    const root = document.documentElement.style;
    root.setProperty('--wk-accent', t.strong);
    root.setProperty('--wk-mid', t.mid);
    // Cada día de la semana toma su propio matiz dentro de la gama del color de la semana.
    const tr = treeOf(t.name);
    const dayTints = [tr.accent, tr.mid, tr.ink[0], tr.ink[1],
      'color-mix(in srgb,' + tr.accent + ' 55%,#ffffff)', 'color-mix(in srgb,' + tr.mid + ' 70%,#000000)'];
    dayTints.forEach((v, i) => root.setProperty('--d' + (i + 1), v));
    const day = themeNow() === 'day';
    // Semana negra de día: el cielo de la portada es oscuro, así que la portada usa letra clara.
    document.documentElement.dataset.sky = day && treeOf(t.name).daySky ? 'dark' : '';
    const bg = (day && treeOf(t.name).day) || treeOf(t.name).bg;
    root.setProperty('--bg-top', bg.top);
    root.setProperty('--bg-mid', bg.mid);
    root.setProperty('--bg-low', bg.low);
    root.setProperty('--bg-warm', bg.warm);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg.top);
    // Paisaje de la semana: una imagen fija por color (ancha para pantallas grandes, alta para celulares).
    if (shown !== t.name + day) {
      shown = t.name + day;
      const base = 'images/trees/' + t.name, suffix = day ? '-day' : '';
      $('hero').style.backgroundColor = bg.top;
      $('heroWide').srcset = base + '-wide' + suffix + '.webp';
      $('heroImg').src = base + '-tall' + suffix + '.webp';
    }
    preloadNeighbors(day);
  }
  window.addEventListener('resize', debounce(function () { if (Y) renderYear(); }, 200));

  function renderHeader() {
    const h = $('headerDate');
    h.textContent = '';
    const long = el('span', 'd-long', WEEKDAYS[now.getDay()] + ', ' + now.getDate() + ' de ' + MONTHS[now.getMonth()] + ', ' + now.getFullYear());
    const short = el('span', 'd-short', WEEKDAYS[now.getDay()].slice(0, 3) + ' ' + now.getDate() + ' ' + MONTHS[now.getMonth()].slice(0, 3) + ' ' + now.getFullYear());
    h.appendChild(long); h.appendChild(short);
    const sub = TODAY.inRange ? (TODAY.week === 0 && TODAY.Y.intro.cero ? 'Introducción' : 'Semana ' + num(TODAY.Y, TODAY.week) + ' de ' + totalWeeks(TODAY.Y))
      : TODAY.before ? 'Sunset ' + TODAY.Y.year + ' empieza el ' + fmtDate(TODAY.Y.intro ? dateOf(TODAY.Y, 0, TODAY.Y.intro.firstDay) : TODAY.Y.start)
        : 'Falta cargar la planilla del año siguiente';
    h.appendChild(el('small', null, sub));
  }

  const COLOR_ADJ = { Negro: 'negra', Rojo: 'roja', Azul: 'azul', Lila: 'lila', Verde: 'verde', Amarillo: 'amarilla', Blanco: 'blanca' };
  const COLOR_DOT = { Negro: '#141018', Rojo: '#d4392a', Azul: '#5a5fd0', Lila: '#9b59b6', Verde: '#4e9a3b', Amarillo: '#e8a90c', Blanco: '#ffffff' };
  function renderWeekBar() {
    const wk = weekAt(Y, viewing);
    const t = Y.themes[wk.col];
    const yi = yearIndex(Y.year);
    const tree = treeOf(t.name);
    $('weekNum').textContent = weekName(viewing) + (YEARS.length > 1 ? ' · ' + Y.year : '');
    // El color de la semana, dicho y mostrado: «● Semana negra» y debajo «17 al 23 · enero».
    const sub = $('weekSub');
    sub.textContent = '';
    const dot = el('i', 'week-dot');
    dot.style.background = COLOR_DOT[t.name] || tree.mid;
    sub.appendChild(dot);
    sub.appendChild(el('span', 'week-color', 'Semana ' + (COLOR_ADJ[t.name] || t.name.toLowerCase())));
    sub.appendChild(el('span', 'week-dates', wk.dates));   // siempre en su propia línea, igual en todas las semanas
    const tn = $('treeName');
    tn.textContent = tree.name;
    if (tree.sci) tn.appendChild(el('i', null, tree.sci));
    $('prevWeek').disabled = viewing <= minWeek(Y) && yi === 0;
    $('nextWeek').disabled = viewing >= Y.weeks.length && yi === YEARS.length - 1;
    $('todayBtn').hidden = !TODAY.inRange || (view === 'hoy' && hoyDate && sameDay(hoyDate, now));
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
    const wk = weekAt(Y, viewing);
    const card = $('sunday');
    card.innerHTML = '';
    card.classList.toggle('is-today', todayIndex() === 0);
    if (viewing === 0) {
      const head = el('div', 'card-day');
      head.appendChild(icon('sun'));
      head.appendChild(document.createTextNode('Semana ' + num(Y, 0) + (wk.cero ? ' · Introducción' : '') + ' · ' + wk.dates));
      card.appendChild(head);
    } else card.appendChild(dayHead(0, 'Título', 'sun'));
    card.appendChild(el('h1', 'sunday-title', wk.title));
    card.appendChild(el('p', 'sunday-hook', wk.hook));

    const btn = el('button', 'story-btn');
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(document.createTextNode('Historia'));
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
    if (viewing !== 0) card.appendChild(dayRecord(0));
  }

  function renderDays() {
    const wk = weekAt(Y, viewing);
    const wrap = $('days');
    wrap.innerHTML = '';
    // En la introducción solo están los dos días de enero que quedan antes de la semana 1: viernes y sábado.
    const cards = viewing === 0 ? wk.dias.map((d) => ({ day: d.dia, key: d.preguntas ? 'sabado' : 'texto', label: d.etiqueta, icon: d.preguntas ? 'check' : 'sun', intro: d })) : DAY_CARDS;
    cards.forEach(function (d) {
      const card = el('article', 'card day-' + d.day);
      card.classList.toggle('is-today', todayIndex() === d.day);
      card.appendChild(dayHead(d.day, d.label, d.icon));
      if (d.key === 'sabado') {
        const ol = el('ol', 'sat-list');
        (d.intro ? d.intro.preguntas : wk.sabado).forEach((q) => ol.appendChild(el('li', null, q)));
        card.appendChild(ol);
      } else {
        card.appendChild(phraseInto(el('p', 'card-text'), d.intro ? d.intro.texto : wk[d.key]));
      }
      card.appendChild(dayRecord(d.day));
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
      : done === 1 ? 'Autoevaluación completa' : Math.round(done * weekTotal(Y, viewing)) + ' de ' + weekTotal(Y, viewing) + ' preguntas respondidas';

    const rot = rotation(Y, viewing);
    const inPlay = $('inPlay');
    inPlay.innerHTML = '';
    inPlay.appendChild(document.createTextNode('En juego esta semana: '));
    rot.forEach(function (r, i) {
      inPlay.appendChild(i < 3 ? el('b', null, wordName(r.word)) : document.createTextNode(wordName(r.word)));
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
      label.appendChild(document.createTextNode(wordName(r.word)));
      c.appendChild(label);
      c.appendChild(el('span', 'chip-pct', pctText(Y, viewing, r.word)));
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
      const box = el('div', 'q' + (answers[qi] != null ? ' is-done' : ''));
      const txt = el('p', 'q-text');
      txt.appendChild(el('span', 'q-num', (qi + 1) + ''));
      txt.appendChild(document.createTextNode(q));
      box.appendChild(txt);
      box.appendChild(answerScale(answers[qi], weekLocked(Y, viewing), function (v) {
        setAnswer(Y, viewing, word, qi, v);
        box.classList.toggle('is-done', getAnswers(Y, viewing, word)[qi] != null);
        renderEvaluation();
        renderClosing();
        renderYear();
        renderBoard();
      }));
      qs.appendChild(box);
    });
    if (wordAnswered(Y, viewing, word)) {
      const tr = wordTrend(Y, viewing, word);
      qs.appendChild(el('p', 'q-trend', wordName(word) + ': ' + Math.round(wordScore(Y, viewing, word) * 100) + ' %' + (tr ? ' · ' + tr.text : '')));
    }
    qs.appendChild(el('div', 'field-label', 'Lo que me llevo de ' + wordName(word)));
    qs.appendChild(noteField(k(Y, viewing, 'c/' + word), 'Una frase de cierre (opcional)…', 1));
  }

  // Siete barras (domingo a sábado) con el ánimo de cada día y el promedio de la semana.
  function moodChart(YY, w) {
    const m = weekMood(YY, w);
    const box = el('div', 'mood-week');
    if (!m.n) {
      box.appendChild(el('p', 'field-hint', 'Todavía no registraste tu ánimo esta semana. Se marca con los cinco puntos del registro de cada día.'));
      return box;
    }
    const bars = el('div', 'mood-bars');
    bars.setAttribute('role', 'img');
    bars.setAttribute('aria-label', 'Ánimo por día: ' + m.vals.map((v, d) => WEEKDAYS[d] + ' ' + (v == null ? 'sin registrar' : v + ' de 5')).join(', '));
    m.vals.forEach(function (v, d) {
      const col = el('div', 'mood-col');
      const bar = el('div', 'mood-bar' + (v == null ? ' is-empty' : ''));
      const fill = el('i');
      fill.style.height = v == null ? '0%' : (v * 20) + '%';
      bar.appendChild(fill);
      col.appendChild(bar);
      col.appendChild(el('span', null, DAY_INITIALS[d]));
      bars.appendChild(col);
    });
    box.appendChild(bars);
    const known = m.vals.map((v, d) => ({ v: v, d: d })).filter((x) => x.v != null);
    const hi = known.reduce((b, x) => (x.v > b.v ? x : b), known[0]);
    const lo = known.reduce((b, x) => (x.v < b.v ? x : b), known[0]);
    let text = 'Promedio ' + fmt1(m.avg) + ' de 5 · ' + m.n + ' de 7 días registrados';
    if (m.n > 1 && hi.v !== lo.v) text += ' · mejor día: ' + WEEKDAYS[hi.d] + ' · más bajo: ' + WEEKDAYS[lo.d];
    box.appendChild(el('p', 'mood-note', text));
    return box;
  }

  function renderClosing() {
    const wrap = $('closing');
    wrap.innerHTML = '';
    $('closingLabel').textContent = viewing === 0 ? 'Para empezar' : 'Cierre de la semana';
    if (viewing === 0) {
      wrap.appendChild(el('div', 'field-label', 'Intención para la semana ' + num(Y, 1)));
      wrap.appendChild(el('p', 'field-hint', 'Lo que escribas aquí aparecerá el domingo como «Esta semana quiero…».'));
      wrap.appendChild(noteField(k(Y, 0, 'intencion'), 'La semana que viene quiero…', 2));
      return;
    }
    const col = weekAt(Y, viewing).col;
    const cm = colorMastery(Y, col);
    const cname = treeOf(Y.themes[col].name).name;
    wrap.appendChild(el('div', 'field-label', 'Maestría de ' + Y.themes[col].name));
    const lead = cm.leader ? ' Va primera: ' + cm.leader.word + ' (' + Math.round(cm.leader.m * 100) + '%).' : '';
    wrap.appendChild(el('p', 'field-hint', cm.complete
      ? 'Las 7 palabras ya pasaron por evaluación. La maestría de ' + Y.themes[col].name + ' es ' + cm.leader.word + ' (' + Math.round(cm.leader.m * 100) + '%), la de mejor calificación.'
      : cm.done + ' de 7 palabras evaluadas. Cuando pasen las 7, la de mejor calificación queda como maestría (' + cname + ').' + lead));

    wrap.appendChild(el('div', 'field-label', 'Ánimo de la semana'));
    wrap.appendChild(moodChart(Y, viewing));

    const sb = el('button', 'btn sum-btn', 'Ver el resumen de la semana');
    sb.type = 'button';
    sb.addEventListener('click', () => openSummary(Y, viewing));
    wrap.appendChild(sb);

    wrap.appendChild(el('div', 'field-label', '¿Qué funcionó? ¿Qué mejorar?'));
    wrap.appendChild(noteField(k(Y, viewing, 'funciono'), 'Mirando la semana completa…', 3));
    wrap.appendChild(el('div', 'field-label', 'Intención para la próxima semana'));
    wrap.appendChild(noteField(k(Y, viewing, 'intencion'), 'La semana que viene quiero…', 2));
  }

  // Ánimo del año: la misma rama, pero cada semana es un árbol que se pinta de abajo hacia arriba
  // según el promedio de ánimo (1 a 5). Árbol completo = semana genial.
  const CROWN = 'M5 14 C3 8 8 3 13 4 C15 1.5 20 2 21.5 5 C27 4.5 30 10 27.5 14.5 C28.5 19 24 22 20 21 L12 21 C8 22 4 19 5 14 Z';
  function moodTreeSVG(week, ink, avg) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.setAttribute('aria-hidden', 'true');
    const frac = avg == null ? 0 : Math.max(0, Math.min(1, avg / 5));
    const add = function (tag, attrs, parent) {
      const n = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach((x) => n.setAttribute(x, attrs[x]));
      (parent || svg).appendChild(n);
      return n;
    };
    const defs = add('defs', {});
    const cp = add('clipPath', { id: 'mt' + week }, defs);
    add('rect', { x: 0, y: 22 - 21 * frac, width: 32, height: 21 * frac + 1 }, cp);
    // tronco y ramas
    add('path', { class: 'mt-trunk', d: 'M16 31 L16 21 M16 26 L11.5 22 M16 25 L20.5 21.5', fill: 'none', stroke: 'rgba(255,255,255,.62)', 'stroke-width': 1.8, 'stroke-linecap': 'round' });
    // copa: contorno + relleno pintado
    add('path', { class: 'mt-crown' + (avg == null ? ' is-empty' : ''), d: CROWN, fill: 'rgba(255,255,255,.07)', stroke: 'rgba(255,255,255,' + (avg == null ? '.28' : '.55') + ')', 'stroke-width': 1, 'stroke-dasharray': avg == null ? '2 2' : 'none' });
    if (frac > 0) {
      const g = add('g', { 'clip-path': 'url(#mt' + week + ')' });
      add('path', { d: CROWN, fill: ink[0] }, g);
      add('circle', { cx: 11, cy: 12, r: 3.4, fill: ink[1], opacity: .85 }, g);
      add('circle', { cx: 21, cy: 9, r: 3.2, fill: ink[1], opacity: .85 }, g);
      add('circle', { cx: 17, cy: 16, r: 3.6, fill: ink[1], opacity: .75 }, g);
    }
    return svg;
  }
  function renderMoodYear() {
    if (!$('moodFold').open) { stale.mood = true; return; }
    stale.mood = false;
    const wrap = $('moodGrid');
    wrap.innerHTML = '';
    const per = wrap.clientWidth && wrap.clientWidth < 560 ? 7 : 13;
    const list = allWeeks(Y);
    for (let start = 0; start < list.length; start += per) {
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
      list.slice(start, start + per).forEach(function (wk) {
        const m = weekMood(Y, wk.week);
        const ink = treeOf(Y.themes[wk.col].name).ink;
        const b = el('button', 'yw mt');
        b.dataset.w = wk.week;
        b.type = 'button';
        b.setAttribute('aria-label', 'Semana ' + num(Y, wk.week) + ': ' + (m.n ? 'ánimo promedio ' + fmt1(m.avg) + ' de 5' : 'sin ánimo registrado'));
        b.title = 'Semana ' + num(Y, wk.week) + (m.n ? ' · ánimo ' + fmt1(m.avg) + '/5' : ' · sin registrar');
        b.appendChild(moodTreeSVG(wk.week, ink, m.n ? m.avg : null));
        b.appendChild(el('span', null, String(num(Y, wk.week))));
        if (wk.week === viewing) b.classList.add('is-viewing');
        if (TODAY.inRange && Y === TODAY.Y && wk.week === TODAY.week) b.classList.add('is-current');
        b.addEventListener('click', function () { goTo(Y, wk.week); });
        row.appendChild(b);
      });
      wrap.appendChild(row);
    }
  }
  $('boardFold').addEventListener('toggle', function () { if (this.open && stale.board) renderBoard(); });
  $('moodFold').addEventListener('toggle', function () { if (this.open && stale.mood) renderMoodYear(); });

  // Progreso del año: ramas con una flor por semana. La flor se abre según lo respondido.
  // Progreso, ánimo del año y tablero son las vistas más pesadas (más de 150 dibujos): solo se dibujan con su plegable
  // abierto. Al cambiar de semana, si están abiertas, solo se mueve la marca de la semana vista.
  const stale = { year: true, mood: true, board: true };
  let shownYear = null;
  function markViewing() {
    ['yearGrid', 'moodGrid'].forEach(function (id) {
      $(id).querySelectorAll('.yw').forEach((b) => b.classList.toggle('is-viewing', Number(b.dataset.w) === viewing));
    });
  }
  // Meta del año: registrar el 70 % de los días (no se busca perfección). Cuenta los días ya vividos del año.
  const YEAR_GOAL = 0.7;
  function renderYearGoal() {
    const box = $('yearGoal');
    box.innerHTML = '';
    let lived = 0, reg = 0;
    const today = utcDay(now);
    allWeeks(Y).forEach(function (wk) {
      for (let d = 0; d < 7; d++) {
        if (wk.week === 0 && !introDay(wk, d)) continue;
        if (utcDay(dateOf(Y, wk.week, d)) > today) continue;
        lived++;
        if (dayHasEntry(Y, wk.week, d)) reg++;
      }
    });
    box.appendChild(el('div', 'field-label', 'Registro del año'));
    if (!lived) { box.appendChild(el('p', 'year-goal-text', 'El año todavía no empezó. La meta: registrar el 70 % de los días.')); return; }
    const pct = reg / lived;
    box.appendChild(el('p', 'year-goal-num', Math.round(pct * 100) + ' %'));
    const bar = el('div', 'year-goal-bar');
    bar.setAttribute('aria-hidden', 'true');
    const fill = el('span', 'year-goal-fill');
    fill.style.width = Math.min(100, pct * 100) + '%';
    bar.appendChild(fill);
    const mark = el('span', 'year-goal-mark');
    mark.style.left = YEAR_GOAL * 100 + '%';
    bar.appendChild(mark);
    box.appendChild(bar);
    const missing = Math.ceil(YEAR_GOAL * lived - reg);
    box.classList.toggle('is-done', pct >= YEAR_GOAL);
    box.appendChild(el('p', 'year-goal-text', reg + ' de ' + lived + ' días con registro. '
      + (pct >= YEAR_GOAL ? 'Logro alcanzado: estás sobre el 70 %.' : 'Meta: 70 % de los días, sin buscar perfección. Te faltan ' + missing + (missing === 1 ? ' día' : ' días') + ' para llegar.')));
  }
  function renderYear() {
    renderMoodYear();
    if (!$('yearFold').open) { stale.year = true; return; }
    stale.year = false;
    shownYear = Y;
    const wrap = $('yearGrid');
    wrap.innerHTML = '';
    const per = wrap.clientWidth && wrap.clientWidth < 560 ? 7 : 13;
    const list = allWeeks(Y);
    for (let start = 0; start < list.length; start += per) {
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
      list.slice(start, start + per).forEach(function (wk) {
        const t = Y.themes[wk.col];
        const done = weekCompletion(Y, wk.week);
        const b = el('button', 'yw');
        b.dataset.w = wk.week;
        b.setAttribute('aria-label', 'Semana ' + num(Y, wk.week) + ', ' + wk.dates + ', ' + Math.round(done * 100) + '% respondido' + '');
        b.title = 'Semana ' + num(Y, wk.week) + ' · ' + treeOf(t.name).name + ' · ' + Math.round(done * 100) + '%';
        b.appendChild(window.SunsetTree.flowerSVG(treeOf(t.name).ink, done, false));
        b.appendChild(el('span', null, String(num(Y, wk.week))));
        if (wk.week === viewing) b.classList.add('is-viewing');
        if (TODAY.inRange && Y === TODAY.Y && wk.week === TODAY.week) b.classList.add('is-current');
        b.addEventListener('click', function () { goTo(Y, wk.week); });
        row.appendChild(b);
      });
      wrap.appendChild(row);
    }
  }
  $('yearFold').addEventListener('toggle', function () { if (this.open && stale.year) renderYear(); });

  function champion(words) {
    let best = null;
    words.forEach(function (w) {
      const m = mastery(Y, w);
      if (m > 0 && (!best || m > best.m)) best = { word: w, m: m };
    });
    return best;
  }

  function renderBoard() {
    if (!$('boardFold').open) { stale.board = true; return; }
    stale.board = false;
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
          const n = isMastery(Y, c, word) ? 1 : 0;
          const t = Y.themes[c];
          const sq = el('button', 'sq ' + ((r + c) % 2 ? 'dark' : 'light'));
          const bloom = el('span', 'bloom');
          bloom.appendChild(window.SunsetTree.flowerSVG(treeOf(t.name).ink, m, n > 0));
          sq.appendChild(bloom);
          const lbl = el('span', 'lbl', wordName(word));
          if (m > 0) lbl.appendChild(el('small', null, (m > 0 ? Math.round(m * 100) + '%' : '')));
          sq.appendChild(lbl);
          const next = nextEvalWeek(Y, word, viewing);   // para el título; al tocar se recalcula con la semana vista
          sq.title = word + ' · ' + Y.dimensions[r] + ' · ' + t.name + (n ? ' · maestría del color' : '') + ' · próxima evaluación: semana ' + num(Y, next);
          sq.addEventListener('click', function () { goTo(Y, nextEvalWeek(Y, word, viewing)); });
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
    legend.appendChild(el('span', null, 'Centro dorado = maestría del color (la mejor de sus 7 palabras)'));
  }

  // ── Las siete palabras de la semana ──
  // Toda la columna del tablero está "en juego"; los iconos no se atan a ningún día de la semana.
  let selDim = null;

  function renderDims() {
    const wk = weekAt(Y, viewing);
    const nav = $('dims');
    hideCap();
    Array.from(nav.querySelectorAll('.dim')).forEach((n) => n.remove());
    selDim = null;
    for (let d = 0; d < 7; d++) {
      const word = Y.board[d][wk.col];
      const evaluated = viewing !== 0 && ((d - wk.phase + 7) % 7) < 3;
      const b = el('button', 'dim' + (evaluated ? ' is-eval' : '') + (d === selDim ? ' is-sel' : ''));
      b.type = 'button';
      b.dataset.d = d;
      b.setAttribute('aria-label', 'Abrir ' + wordName(word) + ' (' + Y.dimensions[d] + ')' + (evaluated ? '. Palabra principal: se evalúa esta semana' : '. Está en juego pero se evalúa otra semana'));
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'dim-ico');
      svg.setAttribute('viewBox', '0 0 48 48');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#d-' + d);
      svg.appendChild(use);
      b.appendChild(svg);
      b.addEventListener('click', function () {
        if (selDim === d && !$('dimCap').hidden) { hideCap(); return; }
        selDim = d;
        markSelected();
        showCap(d, word, evaluated);
      });
      nav.appendChild(b);
    }
    requestAnimationFrame(function () { markSelected(true); });
  }
  // Al tocar un ícono aparece su dimensión, la palabra y el acceso a sus preguntas.
  function showCap(d, word, evaluated) {
    $('capDim').textContent = Y.dimensions[d];
    $('capWord').textContent = wordName(word);
    $('capTag').textContent = evaluated ? 'Principal' : 'En juego';
    $('capTag').classList.toggle('is-main', evaluated);
    $('capGo').textContent = 'Abrir';
    $('capGo').onclick = function () { accessWord(d, word, evaluated); };
    const c = DIM_CONCEPTS[d] || ['', ''];
    $('capDef').textContent = c[0];
    $('capAsk').textContent = c[1];
    const cap = $('dimCap');
    cap.hidden = false;
    cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
  }
  function hideCap() { $('dimCap').hidden = true; }
  // Cada ícono es la entrada a su palabra. Las tres principales llevan a la autoevaluación con la palabra
  // abierta; las otras cuatro (en juego, pero no evaluadas esta semana) abren una ficha con sus preguntas.
  // Al abrir un ícono se muestra la ficha completa: qué es la dimensión, su pregunta, para qué sirve, sus 7 palabras
  // (una por color) y la palabra de esta semana con sus preguntas. Desde ahí se va a la autoevaluación.
  function accessWord(d, word, evaluated) {
    const c = DIM_CONCEPTS[d] || ['', ''];
    $('wordEyebrow').textContent = Y.dimensions[d];
    $('dimDef').textContent = c[0];
    $('dimAsk').textContent = c[1];
    $('dimAbout').textContent = DIM_ABOUT[d] || '';
    const words = $('dimWords');
    words.innerHTML = '';
    (Y.board[d] || []).forEach(function (w, col) {
      const li = el('li', w === word ? 'is-now' : null);
      const dot = el('span', 'dim-word-dot');
      dot.style.background = COLOR_DOT[Y.colors[col].name] || 'transparent';
      li.appendChild(dot);
      li.appendChild(el('span', null, wordName(w)));
      li.title = 'Semana ' + COLOR_ADJ[Y.colors[col].name];
      if (w === word) li.setAttribute('aria-current', 'true');
      words.appendChild(li);
    });
    $('wordTitle').textContent = wordName(word);
    const list = $('wordQs');
    list.innerHTML = '';
    (Y.questions[word] || []).forEach((q) => list.appendChild(el('li', null, q)));
    const go = $('wordGo');
    if (evaluated) {
      $('wordWhen').textContent = 'Es una de las 3 palabras principales de esta semana. Te evalúas con estas ' + qCount(Y, word) + ' preguntas, de 1 (nunca) a 5 (siempre), repartidas de lunes a viernes:';
      go.textContent = 'Responder la autoevaluación';
      go.onclick = function () {
        closeWord();
        if (view !== 'semana') { view = 'semana'; render(); }
        openWord = word;
        renderEvaluation();
        $('evaluation').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    } else {
      const next = nextEvalWeek(Y, word, viewing);
      const nw = Y.weeks[next - 1];
      $('wordWhen').textContent = 'Está en juego esta semana, pero se evalúa en la semana ' + num(Y, next) + ' (' + nw.dates + '). Estas son sus preguntas:';
      go.textContent = next === viewing ? 'Ver la autoevaluación' : 'Ir a la semana ' + num(Y, next);
      go.onclick = function () { closeWord(); if (view !== 'semana') view = 'semana'; goTo(Y, next); };
    }
    $('wordModal').hidden = false;
    $('wordModal').querySelector('.modal-box').scrollTop = 0;
    go.focus({ preventScroll: true });
  }
  function closeWord() { $('wordModal').hidden = true; }
  $('wordClose').addEventListener('click', closeWord);
  $('wordModal').addEventListener('click', function (e) { if (e.target === this) closeWord(); });

  // Mueve el marco dorado hasta la palabra elegida.
  function markSelected(instant) {
    const nav = $('dims'), glow = $('dimGlow');
    nav.querySelectorAll('.dim').forEach((n) => n.classList.toggle('is-sel', Number(n.dataset.d) === selDim));
    const item = selDim === null ? null : nav.querySelector('.dim[data-d="' + selDim + '"]');
    if (!item) { glow.classList.remove('on'); return; }
    if (instant) glow.style.transition = 'none';
    glow.style.width = item.offsetWidth + 'px';
    glow.style.transform = 'translateX(' + item.offsetLeft + 'px)';
    glow.classList.add('on');
    if (instant) { void glow.offsetWidth; glow.style.transition = ''; }
    // En pantallas angostas la franja se desplaza: dejar la palabra elegida a la vista.
    const want = item.offsetLeft - (nav.clientWidth - item.offsetWidth) / 2;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: Math.max(0, want), behavior: instant ? 'auto' : 'smooth' });
  }
  window.addEventListener('resize', debounce(function () { if (Y) markSelected(true); }, 200));

  // ── Frase del día (tarjeta de vidrio de la portada) ──
  function renderToday() {
    const wk = weekAt(Y, viewing);
    const day = todayIndex();
    const label = $('todayLabel'), text = $('todayText'), more = $('todayMore');
    let full = '';
    if (day >= 0 && viewing === 0) {
      const idia = introDay(wk, day);
      label.textContent = (idia ? idia.etiqueta : 'Introducción') + ' · ' + WEEKDAYS[day];
      full = introText(idia) || wk.hook;
    } else if (day >= 0) {
      const c = day === 0 ? null : DAY_CARDS.find((x) => x.day === day);
      label.textContent = (c ? c.label : 'La frase de la semana') + ' · ' + WEEKDAYS[day];
      full = day === 0 ? wk.hook : c.key === 'sabado' ? wk.sabado.join('  ') : wk[c.key];
    } else {
      label.textContent = 'La frase de la semana';
      full = wk.hook;
    }
    phraseInto(text, full);
    more.hidden = day < 0 || full.length < 140;
    // Tocar la frase lleva a la tarjeta completa de ese día.
    const toCard = function () {
      if (day < 0) return;
      const target = viewing === 0 ? document.querySelectorAll('#days .card')[Math.max(0, wk.dias.findIndex((x) => x.dia === day))] : day >= 1 ? document.querySelectorAll('#days .card')[day - 1] : $('sunday');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    more.onclick = toCard;
    text.onclick = toCard;
    text.style.cursor = day < 0 ? 'default' : 'pointer';
    $('today').classList.toggle('is-phrase', day <= 0);
  }

  // El versículo de la semana: el @Regalo del lunes, fijo y discreto durante toda la semana.
  function renderVerse() {
    const p = $('verse');
    const raw = String(weekAt(Y, viewing).regalo || '').trim();
    const m = raw.match(/^(.*?)\s+—\s+(.+)$/s);
    p.textContent = '';
    p.hidden = !raw;
    if (!raw) return;
    p.appendChild(document.createTextNode(m ? m[1] : raw));
    if (m) p.appendChild(el('cite', null, m[2]));
  }

  // Lo que se anotó como intención la semana pasada, como recordatorio sutil al empezar esta.
  // La semana 1 del primer año cargado no tiene semana anterior: ahí se escribe a mano (clave AAAA/w0/intencion).
  // Si existe el año anterior, la semana 1 continúa la última semana de ese año.
  function renderIntent() {
    const p = $('intent');
    const prev = viewing === 1 ? YEARS[yearIndex(Y.year) - 1] : null;
    const starter = viewing === 1 && !prev && !Y.intro;
    let text = '';
    if (viewing === 1 && Y.intro) {
      text = String(getV(k(Y, 0, 'intencion'), '')).trim();
      const before = YEARS[yearIndex(Y.year) - 1];
      if (!text && before) text = String(getV(k(before, before.weeks.length, 'intencion'), '')).trim();
    }
    else if (viewing > 1) text = String(getV(k(Y, viewing - 1, 'intencion'), '')).trim();
    else if (prev) text = String(getV(k(prev, prev.weeks.length, 'intencion'), '')).trim();
    p.textContent = '';
    p.hidden = viewing === 0 || (!text && !starter);
    if (p.hidden) return;
    p.classList.toggle('is-edit', starter);
    p.appendChild(el('span', 'intent-label', 'Esta semana quiero…'));
    if (starter) p.appendChild(noteField(Y.year + '/w0/intencion', 'Para empezar, ¿qué quiero esta primera semana?', 1));
    else p.appendChild(document.createTextNode(' ' + text));
  }

  // Aviso de semana cerrada, con su nota posterior (lo único que se puede escribir en ella).
  function lockNote(YY, w) {
    const box = el('div', 'lock-box');
    box.appendChild(el('p', 'lock-msg', 'Esta semana ya cerró: puedes leerla, pero no modificarla. Puedes dejar una nota explicando por qué no se registró; la nota queda en tu diario, pero ya no suma a tus estadísticas (racha, ánimo ni evaluación).'));
    box.appendChild(el('div', 'field-label', 'Nota posterior'));
    box.appendChild(noteField(k(YY, w, 'nota'), 'Por qué no pude registrar esta semana, o algo que quiera agregar…', 2));
    return box;
  }
  function renderLock() {
    const box = $('lockBox');
    box.innerHTML = '';
    box.hidden = !weekLocked(Y, viewing);
    if (!box.hidden) box.appendChild(lockNote(Y, viewing));
  }
  function render() {
    if (view === 'hoy') {
      const hl = hoyDate && locateDate(hoyDate);
      if (!(hl && hl.inRange && hl.Y === Y && hl.week === viewing)) view = 'semana';
    }
    document.body.classList.toggle('view-hoy', view === 'hoy');
    document.body.classList.toggle('view-ano', view === 'ano');
    document.body.classList.toggle('view-semana', view === 'semana');
    $('anoTitle').textContent = 'Mi año ' + Y.year;
    if (view === 'ano') renderYearGoal();
    document.body.classList.toggle('is-intro', viewing === 0);
    renderHoy();
    markJump();
    applyTheme();
    renderVerse();
    renderAgenda();
    renderAgo();
    renderRecursos();
    renderIntent();
    renderLock();
    renderWeekBar();
    renderDims();
    renderToday();
    renderSunday();
    renderDays();
    renderEvaluation();
    renderClosing();
    // Lo pesado solo se redibuja si cambió algo; si no, basta con mover la marca de la semana vista.
    if (stale.year || stale.mood || stale.board || Y !== shownYear || dataVer !== drawnVer) {
      drawnVer = dataVer;
      renderYear();
      renderBoard();
    } else markViewing();
  }
  let drawnVer = -1;

  // ── Buscador: todo lo escrito (registros, gratitud, comentarios, cierre e intención) ──
  const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function entryLabel(rest) {
    let m;
    if ((m = rest.match(/^d(\d)$/))) return WEEKDAYS[Number(m[1])] + ' · Registro';
    if ((m = rest.match(/^g(\d)$/))) return WEEKDAYS[Number(m[1])] + ' · Gratitud';
    if ((m = rest.match(/^c\/(.+)$/))) return 'Lo que me llevo de ' + wordName(m[1]);
    if (rest === 'funciono') return 'Cierre · Qué funcionó';
    if (rest === 'intencion') return 'Intención para la semana siguiente';
    if (rest === 'nota') return 'Nota posterior';
    return null;
  }
  function searchEntries(q) {
    const needle = fold(q.trim());
    const out = [];
    if (needle.length < 2) return out;
    Object.keys(state.entries).forEach(function (key) {
      const e = state.entries[key];
      if (!e || typeof e.v !== 'string' || !e.v.trim()) return;
      const m = key.match(/^(\d{4})\/w(\d+)\/(.+)$/);
      if (!m) return;
      const label = entryLabel(m[3]);
      if (!label) return;
      const at = fold(e.v).indexOf(needle);
      if (at < 0) return;
      out.push({ year: Number(m[1]), week: Number(m[2]), label: label, text: e.v, at: at, len: needle.length });
    });
    out.sort((x, y) => (y.year - x.year) || (y.week - x.week));
    return out;
  }
  function renderSearch() {
    const list = $('searchResults');
    const q = $('searchInput').value;
    list.textContent = '';
    const found = searchEntries(q);
    if (q.trim().length < 2) { list.appendChild(el('li', 'results-empty', 'Escribe al menos dos letras.')); return; }
    if (!found.length) { list.appendChild(el('li', 'results-empty', 'No encontré nada con “' + q.trim() + '”.')); return; }
    found.slice(0, 60).forEach(function (r) {
      const li = el('li');
      const b = el('button', 'result');
      b.type = 'button';
      b.appendChild(el('span', 'result-where', weekName(r.week, YEARS[yearIndex(r.year)] || Y) + ' · ' + r.year + ' · ' + r.label));
      const from = Math.max(0, r.at - 50), to = Math.min(r.text.length, r.at + r.len + 90);
      const snip = el('span', 'result-text');
      snip.appendChild(document.createTextNode((from > 0 ? '…' : '') + r.text.slice(from, r.at)));
      snip.appendChild(el('mark', null, r.text.slice(r.at, r.at + r.len)));
      snip.appendChild(document.createTextNode(r.text.slice(r.at + r.len, to) + (to < r.text.length ? '…' : '')));
      b.appendChild(snip);
      b.addEventListener('click', function () {
        const yr = YEARS[yearIndex(r.year)];
        closeSearch();
        if (yr) goTo(yr, r.week);
      });
      li.appendChild(b); list.appendChild(li);
    });
    if (found.length > 60) list.appendChild(el('li', 'results-empty', 'Hay ' + found.length + ' resultados; mostrando los 60 más recientes. Afina la búsqueda.'));
  }
  function openSearch() {
    $('search').hidden = false;
    document.documentElement.classList.add('no-scroll');
    $('searchInput').focus();
    renderSearch();
  }
  function closeSearch() {
    $('search').hidden = true;
    document.documentElement.classList.remove('no-scroll');
    $('searchBtn').focus({ preventScroll: true });
  }
  $('searchBtn').addEventListener('click', openSearch);
  $('searchDone').addEventListener('click', closeSearch);
  $('searchInput').addEventListener('input', debounce(renderSearch, 150));

  // ── Diario en documento, agenda de Google y recordatorio diario ──
  const gcal = (mode, d) => 'https://calendar.google.com/calendar/r/' + mode + '/' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  const fullDate = (d) => WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear();
  // «Hace un año»: lo escrito en esta misma semana del año anterior (claves AAAA-1/wN/...).
  function yearAgo(YY, week) {
    const y = YY.year - 1;
    const pre = y + '/w' + week + '/';
    const prevY = YEARS[yearIndex(y)];
    const days = [];
    for (let d = 0; d < 7; d++) {
      const rec = String(getV(pre + 'd' + d, '')).trim();
      const grat = String(getV(pre + 'g' + d, '')).trim();
      const mood = getV(pre + 'm' + d, null);
      if (!rec && !grat && mood == null) continue;
      days.push({ d: d, rec: rec, grat: grat, mood: mood, date: prevY ? dateOf(prevY, week, d) : null });
    }
    const funciono = String(getV(pre + 'funciono', '')).trim();
    const intencion = String(getV(pre + 'intencion', '')).trim();
    return { year: y, days: days, funciono: funciono, intencion: intencion, any: days.length > 0 || !!funciono || !!intencion };
  }
  function renderAgo() {
    const box = $('ago');
    const g = yearAgo(Y, viewing);
    box.textContent = '';
    box.hidden = !g.any;
    box.open = false;
    if (!g.any) return;
    const sum = el('summary', null, 'Hace un año · esta misma semana (' + g.year + ')');
    box.appendChild(sum);
    const body = el('div', 'ago-body');
    g.days.forEach(function (x) {
      const item = el('div', 'ago-day');
      const when = WEEKDAYS[x.d] + (x.date ? ' ' + x.date.getDate() + ' de ' + MONTHS[x.date.getMonth()] : '');
      item.appendChild(el('h3', null, when + (x.mood != null ? ' · ánimo ' + x.mood + '/5' : '')));
      if (x.rec) item.appendChild(el('p', null, x.rec));
      if (x.grat) item.appendChild(el('p', 'ago-grat', 'Gratitud: ' + x.grat));
      body.appendChild(item);
    });
    if (g.funciono) { const i = el('div', 'ago-day'); i.appendChild(el('h3', null, 'Qué funcionó y qué mejorar')); i.appendChild(el('p', null, g.funciono)); body.appendChild(i); }
    if (g.intencion) { const i = el('div', 'ago-day'); i.appendChild(el('h3', null, 'Lo que quería para la semana siguiente')); i.appendChild(el('p', null, g.intencion)); body.appendChild(i); }
    box.appendChild(body);
  }

  // «Para profundizar»: el tema de interés de la semana (Relaciones del pensamiento de Richarh Rojas; los otros seis de autores
  // reconocidos) con una tanda de 4 elementos que rota cada vez que vuelve el color, y, plegado, el material de las palabras principales.
  const RES_KINDS = [['richarh', 'De Richarh Rojas'], ['principio', 'Principio'], ['idea', 'Idea'], ['frase', 'Frase'], ['dato', 'Dato'], ['autor', 'Aprendo de'], ['recordar', 'Para recordar']];
  function resItem(i) {
    const kd = RES_KINDS.find((x) => x[0] === i.k) || [i.k, i.k];
    const row = el('div', 'res-item res-' + i.k);
    row.appendChild(el('span', 'res-kind', kd[1]));
    row.appendChild(el('p', 'res-text', i.t));
    if (i.s || i.v) {
      const src = el('p', 'res-src', i.s || '');
      if (i.v) src.appendChild(el('em', 'res-pend', ' · por verificar'));
      row.appendChild(src);
    }
    return row;
  }
  function renderRecursos() {
    const box = $('recursos');
    const wk = weekAt(Y, viewing);
    if (viewing === 0) { box.hidden = true; box.textContent = ''; return; }
    const interest = Y.board[2][wk.col];
    // Cuántas veces ha aparecido este color hasta esta semana: decide qué tanda del tema toca.
    let occ = 0;
    for (let w = 1; w <= viewing; w++) if (Y.weeks[w - 1].col === wk.col) occ++;
    const sets = TEMAS[interest] || [];
    const set = sets.length ? sets[(occ - 1) % sets.length] : [];
    const words = activeWords(Y, viewing).map((a) => ({ word: a.word, dim: Y.dimensions[a.dim] })).filter((w) => w.word !== interest && (RECURSOS[w.word] || []).length);
    const shown = new Set(set.map((i) => i.t));
    box.textContent = '';
    box.hidden = !set.length && !words.length;
    box.open = false;
    if (box.hidden) return;
    const sum = el('summary');
    sum.appendChild(icon('bulb'));
    sum.appendChild(el('span', null, 'Para profundizar · ' + interest));
    sum.appendChild(icon('down', 'chev'));
    box.appendChild(sum);
    const body = el('div', 'fold-body');
    body.appendChild(el('p', 'fold-hint', 'Tema de interés de la semana: ' + interest + '. ' + (interest === 'Relaciones'
      ? 'Aquí hablan tus propias ideas sobre las relaciones personales.'
      : 'Aquí aprendes de autores reconocidos.') + ' Lo marcado «por verificar» conviene confirmarlo en su fuente antes de usarlo en público.'));
    set.forEach((i) => body.appendChild(resItem(i)));
    if (words.length) {
      const sub = el('details', 'res-sub');
      sub.appendChild(el('summary', null, 'Sobre las palabras de la semana'));
      words.forEach(function (w) {
        const sec = el('section', 'res-word');
        sec.appendChild(el('h3', null, wordName(w.word)));
        RES_KINDS.forEach((kd) => RECURSOS[w.word].filter((i) => i.k === kd[0] && !shown.has(i.t)).forEach((i) => sec.appendChild(resItem(i))));
        sub.appendChild(sec);
      });
      body.appendChild(sub);
    }
    box.appendChild(body);
  }

  function renderAgenda() {
    const wk = weekAt(Y, viewing);
    const day = todayIndex();
    const base = day >= 0 ? dateOf(Y, viewing, day) : dateOf(Y, viewing, viewing === 0 ? weekAt(Y, 0).firstDay : 0);
    $('agendaDay').href = gcal('day', base);
    $('agendaDay').textContent = day >= 0 ? 'Agenda de hoy' : (viewing === 0 ? 'Agenda del ' : 'Agenda del domingo ') + base.getDate();
    $('agendaWeek').href = gcal('week', dateOf(Y, viewing, viewing === 0 ? weekAt(Y, 0).firstDay : 0));
    const link = $('agendaLink');
    link.href = gcal(day >= 0 ? 'day' : 'week', base);
    link.textContent = day >= 0 ? 'Ver mi agenda de hoy ↗' : 'Ver la agenda de esta semana ↗';
    const evBox = $('agendaEvents');
    evBox.textContent = '';
    evBox.hidden = !(CONFIG.googleClientId && day >= 0);
    if (!evBox.hidden) evBox.appendChild(agendaBox(now));
    void wk;
  }

  // Estructura común del diario: [{ title, lines: [...] }] por semana con contenido.
  function diaryWeeks(YY, onlyWeek) {
    const out = [];
    allWeeks(YY).forEach(function (wk) {
      const w = wk.week;
      if (onlyWeek !== undefined && onlyWeek !== null && w !== onlyWeek) return;
      const lines = [];
      for (let d = 0; d < 7; d++) {
        const rec = String(getV(k(YY, w, 'd' + d), '')).trim();
        const grat = String(getV(k(YY, w, 'g' + d), '')).trim();
        const mood = getV(k(YY, w, 'm' + d), null);
        const pct = getV(k(YY, w, 'p' + d), null);
        if (!rec && !grat && mood == null && pct == null) continue;
        const date = dateOf(YY, w, d);
        const meta = [mood != null ? 'Ánimo ' + mood + '/5 (' + MOOD_NAMES[mood - 1] + ')' : '', pct != null ? 'Cumplimiento ' + pct + '%' : ''].filter(Boolean).join(' · ');
        lines.push({ h: WEEKDAYS[d] + ' ' + date.getDate() + ' de ' + MONTHS[date.getMonth()], meta: meta, text: rec, grat: grat });
      }
      const notes = [];
      activeWords(YY, w).forEach(function (a) {
        const c = String(getV(k(YY, w, 'c/' + a.word), '')).trim();
        if (c) notes.push({ label: 'Lo que me llevo de ' + wordName(a.word), text: c });
      });
      const f = String(getV(k(YY, w, 'funciono'), '')).trim();
      const i = String(getV(k(YY, w, 'intencion'), '')).trim();
      if (f) notes.push({ label: 'Qué funcionó y qué mejorar', text: f });
      if (i) notes.push({ label: 'Intención para la semana siguiente', text: i });
      const nt = String(getV(k(YY, w, 'nota'), '')).trim();
      if (nt) notes.push({ label: 'Nota posterior', text: nt });
      if (!lines.length && !notes.length) return;
      out.push({ title: weekName(w, YY) + ' · ' + YY.themes[wk.col].name + ' · ' + wk.dates + ' · ' + YY.year, subtitle: wk.title, days: lines, notes: notes });
    });
    return out;
  }
  let diaryCache = null;
  function openDiary(scope) {
    const only = scope === 'week' ? viewing : null;
    const weeks = diaryWeeks(Y, only);
    diaryCache = { weeks: weeks, name: scope === 'week' ? 'semana-' + num(Y, viewing) + '-' + Y.year : 'diario-' + Y.year };
    $('diaryEyebrow').textContent = scope === 'week' ? weekName(viewing) + ' · ' + Y.year : 'Año ' + Y.year;
    $('diaryTitle').textContent = 'Tu diario';
    const doc = $('diaryDoc');
    doc.textContent = '';
    doc.appendChild(el('h1', null, 'Sunset ' + Y.year + ' · Diario'));
    doc.appendChild(el('p', 'diary-sub', 'Richarh Rojas · generado el ' + fullDate(new Date())));
    if (!weeks.length) doc.appendChild(el('p', null, scope === 'week' ? 'Todavía no escribiste nada en esta semana.' : 'Todavía no escribiste nada este año.'));
    weeks.forEach(function (wk) {
      const sec = el('section', 'diary-week');
      sec.appendChild(el('h2', null, wk.title));
      if (wk.subtitle) sec.appendChild(el('p', 'diary-sub', wk.subtitle));
      wk.days.forEach(function (d) {
        const box = el('div', 'diary-day');
        box.appendChild(el('h3', null, d.h));
        if (d.meta) box.appendChild(el('p', 'diary-meta', d.meta));
        if (d.text) box.appendChild(el('p', 'diary-text', d.text));
        if (d.grat) box.appendChild(el('p', 'diary-grat', 'Gratitud: ' + d.grat));
        sec.appendChild(box);
      });
      wk.notes.forEach(function (n) {
        const box = el('div', 'diary-day');
        box.appendChild(el('h3', null, n.label));
        box.appendChild(el('p', 'diary-text', n.text));
        sec.appendChild(box);
      });
      doc.appendChild(sec);
    });
    $('diary').hidden = false;
    document.documentElement.classList.add('no-scroll');
    $('diaryClose').focus();
  }
  function closeDiary() {
    $('diary').hidden = true;
    document.documentElement.classList.remove('no-scroll');
  }
  function diaryAsText() {
    const lines = ['SUNSET ' + Y.year + ' · DIARIO', 'Richarh Rojas', ''];
    diaryCache.weeks.forEach(function (wk) {
      lines.push('## ' + wk.title);
      if (wk.subtitle) lines.push('_' + wk.subtitle + '_');
      lines.push('');
      wk.days.forEach(function (d) {
        lines.push('### ' + d.h);
        if (d.meta) lines.push(d.meta);
        if (d.text) lines.push('', d.text);
        if (d.grat) lines.push('', 'Gratitud: ' + d.grat);
        lines.push('');
      });
      wk.notes.forEach(function (n) { lines.push('### ' + n.label, '', n.text, ''); });
    });
    return lines.join('\n');
  }
  $('diaryWeekBtn').addEventListener('click', () => openDiary('week'));
  $('diaryYearBtn').addEventListener('click', () => openDiary('year'));
  $('diaryClose').addEventListener('click', closeDiary);
  $('diaryPrint').addEventListener('click', () => window.print());
  $('diaryText').addEventListener('click', function () {
    if (!diaryCache) return;
    download('sunset-' + diaryCache.name + '.md', diaryAsText(), 'text/markdown;charset=utf-8');
    toast('Diario descargado');
  });

  // Recordatorio diario: un evento que se repite cada día, con aviso, para abrir en cualquier agenda (.ics).
  try { const t = localStorage.getItem('sunset_rem_time'); if (t) $('remTime').value = t; } catch (e) { /* sin almacenamiento */ }
  $('remBtn').addEventListener('click', function () {
    const time = $('remTime').value || '21:00';
    try { localStorage.setItem('sunset_rem_time', time); } catch (e) { /* sin almacenamiento */ }
    const hh = time.slice(0, 2), mm = time.slice(3, 5);
    const n = new Date();
    const ymd = n.getFullYear() + String(n.getMonth() + 1).padStart(2, '0') + String(n.getDate()).padStart(2, '0');
    const utc = n.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sunset//Diario//ES', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:sunset-registro-diario@sunset.app', 'DTSTAMP:' + utc,
      'DTSTART:' + ymd + 'T' + hh + mm + '00', 'DURATION:PT10M', 'RRULE:FREQ=DAILY',
      'SUMMARY:Sunset · Mi registro del día', 'DESCRIPTION:Escribe tu registro, tu gratitud y cómo te sentiste hoy.',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Sunset · Mi registro del día', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    download('sunset-recordatorio.ics', ics, 'text/calendar;charset=utf-8');
    toast('Recordatorio descargado: ábrelo para agregarlo a tu agenda');
  });

  // ════ Uso diario: modo 2 minutos, racha, pregunta del día, resumen de la semana y dictado ════

  // Frase de un día concreto: el @ del día, o la frase de la semana el domingo.
  function dayPhrase(YY, w, day) {
    const wk = weekAt(YY, w);
    if (w === 0) { const d = introDay(wk, day); return { label: d ? d.etiqueta : 'Introducción', text: introText(d) || wk.hook }; }
    if (day === 0) return { label: 'La frase de la semana', text: wk.hook };
    const c = DAY_CARDS.find((x) => x.day === day);
    return { label: c.label, text: c.key === 'sabado' ? wk.sabado.join('  ') : wk[c.key] };
  }
  // ¿Hay algo registrado ese día? (registro, gratitud, ánimo o cumplimiento)
  function dayHasEntry(YY, w, d) {
    return !!String(getV(k(YY, w, 'd' + d), '')).trim() || !!String(getV(k(YY, w, 'g' + d), '')).trim()
      || getV(k(YY, w, 'm' + d), null) != null || getV(k(YY, w, 'p' + d), null) != null;
  }

  // Racha amable: de los últimos 7 días (hoy incluido), cuántos tienen algo registrado. Nunca castiga.
  function streak() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const loc = locateDate(d);
      days.push({ date: d, ok: loc.inRange && dayHasEntry(loc.Y, loc.week, d.getDay()) });
    }
    return { days: days, n: days.filter((x) => x.ok).length };
  }
  function streakBox() {
    const s = streak();
    const box = el('div', 'streak');
    const dots = el('span', 'streak-dots');
    dots.setAttribute('aria-hidden', 'true');
    s.days.forEach(function (x) { const i = el('i', x.ok ? 'on' : ''); i.title = WEEKDAYS[x.date.getDay()] + ' ' + x.date.getDate(); dots.appendChild(i); });
    box.appendChild(dots);
    box.appendChild(el('span', 'streak-text', s.n === 0 ? 'Empieza hoy: un registro corto alcanza.'
      : s.n === 7 ? 'Siete de siete días. Semana completa.' : 'Llevas ' + s.n + ' de los últimos 7 días. Cada día suma.'));
    return box;
  }

  // Las preguntas de la semana repartidas de lunes a viernes, intercaladas (una de cada palabra por vez):
  // con 9 preguntas quedan 2, 2, 2, 2 y 1. El sábado solo quedan las pendientes y el cierre.
  function weekPlan(YY, w) {
    const words = activeWords(YY, w);
    const items = [];
    const max = Math.max(0, ...words.map((a) => qCount(YY, a.word)));
    for (let qi = 0; qi < max; qi++) words.forEach((a) => { const q = (YY.questions[a.word] || [])[qi]; if (q) items.push({ a: a, word: a.word, qi: qi, q: q }); });
    const base = Math.floor(items.length / 5), extra = items.length % 5;
    let pos = 0;
    for (let d = 1; d <= 5; d++) {
      const n = base + (d <= extra ? 1 : 0);
      for (let i = 0; i < n; i++) items[pos++].day = d;
    }
    return items;
  }
  function questionBox(YY, w, day, onAnswer) {
    const box = el('div', 'dq');
    const paint = function () {
      box.textContent = '';
      box.hidden = w === 0 || day < 1 || day > 5;
      if (box.hidden) return;
      const plan = weekPlan(YY, w);
      const open = (it) => getAnswers(YY, w, it.word)[it.qi] == null;
      const today = plan.filter((it) => it.day === day);
      const late = plan.filter((it) => it.day < day && open(it));
      box.appendChild(el('div', 'dq-label', today.length > 1 ? 'Preguntas de hoy' : 'Pregunta de hoy'));
      const show = today.filter(open).concat(late);
      if (!show.length) {
        const left = plan.filter(open).length;
        box.appendChild(el('p', 'dq-note', left ? 'Listo por hoy. Mañana siguen las demás.' : 'Ya respondiste las ' + plan.length + ' preguntas de la semana. El sábado cierras cada palabra.'));
        return;
      }
      show.forEach(function (it) {
        const item = el('div', 'dq-item');
        item.appendChild(el('p', 'dq-word', wordName(it.word) + (it.day < day ? ' · de ' + WEEKDAYS[it.day].toLowerCase() : '')));
        item.appendChild(el('p', 'dq-q', it.q));
        item.appendChild(answerScale(null, weekLocked(YY, w), function (v) {
          setAnswer(YY, w, it.word, it.qi, v);
          if (onAnswer) onAnswer();
          setTimeout(paint, 350);
        }));
        box.appendChild(item);
      });
    };
    paint();
    return box;
  }
  // Tendencia de una palabra: diferencia con la última vez que se evaluó (este año o el anterior).
  function wordTrend(YY, w, word) {
    if (!wordAnswered(YY, w, word)) return null;
    let pY = YY, prev = (YY.evalWeeks[word] || []).filter((x) => x < w && wordAnswered(YY, x, word) > 0).pop();
    if (prev == null) {
      const before = YEARS[yearIndex(YY.year) - 1];
      if (before) { pY = before; prev = (before.evalWeeks[word] || []).filter((x) => wordAnswered(before, x, word) > 0).pop(); }
    }
    if (prev == null) return { text: 'Primera vez que la evalúas', diff: null };
    const diff = Math.round((wordScore(YY, w, word) - wordScore(pY, prev, word)) * 100);
    const when = 'la semana ' + num(pY, prev) + (pY !== YY ? ' de ' + pY.year : '');
    return { diff: diff, text: diff > 0 ? '↑ ' + diff + ' desde ' + when : diff < 0 ? '↓ ' + (-diff) + ' desde ' + when : '= igual que en ' + when };
  }
  const refreshEval = function () { renderEvaluation(); renderClosing(); renderYear(); renderBoard(); };

  // Escala de respuesta: cinco círculos chicos (la pregunta es lo importante) y, al lado, la palabra
  // del valor elegido o del que se está por elegir, para no tener que recordar qué significa cada número.
  const SCALE_WORDS = ['Nunca', 'Pocas veces', 'A veces', 'Casi siempre', 'Siempre'];
  function answerScale(value, locked, onPick) {
    const wrap = el('div', 'ans');
    const scale = el('div', 'q-scale');
    scale.setAttribute('role', 'group');
    scale.setAttribute('aria-label', 'Respuesta del 1 (nunca) al 5 (siempre)');
    const label = el('span', 'ans-label');
    const show = (v, preview) => {
      label.textContent = v ? SCALE_WORDS[v - 1] : 'Nunca · · · Siempre';
      label.classList.toggle('is-set', !!v && !preview);
    };
    for (let v = 1; v <= 5; v++) {
      const b = el('button', null, String(v));
      b.type = 'button';
      b.title = SCALE_WORDS[v - 1];
      b.setAttribute('aria-label', v + ', ' + SCALE_WORDS[v - 1].toLowerCase());
      b.setAttribute('aria-pressed', String(value === v));
      b.disabled = !!locked;
      b.addEventListener('mouseenter', () => show(v, true));
      b.addEventListener('mouseleave', () => show(value));
      b.addEventListener('click', function () {
        value = value === v ? null : v;
        scale.querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-pressed', String(value === i + 1)));
        show(value);
        onPick(v);
      });
      scale.appendChild(b);
    }
    show(value);
    wrap.appendChild(scale);
    wrap.appendChild(label);
    return wrap;
  }
  function dimIcon(d) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ico dim-mini');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#d-' + d);
    svg.appendChild(use);
    return svg;
  }

  // Dictado por voz (si el navegador lo permite): agrega lo dictado al final del texto.
  function micButton(ta) {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech || !ta || ta.readOnly) return null;
    const b = el('button', 'mic-btn');
    b.type = 'button';
    b.appendChild(icon('mic'));
    const lbl = el('span', null, 'Dictar');
    b.appendChild(lbl);
    let rec = null;
    b.addEventListener('click', function () {
      if (rec) { rec.stop(); return; }
      rec = new Speech();
      rec.lang = /^es/i.test(navigator.language || '') ? navigator.language : 'es-ES';
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = function (e) {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
        t = t.trim();
        if (!t) return;
        ta.value = ta.value + (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + t;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Permite el micrófono para poder dictar'); };
      rec.onend = function () { rec = null; b.classList.remove('on'); lbl.textContent = 'Dictar'; };
      try { rec.start(); } catch (e) { rec = null; return; }
      b.classList.add('on');
      lbl.textContent = 'Escuchando… toca para terminar';
    });
    return b;
  }

  // ── Eventos de Google Calendar dentro de la app (solo lectura) ──
  // Requiere GOOGLE_CLIENT_ID en Netlify. El permiso se pide con la ventana de Google; el token vive solo en memoria.
  let gToken = null, gTokenExp = 0;
  function loadGsi() {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar el acceso de Google'));
      document.head.appendChild(s);
    });
  }
  async function googleToken(interactive) {
    if (gToken && Date.now() < gTokenExp) return gToken;
    await loadGsi();
    return new Promise(function (resolve, reject) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.googleClientId,
        scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
        callback: function (r) {
          if (r.error) { reject(new Error(r.error)); return; }
          gToken = r.access_token;
          gTokenExp = Date.now() + ((Number(r.expires_in) || 3600) - 60) * 1000;
          try { localStorage.setItem('sunset_gcal', '1'); } catch (e) { /* sin almacenamiento */ }
          resolve(gToken);
        },
        error_callback: function (err) { reject(new Error((err && err.type) || 'cancelado')); },
      });
      client.requestAccessToken({ prompt: interactive ? '' : 'none' });
    });
  }
  async function dayEvents(date, token) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=20'
      + '&timeMin=' + encodeURIComponent(start.toISOString()) + '&timeMax=' + encodeURIComponent(end.toISOString());
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (r.status === 401) { gToken = null; throw new Error('El permiso de Google venció'); }
    if (!r.ok) throw new Error('Google respondió ' + r.status);
    return (await r.json()).items || [];
  }
  const hhmm = (iso) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function agendaBox(date) {
    const box = el('div', 'agenda-box');
    if (!CONFIG.googleClientId) {
      const a = el('a', 'agenda-link', 'Ver mi agenda de hoy ↗');
      a.href = gcal('day', date); a.target = '_blank'; a.rel = 'noopener noreferrer';
      box.appendChild(a);
      return box;
    }
    const list = el('ul', 'agenda-list');
    const btn = el('button', 'btn agenda-connect');
    btn.type = 'button';
    btn.appendChild(icon('cal'));
    btn.appendChild(document.createTextNode('Ver mis eventos de hoy'));
    const show = async function (interactive) {
      btn.disabled = true;
      try {
        const items = await dayEvents(date, await googleToken(interactive));
        list.textContent = '';
        if (!items.length) list.appendChild(el('li', 'agenda-empty', 'No tienes eventos hoy.'));
        items.forEach(function (ev) {
          const li = el('li');
          li.appendChild(el('span', 'agenda-time', ev.start && ev.start.dateTime ? hhmm(ev.start.dateTime) : 'Todo el día'));
          li.appendChild(el('span', null, ev.summary || '(sin título)'));
          list.appendChild(li);
        });
        btn.hidden = true;
      } catch (e) {
        btn.disabled = false;
        if (interactive) toast('No se pudo leer la agenda: ' + e.message);
      }
    };
    btn.addEventListener('click', () => show(true));
    box.appendChild(btn);
    box.appendChild(list);
    let connected = false;
    try { connected = localStorage.getItem('sunset_gcal') === '1'; } catch (e) { /* sin almacenamiento */ }
    if (connected) show(false);
    return box;
  }

  // ── Notificación diaria (Web Push) ──
  // Requiere VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en Netlify; el envío lo hace la función programada push-diario.
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  function b64ToBytes(s) {
    const b = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(b, (c) => c.charCodeAt(0));
  }
  async function pushSubscription() {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }
  async function renderPush() {
    const row = $('pushRow');
    row.hidden = !(CONFIG.vapidPublicKey && pushSupported() && !window.SUNSET_DATA);
    if (row.hidden) return;
    let sub = null;
    try { sub = await pushSubscription(); } catch (e) { /* sin service worker */ }
    $('pushOn').textContent = sub ? 'Actualizar la hora' : 'Activar notificación diaria';
    $('pushOff').hidden = !sub;
  }
  $('pushOn').addEventListener('click', async function () {
    try {
      if ((await Notification.requestPermission()) !== 'granted') { toast('Sin permiso, no puedo avisarte'); return; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(CONFIG.vapidPublicKey) });
      const hour = Number(($('remTime').value || '21:00').slice(0, 2));
      const r = await fetch('/api/push', {
        method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, authHeaders()),
        body: JSON.stringify({ subscription: sub.toJSON(), hour: hour, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!r.ok) throw new Error('el servidor respondió ' + r.status);
      try { localStorage.setItem('sunset_rem_time', $('remTime').value); } catch (e) { /* sin almacenamiento */ }
      toast('Listo: te avisaré cada día a las ' + hour + ':00');
    } catch (e) {
      toast('No se pudo activar: ' + e.message);
    }
    renderPush();
  });
  $('pushOff').addEventListener('click', async function () {
    try {
      const sub = await pushSubscription();
      if (sub) {
        await fetch('/api/push', { method: 'DELETE', headers: Object.assign({ 'content-type': 'application/json' }, authHeaders()), body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      toast('Notificación diaria desactivada');
    } catch (e) {
      toast('No se pudo desactivar: ' + e.message);
    }
    renderPush();
  });

  // ── Vista Hoy: la puerta de entrada. Lo esencial del día en una pantalla; la semana completa, a un toque ──
  // Lunes a viernes: frase, registro y una pregunta. Sábado: evaluación (las preguntas pendientes, aquí mismo).
  // Domingo: preparación (repaso de la semana que terminó e intención para la que empieza).
  let view = 'semana';

  // Clave de la intención que rige una semana: la escrita en la semana anterior (o la inicial del año).
  function intentionKey(YY, w) {
    const pw = w > 0 ? prevWeekOf(YY, w) : null;
    return pw ? k(pw.Y, pw.week, 'intencion') : k(YY, 0, 'intencion');
  }

  // «Tu semana»: objetivo y avance, para no tener que ir a la semana completa.
  function weekGoalBox(YY, w) {
    const wk = weekAt(YY, w);
    const box = el('section', 'hoy-week');
    const head = el('div', 'hoy-week-head');
    head.appendChild(el('span', 'hoy-week-label', 'Tu semana'));
    head.appendChild(el('span', 'hoy-week-title', wk.title || ''));
    box.appendChild(head);
    const intent = String(getV(intentionKey(YY, w), '')).trim();
    if (intent && w !== 0) box.appendChild(el('p', 'hoy-intent', 'Quiero: ' + intent));
    if (w !== 0) {
      const list = el('ul', 'hoy-words');
      let answered = 0;
      activeWords(YY, w).forEach(function (a) {
        const n = wordAnswered(YY, w, a.word);
        answered += n;
        const li = el('li');
        li.appendChild(el('span', 'hoy-word', wordName(a.word)));
        const bar = el('span', 'hoy-bar');
        bar.setAttribute('aria-hidden', 'true');
        const nq = qCount(YY, a.word);
        for (let i = 0; i < nq; i++) bar.appendChild(el('i', i < n ? 'on' : ''));
        li.appendChild(bar);
        li.appendChild(el('span', 'hoy-word-n', n ? n + '/' + nq + ' · ' + Math.round(wordScore(YY, w, a.word) * 100) + ' %' : '0/' + nq));
        li.setAttribute('aria-label', wordName(a.word) + ': ' + n + ' de ' + nq + ' preguntas respondidas');
        list.appendChild(li);
      });
      box.appendChild(list);
      box.appendChild(el('p', 'hoy-week-note', answered + ' de ' + weekTotal(YY, w) + ' preguntas respondidas'));
    }
    const days = el('div', 'hoy-days');
    days.setAttribute('role', 'group');
    days.setAttribute('aria-label', 'Días de esta semana: toca uno para abrirlo');
    const sel = hoyDate ? hoyDate.getDay() : -1;
    ['D', 'L', 'M', 'X', 'J', 'V', 'S'].forEach(function (lbl, d) {
      if (w === 0 && !introDay(wk, d)) return;
      const date = dateOf(YY, w, d);
      const future = utcDay(date) > utcDay(now);
      const has = dayHasEntry(YY, w, d);
      const c = el('button', 'hoy-day' + (has ? ' on' : '') + (sameDay(date, now) ? ' is-today' : '') + (d === sel ? ' is-sel' : ''), lbl);
      c.type = 'button';
      c.disabled = future;
      c.setAttribute('aria-label', WEEKDAYS[d] + ' ' + date.getDate() + (has ? ', con registro' : ', sin registro') + (future ? ', todavía no llega' : ''));
      if (d === sel) c.setAttribute('aria-current', 'date');
      c.addEventListener('click', () => hoyGo(date));
      days.appendChild(c);
    });
    box.appendChild(days);
    return box;
  }

  // Sábado: todas las preguntas pendientes de la semana, para cerrar la autoevaluación sin salir de Hoy.
  // Sábado: cierre de la semana. Primero, de a una, las preguntas que quedaron sin responder entre lunes y
  // viernes (avance en marcas, la dimensión y su pregunta central, paso automático, «Anterior», teclas 1 a 5).
  // Después, el cierre de cada palabra: su resultado, cómo se movió desde la última vez y una frase.
  function pendingBox(YY, w) {
    const box = el('section', 'hoy-eval');
    box.setAttribute('aria-label', 'Cierre de la semana');
    const words = activeWords(YY, w);
    const plan = weekPlan(YY, w);
    const answered = (it) => getAnswers(YY, w, it.word)[it.qi] != null;
    const queue = plan.filter((it) => !answered(it));   // las que faltaban al abrir el sábado (se puede volver a ellas)
    let cur = queue.length ? 0 : -1;
    let note = '', timer = null;
    const locked = weekLocked(YY, w);
    let goal = null;
    box.setGoal = (g) => { goal = g; };
    const nextOpen = (from) => {
      for (let i = 1; i <= queue.length; i++) { const j = (from + i) % queue.length; if (!answered(queue[j])) return j; }
      return -1;
    };

    const paint = function () {
      box.textContent = '';
      const head = el('div', 'ev-head');
      head.appendChild(el('h2', 'dq-label', 'Cierre de la semana'));
      const done = plan.filter(answered).length;
      head.appendChild(el('span', 'ev-count', done + ' de ' + plan.length + ' respondidas'));
      box.appendChild(head);
      const bar = el('div', 'ev-bar');
      bar.setAttribute('aria-hidden', 'true');
      words.forEach((a, wi) => (YY.questions[a.word] || []).forEach((q, qi) => {
        const it = queue[cur];
        bar.appendChild(el('i', (getAnswers(YY, w, a.word)[qi] != null ? 'on' : '') + (it && it.word === a.word && it.qi === qi ? ' cur' : '') + (qi === 0 && wi ? ' gap' : '')));
      }));
      box.appendChild(bar);

      if (cur >= 0) {
        const it = queue[cur];
        const card = el('div', 'ev-card');
        if (note) card.appendChild(el('p', 'ev-note', note));
        else card.appendChild(el('p', 'ev-note', 'Te quedaron ' + queue.filter((x) => !answered(x)).length + ' de la semana. Respóndelas y cierra cada palabra.'));
        const who = el('div', 'ev-word');
        who.appendChild(dimIcon(it.a.dim));
        const wt = el('div');
        wt.appendChild(el('h3', 'ev-word-name', wordName(it.word)));
        wt.appendChild(el('span', 'ev-word-dim', YY.dimensions[it.a.dim] + ' · ' + (it.qi + 1) + ' de ' + qCount(YY, it.word)));
        who.appendChild(wt);
        card.appendChild(who);
        if (DIM_CONCEPTS[it.a.dim] && (cur === 0 || queue[cur - 1].word !== it.word)) card.appendChild(el('p', 'ev-ask', DIM_CONCEPTS[it.a.dim][1]));
        card.appendChild(el('p', 'ev-q', it.q));
        const pick = function (v) {
          setAnswer(YY, w, it.word, it.qi, v);
          const nowV = getAnswers(YY, w, it.word)[it.qi];
          card.querySelectorAll('.q-scale button').forEach((x, i) => x.setAttribute('aria-pressed', String(nowV === i + 1)));
          refreshEval();
          if (goal) goal.replaceWith(goal = weekGoalBox(YY, w));
          clearTimeout(timer);
          if (!answered(it)) { paint(); return; }
          timer = setTimeout(function () {
            const full = (YY.questions[it.word] || []).every((q, qi) => getAnswers(YY, w, it.word)[qi] != null);
            note = full ? '✓ ' + wordName(it.word) + ' · ' + Math.round(wordScore(YY, w, it.word) * 100) + ' %' : '';
            cur = nextOpen(cur);
            paint();
            const first = box.querySelector('.q-scale button');
            if (first && box.contains(document.activeElement)) first.focus({ preventScroll: true });
          }, 420);
        };
        card.appendChild(answerScale(getAnswers(YY, w, it.word)[it.qi], locked, pick));
        const nav = el('div', 'ev-nav');
        const prev = el('button', 'ev-link', '← Anterior');
        prev.type = 'button';
        prev.disabled = cur === 0;
        prev.addEventListener('click', () => { clearTimeout(timer); note = ''; cur = Math.max(0, cur - 1); paint(); });
        const skip = el('button', 'ev-link', answered(it) ? 'Siguiente →' : 'Saltar →');
        skip.type = 'button';
        skip.addEventListener('click', () => {
          clearTimeout(timer); note = '';
          if (answered(it) && cur + 1 < queue.length) cur = cur + 1;
          else { const n = nextOpen(cur); cur = n < 0 ? -1 : n; }
          paint();
        });
        nav.appendChild(prev);
        nav.appendChild(skip);
        card.appendChild(nav);
        box.appendChild(card);
        box.pick = locked ? null : pick;
      } else box.pick = null;

      // Cierre de cada palabra.
      const list = el('div', 'ev-close');
      words.forEach(function (a) {
        const row = el('div', 'ev-close-row');
        const top = el('div', 'ev-close-top');
        top.appendChild(dimIcon(a.dim));
        top.appendChild(el('h3', 'ev-word-name', wordName(a.word)));
        const n = wordAnswered(YY, w, a.word);
        top.appendChild(el('b', 'ev-close-pct', n ? Math.round(wordScore(YY, w, a.word) * 100) + ' %' : n + '/' + qCount(YY, a.word)));
        row.appendChild(top);
        const tr = wordTrend(YY, w, a.word);
        if (tr) row.appendChild(el('p', 'ev-trend' + (tr.diff > 0 ? ' up' : tr.diff < 0 ? ' down' : ''), tr.text));
        const f = noteField(k(YY, w, 'c/' + a.word), 'Lo que me llevo de ' + wordName(a.word) + '…', 1);
        f.setAttribute('aria-label', 'Lo que me llevo de ' + wordName(a.word));
        row.appendChild(f);
        list.appendChild(row);
      });
      box.appendChild(list);
      if (cur < 0) {
        const rv = el('button', 'dq-more', 'Revisar mis respuestas');
        rv.type = 'button';
        rv.addEventListener('click', () => { if (queue.length) { cur = 0; note = ''; paint(); } else setView('semana', true); });
        box.appendChild(rv);
        box.appendChild(el('p', 'dq-note', 'Mañana, domingo, miras la semana completa y escribes tu intención.'));
      }
    };
    box.addEventListener('keydown', function (e) {
      if (!box.pick || e.target.closest('input,textarea')) return;
      const v = Number(e.key);
      if (v >= 1 && v <= 5) { e.preventDefault(); box.pick(v); }
    });
    paint();
    return box;
  }

  // Domingo: repaso breve de la semana que terminó y la intención para la que empieza.
  function prepBox(YY, w) {
    const box = el('section', 'hoy-prep');
    box.appendChild(el('div', 'dq-label', 'Preparación'));
    const pw = prevWeekOf(YY, w);
    if (pw && weekHasEntries(pw.Y, pw.week)) {
      let days = 0;
      for (let d = 0; d < 7; d++) if (dayHasEntry(pw.Y, pw.week, d)) days++;
      const m = weekMood(pw.Y, pw.week);
      const words = activeWords(pw.Y, pw.week).filter((a) => wordAnswered(pw.Y, pw.week, a.word) > 0)
        .map((a) => wordName(a.word) + ' ' + Math.round(wordScore(pw.Y, pw.week, a.word) * 100) + ' %');
      const p = el('p', 'hoy-prep-sum', 'La semana pasada: ' + days + ' de 7 días con registro' + (m.n ? ' · ánimo ' + fmt1(m.avg) + '/5' : '') + (words.length ? ' · ' + words.join(', ') : '') + '.');
      box.appendChild(p);
      const sb = el('button', 'dq-more', 'Ver el resumen completo');
      sb.type = 'button';
      sb.addEventListener('click', () => openSummary(pw.Y, pw.week));
      box.appendChild(sb);
      box.appendChild(el('div', 'field-label', '¿Qué funcionó? ¿Qué mejorar?'));
      box.appendChild(noteField(k(pw.Y, pw.week, 'funciono'), 'Mirando la semana que terminó…', 2));
    }
    box.appendChild(el('div', 'field-label', 'Esta semana quiero…'));
    box.appendChild(noteField(intentionKey(YY, w), 'Una intención concreta para estos 7 días…', 2));
    const words = activeWords(YY, w).map((a) => a.word + ' (' + YY.dimensions[a.dim] + ')').join(' · ');
    if (w !== 0) box.appendChild(el('p', 'field-hint', 'Tus palabras de esta semana: ' + words + '.'));
    return box;
  }

  function renderHoy() {
    const box = $('hoyView');
    box.textContent = '';
    if (view !== 'hoy') return;
    const D = hoyDate || now;
    const day = D.getDay();
    const isToday = sameDay(D, now);
    const mode = viewing === 0 ? 'intro' : day === 0 ? 'domingo' : day === 6 ? 'sabado' : 'dia';
    // Navegación entre días: anterior / siguiente (cruza semanas), hasta hoy.
    const nav = el('div', 'hoy-nav');
    const prev = el('button', 'hoy-arrow');
    prev.type = 'button';
    prev.appendChild(icon('left'));
    prev.setAttribute('aria-label', 'Día anterior');
    const prevDate = stepDay(D, -1);
    prev.disabled = !prevDate;
    prev.addEventListener('click', () => hoyGo(prevDate));
    const next = el('button', 'hoy-arrow');
    next.type = 'button';
    next.appendChild(icon('right'));
    next.setAttribute('aria-label', 'Día siguiente');
    const nextDate = stepDay(D, 1);
    next.disabled = !nextDate;
    next.addEventListener('click', () => hoyGo(nextDate));
    // Una sola fila: flecha, día (con su modo y «Volver a hoy»), flecha. Deja más pantalla para la frase.
    const head = el('div', 'hoy-head');
    head.appendChild(el('h1', 'hoy-title', WEEKDAYS[day] + ' ' + D.getDate() + ' de ' + MONTHS[D.getMonth()]));
    const sub = el('div', 'hoy-sub');
    const modeText = mode === 'domingo' ? 'Día de preparación' : mode === 'sabado' ? 'Día de evaluación' : '';
    if (modeText) sub.appendChild(el('span', 'hoy-mode', modeText));
    if (!isToday) {
      const back = el('button', 'hoy-back', 'Volver a hoy');
      back.type = 'button';
      back.addEventListener('click', () => hoyGo(new Date(now)));
      sub.appendChild(back);
    }
    if (sub.childNodes.length) head.appendChild(sub);
    nav.appendChild(prev);
    nav.appendChild(head);
    nav.appendChild(next);
    box.appendChild(nav);
    const ph = dayPhrase(Y, viewing, day);
    const phrase = el('div', 'hoy-phrase');
    phrase.appendChild(el('div', 'today-label', ph.label));
    if (mode === 'domingo') phrase.appendChild(el('p', 'hoy-week-name', weekAt(Y, viewing).title || ''));
    if (mode !== 'sabado') phrase.appendChild(phraseInto(el('p'), ph.text));
    else {
      const ol = el('ol', 'sat-list');
      (weekAt(Y, viewing).sabado || []).forEach((q) => ol.appendChild(el('li', null, q)));
      phrase.appendChild(ol);
    }
    box.appendChild(phrase);
    // El domingo se lee la historia de la semana, a la vista: es el vistazo general antes de empezar.
    if (mode === 'domingo' && weekAt(Y, viewing).story) {
      const st = el('div', 'hoy-story');
      st.appendChild(el('div', 'today-label', 'Historia'));
      st.appendChild(el('p', null, weekAt(Y, viewing).story));
      box.appendChild(st);
    }
    if (weekLocked(Y, viewing)) box.appendChild(lockNote(Y, viewing));
    box.appendChild(streakBox());
    let goal = weekGoalBox(Y, viewing);
    box.appendChild(goal);
    if (mode === 'domingo') box.appendChild(prepBox(Y, viewing));
    if (mode === 'sabado') { const pb = pendingBox(Y, viewing); pb.setGoal(goal); box.appendChild(pb); }
    box.appendChild(el('div', 'field-label', isToday ? 'Registro de hoy' : 'Registro del ' + WEEKDAYS[day].toLowerCase()));
    const rec = noteField(k(Y, viewing, 'd' + day), mode === 'sabado' ? 'Lo que te dejó la semana…' : 'Una o dos líneas sobre tu día…', 3);
    box.appendChild(rec);
    const gr = noteField(k(Y, viewing, 'g' + day), isToday ? 'Hoy agradezco…' : 'Ese día agradecí…', 1);
    gr.classList.add('grat-note');
    box.appendChild(gr);
    box.appendChild(moodRow(day, refreshMood));
    const tools = el('div', 'record-tools');
    const mic = micButton(rec);
    if (mic) tools.appendChild(mic);
    const expand = el('button', 'expand-btn');
    expand.type = 'button';
    expand.appendChild(icon('expand'));
    expand.appendChild(document.createTextNode('Ampliar'));
    expand.setAttribute('aria-label', isToday ? 'Abrir el registro de hoy en pantalla grande' : 'Abrir el registro del ' + WEEKDAYS[day].toLowerCase() + ' en pantalla grande');
    expand.addEventListener('click', () => openEditor(day));
    tools.appendChild(expand);
    box.appendChild(tools);
    if (mode === 'dia') {
      box.appendChild(questionBox(Y, viewing, day, function () { refreshEval(); const g = weekGoalBox(Y, viewing); goal.replaceWith(g); goal = g; }));
    }
    box.appendChild(agendaBox(D));
    const verseRaw = viewing !== 0 && day !== 1 ? String(weekAt(Y, viewing).regalo || '').trim() : '';
    if (verseRaw) {
      const v = el('p', 'verse hoy-verse');
      const m = verseRaw.match(/^(.*?)\s+—\s+(.+)$/s);
      v.appendChild(document.createTextNode(m ? m[1] : verseRaw));
      if (m) v.appendChild(el('cite', null, m[2]));
      box.appendChild(v);
    }
    const more = el('button', 'hoy-more', 'Ver la semana completa');
    more.type = 'button';
    more.appendChild(icon('right'));
    more.addEventListener('click', () => setView('semana', true));
    box.appendChild(more);
  }
  // Día que muestra Hoy: por defecto hoy; se puede volver a días anteriores (un domingo o un sábado que no alcanzaste).
  let hoyDate = null;
  const sameDay = (a, b) => utcDay(a) === utcDay(b);
  // ¿Se puede abrir esta fecha en Hoy? Dentro del año cargado, no en el futuro y, en la introducción, solo sus días.
  function hoyOpenable(date) {
    if (utcDay(date) > utcDay(now)) return null;
    const loc = locateDate(date);
    if (!loc.inRange) return null;
    if (loc.week === 0 && !introDay(loc.Y.intro, date.getDay())) return null;
    return loc;
  }
  function stepDay(date, delta) {
    const d = new Date(date); d.setDate(d.getDate() + delta);
    return hoyOpenable(d) ? d : null;
  }
  function hoyGo(date) {
    const loc = hoyOpenable(date);
    if (!loc) return;
    flushNotes();
    hoyDate = new Date(date);
    Y = loc.Y; viewing = loc.week; openWord = null; view = 'hoy';
    render();
  }
  // Cambia entre Hoy y Semana. Al tocar «Hoy» se vuelve al día de hoy.
  function setView(v, scroll) {
    if (v === 'hoy' && !TODAY.inRange) v = 'semana';
    view = v;
    if (v === 'hoy') { hoyDate = new Date(now); Y = TODAY.Y; viewing = TODAY.week; openWord = null; }
    // Mi año abre su progreso, ánimo y tablero (el diario y el respaldo quedan plegados).
    if (v === 'ano') ['yearFold', 'moodFold', 'boardFold'].forEach((id) => { $(id).open = true; });
    render();
    if (scroll) {
      const target = v === 'semana' ? $('weekStart') : v === 'ano' ? $('anoTitle') : $('hoyView');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }


  // ── Resumen de la semana ──
  function prevWeekOf(YY, w) {
    if (w > minWeek(YY)) return { Y: YY, week: w - 1 };
    const before = YEARS[yearIndex(YY.year) - 1];
    return before ? { Y: before, week: before.weeks.length } : null;
  }
  function weekHasEntries(YY, w) {
    for (let d = 0; d < 7; d++) if (dayHasEntry(YY, w, d)) return true;
    return activeWords(YY, w).some((a) => wordAnswered(YY, w, a.word) > 0) || !!String(getV(k(YY, w, 'intencion'), '')).trim();
  }
  function openSummary(YY, w) {
    const wk = weekAt(YY, w);
    const body = $('summaryBody');
    body.textContent = '';
    $('summaryEyebrow').textContent = weekName(w, YY) + ' · ' + YY.themes[wk.col].name + ' · ' + wk.dates;
    const block = function (title) { const s = el('section', 'sum-block'); s.appendChild(el('h3', null, title)); body.appendChild(s); return s; };
    // Constancia
    let days = 0;
    for (let d = 0; d < 7; d++) if (dayHasEntry(YY, w, d)) days++;
    const total = w === 0 ? (wk.dias || []).length : 7;
    const pv = [0, 1, 2, 3, 4, 5, 6].map((d) => getV(k(YY, w, 'p' + d), null)).filter((v) => v != null);
    const b1 = block('Tu semana');
    b1.appendChild(el('p', 'sum-big', days + ' de ' + total + ' días con registro'));
    if (pv.length) b1.appendChild(el('p', null, 'Cumplimiento promedio: ' + Math.round(pv.reduce((s, v) => s + v, 0) / pv.length) + ' %'));
    // Ánimo
    const m = weekMood(YY, w);
    const b2 = block('Ánimo');
    if (m.n) {
      const known = m.vals.map((v, d) => ({ v: v, d: d })).filter((x) => x.v != null);
      const hi = known.reduce((b, x) => (x.v > b.v ? x : b), known[0]);
      const lo = known.reduce((b, x) => (x.v < b.v ? x : b), known[0]);
      b2.appendChild(el('p', 'sum-big', fmt1(m.avg) + ' de 5 · ' + MOOD_NAMES[Math.round(m.avg) - 1]));
      if (hi.v !== lo.v) b2.appendChild(el('p', null, 'Mejor día: ' + WEEKDAYS[hi.d] + ' · más bajo: ' + WEEKDAYS[lo.d]));
    } else b2.appendChild(el('p', 'field-hint', 'Sin ánimo registrado.'));
    // Palabras: cómo te fue y comparación con su evaluación anterior
    if (w !== 0) {
      const b3 = block('Palabras de la semana');
      activeWords(YY, w).forEach(function (a) {
        const n = wordAnswered(YY, w, a.word);
        let line = wordName(a.word) + ': ' + (n ? Math.round(wordScore(YY, w, a.word) * 100) + ' %' : 'sin responder');
        const prev = (YY.evalWeeks[a.word] || []).filter((x) => x < w && wordAnswered(YY, x, a.word) > 0).pop();
        if (n && prev) {
          const diff = Math.round((wordScore(YY, w, a.word) - wordScore(YY, prev, a.word)) * 100);
          line += diff > 0 ? ' · subió ' + diff + ' puntos desde la ' + weekName(prev, YY).toLowerCase() : diff < 0 ? ' · bajó ' + (-diff) + ' puntos desde la ' + weekName(prev, YY).toLowerCase() : ' · igual que la última vez';
        } else if (n) line += ' · primera evaluación';
        b3.appendChild(el('p', null, line));
      });
    }
    // Gratitud
    const grats = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d: d, t: String(getV(k(YY, w, 'g' + d), '')).trim() })).filter((x) => x.t);
    if (grats.length) {
      const b4 = block('Lo que agradeciste');
      grats.forEach((x) => b4.appendChild(el('p', 'sum-grat', WEEKDAYS[x.d] + ': ' + x.t)));
    }
    // Cierre
    const f = String(getV(k(YY, w, 'funciono'), '')).trim(), it = String(getV(k(YY, w, 'intencion'), '')).trim();
    const b5 = block('Para la semana que viene');
    if (f) b5.appendChild(el('p', null, f));
    b5.appendChild(el('p', it ? 'sum-intent' : 'field-hint', it ? 'Quiero: ' + it : 'Todavía no escribiste tu intención. Puedes hacerlo en el cierre de esta semana.'));
    $('summary').hidden = false;
    document.documentElement.classList.add('no-scroll');
    $('summaryDone').focus();
  }
  function closeSummary() {
    $('summary').hidden = true;
    document.documentElement.classList.remove('no-scroll');
  }
  $('summaryDone').addEventListener('click', closeSummary);
  // El domingo, la primera vez que se abre la app, aparece el resumen de la semana que terminó.
  function sundaySummary() {
    if (!TODAY.inRange || now.getDay() !== 0) return;
    let seen = '';
    try { seen = localStorage.getItem('sunset_resumen') || ''; } catch (e) { /* sin almacenamiento */ }
    if (seen === localDay()) return;
    const pw = prevWeekOf(TODAY.Y, TODAY.week);
    if (!pw || !weekHasEntries(pw.Y, pw.week)) return;
    try { localStorage.setItem('sunset_resumen', localDay()); } catch (e) { /* sin almacenamiento */ }
    if (!$('welcome').hidden) return;
    openSummary(pw.Y, pw.week);
  }

  function goTo(year, week) {
    if (view === 'ano') view = 'semana';   // tocar una semana en Mi año (o las flechas) lleva a esa semana
    Y = year;
    viewing = Math.min(Y.weeks.length, Math.max(minWeek(Y), week));
    openWord = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Avanza o retrocede una semana, pasando de un año al otro.
  function step(delta) {
    const yi = yearIndex(Y.year);
    const target = viewing + delta;
    if (target < minWeek(Y) && yi > 0) goTo(YEARS[yi - 1], YEARS[yi - 1].weeks.length);
    else if (target > Y.weeks.length && yi < YEARS.length - 1) goTo(YEARS[yi + 1], minWeek(YEARS[yi + 1]));
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
        // day: la fecha local, para que la copia diaria lleve el día del usuario y no el de UTC.
        body: JSON.stringify({ entries: state.entries, day: localDay() }),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 401) { logout('La clave cambió. Escríbela de nuevo.'); return; }
      if (resp.status === 409) { setSyncStatus('Otro dispositivo guardaba a la vez; reintentando…'); setTimeout(sync, 3000); return; }
      if (!resp.ok) throw new Error(body.error || 'Error ' + resp.status);
      const res = mergeEntries(state.entries, body.entries);
      state.entries = res.entries;
      save();
      // No redibujar mientras se escribe: se perdería el foco del campo.
      if (res.changed) renderWhenIdle();
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
    catch (e) { throw new Error(location.protocol === 'file:' ? 'Abre la app desde su dirección en internet.' : 'No hay conexión con el servidor.'); }
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
      viewing = Math.min(Y.weeks.length, Math.max(minWeek(Y), viewing));
      renderWhenIdle();
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
      'Todo vuelve a como estaba al empezar ese día. Lo que escribiste después se reemplaza, en todos tus dispositivos. Puedes deshacerlo desde esta misma sección.',
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
  const localDay = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const stamp = localDay;

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
    head.push('% semana', 'Cumplimiento (D L M X J V S)', 'Ánimo (D L M X J V S)', 'Gratitud', 'Maestría del color', 'Qué funcionó / mejorar', 'Intención');
    const rows = [head];
    YEARS.forEach(function (YY) {
      allWeeks(YY).forEach(function (wk) {
        const w = wk.week;
        const row = [YY.year, num(YY, w), wk.dates, YY.themes[wk.col].name];
        for (let d = 0; d < 7; d++) row.push(getV(k(YY, w, 'd' + d), ''));
        // La introducción no tiene autoevaluación: sus columnas de palabras quedan vacías.
        if (w === 0) row.push('', '', '', '', '', '', '', '', '', '', '', '');
        (w === 0 ? [] : activeWords(YY, w)).forEach(function (a) {
          row.push(a.word, getAnswers(YY, w, a.word).map((v) => v || '-').join(' '),
            Math.round(wordScore(YY, w, a.word) * 100), getV(k(YY, w, 'c/' + a.word), ''));
        });
        row.push(Math.round(weekScore(YY, w) * 100), [0, 1, 2, 3, 4, 5, 6].map((d) => { const v = getV(k(YY, w, 'p' + d), null); return v == null ? '-' : v; }).join(' '), [0, 1, 2, 3, 4, 5, 6].map((d) => { const v = getV(k(YY, w, 'm' + d), null); return v == null ? '-' : v; }).join(' '), [0, 1, 2, 3, 4, 5, 6].map((d) => getV(k(YY, w, 'g' + d), '')).filter(Boolean).join(' | '), (function () { const cm = colorMastery(YY, wk.col); return cm.complete ? cm.leader.word : ''; })(),
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
        'Combinar suma el respaldo a lo que ya tienes y, si hay un mismo dato en los dos, queda el más reciente. Reemplazar deja todo exactamente como estaba en el respaldo.',
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
  // Atajos: Hoy · Semana · Mi año · Buscar.
  function markJump() {
    document.querySelectorAll('.jump [data-view]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.view === view)));
  }
  document.querySelector('.jump').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-view], button[data-go]');
    if (!btn) return;
    if (btn.dataset.view) { setView(btn.dataset.view, true); return; }
    if (view === 'hoy') setView('semana');
    const target = $(btn.dataset.go);
    if (target.tagName === 'DETAILS') target.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('prevWeek').addEventListener('click', () => step(-1));
  $('nextWeek').addEventListener('click', () => step(1));
  $('todayBtn').addEventListener('click', () => setView('hoy', true));
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

  // Si llegan cambios mientras se escribe, se redibuja al salir del campo (no antes: se perdería el foco).
  let renderPending = false;
  const typing = () => editing || (document.activeElement && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName) && document.activeElement.type !== 'range');
  function renderWhenIdle() {
    if (typing()) { renderPending = true; return; }
    renderPending = false;
    render();
  }
  document.addEventListener('focusout', function () {
    if (renderPending) setTimeout(function () { if (renderPending && !typing()) { renderPending = false; render(); } }, 0);
  });

  // Si la app queda abierta de un día para otro, "hoy" se actualiza al volver a ella.
  function refreshToday() {
    if (!Y) return;
    const n = clock();
    if (n.toDateString() === now.toDateString()) return;
    if (editing || (document.activeElement && document.activeElement.tagName === 'TEXTAREA')) return;
    const followToday = isCurrent();
    const now0 = now;
    now = n;
    TODAY = locateDate(now);
    if (view === 'hoy' && hoyDate && sameDay(hoyDate, now0)) { hoyDate = new Date(now); Y = TODAY.Y; viewing = TODAY.week; }
    else if (followToday) { Y = TODAY.Y; viewing = TODAY.week; }
    renderHeader();
    render();
  }
  // Y si queda abierta y visible, se revisa cada minuto (cambio de día a medianoche).
  setInterval(function () { if (document.visibilityState === 'visible') { refreshToday(); if (themePref === 'auto' && document.documentElement.dataset.theme !== themeNow()) applyMode(); } }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') { flushEditor(); flushNotes(); return; }
    refreshToday();
    sync();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('summary').hidden) { closeSummary(); return; }
    if (e.key === 'Escape' && !$('diary').hidden) { closeDiary(); return; }
    if (e.key === 'Escape' && !$('search').hidden) { closeSearch(); return; }
    if (e.key === 'Escape' && editing) { closeEditor(); return; }
    if (e.key === 'Escape' && !$('wordModal').hidden) { closeWord(); return; }
    if (e.key === 'Escape' && !$('ask').hidden) { const c = $('askActions').querySelector('button:last-child'); if (c) c.click(); return; }
    if (e.target.closest('input,textarea') || document.querySelector('[role=dialog]:not([hidden])') || editing) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // Bienvenida en tres pantallas cortas.
  let welcomeStep = 0;
  $('welcomeOk').addEventListener('click', function () {
    const steps = document.querySelectorAll('.welcome-step');
    if (welcomeStep < steps.length - 1) {
      steps[welcomeStep].hidden = true;
      welcomeStep++;
      steps[welcomeStep].hidden = false;
      document.querySelectorAll('.welcome-dots i').forEach((d, i) => d.classList.toggle('on', i === welcomeStep));
      this.textContent = welcomeStep === steps.length - 1 ? 'Empezar' : 'Siguiente';
      return;
    }
    $('welcome').hidden = true;
    state.welcomed = true;
    save();
  });

  // Arranque con el contenido ya disponible.
  function boot(data) {
    prepare(data);
    now = clock();
    applyMode();
    TODAY = locateDate(now);
    Y = TODAY.Y;
    viewing = TODAY.week;
    openWord = null;
    view = TODAY.inRange ? 'hoy' : 'semana';
    hoyDate = new Date(now);
    renderHeader();
    renderSyncPanel();
    renderUndo();
    render();
    renderPush();
    if (!state.welcomed) $('welcome').hidden = false;
    // Abrir directo el registro rápido (por ejemplo, desde la notificación diaria).
    sundaySummary();
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
