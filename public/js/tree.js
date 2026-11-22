// Árboles de cada color: nombre, nombre científico y los dos tonos de su flor.
// El paisaje de cada semana es una imagen fija (public/images/trees); el código que la
// dibuja está en tools/tree-render.js y solo se usa para regenerarla.
(function () {
  'use strict';

  // Cada color tiene sus propios matices (nada de lila en las demás semanas):
  //   accent/mid : colores de interfaz de esa semana (acentos, pestañas, tintes de las tarjetas)
  //   ink        : tonos de la flor en el progreso y el tablero
  //   bg         : fondo de la página, de arriba (top) hacia abajo (mid, low) hasta el ámbar del atardecer (warm)
  //   glow       : luz del halo detrás de la copa · bark: color del tronco
  const TREES = {
    Lila: { name: 'Lapacho morado', sci: 'Handroanthus impetiginosus', accent: '#c9a0f0', mid: '#9b59b6', ink: ['#b565c9', '#d58ad8'],
      bg: { top: '#1c102b', mid: '#2d1946', low: '#3b1d4d', warm: '#b84a15' }, day: { top: '#b393e0', mid: '#d6c2f0', low: '#f0e6fa', warm: '#ffd3c2' }, glow: '#a58cf0', bark: '#2d1f1b' },
    Azul: { name: 'Jacarandá', sci: 'Jacaranda mimosifolia', accent: '#a9b0fa', mid: '#6a6cc9', ink: ['#6a6cc9', '#9aa0ec'],
      bg: { top: '#0a1030', mid: '#152262', low: '#1c2b72', warm: '#b0572a' }, day: { top: '#9cc0ee', mid: '#c9dcf6', low: '#e5eef9', warm: '#ffdcaa' }, glow: '#8497ff', bark: '#2d1f1b' },
    Rojo: { name: 'Flamboyán', sci: 'Delonix regia', accent: '#ff8e7b', mid: '#d4392a', ink: ['#d42a18', '#ef5a44'],
      bg: { top: '#1b0c0a', mid: '#33140f', low: '#4a1c15', warm: '#b0461c' }, day: { top: '#e9b9ad', mid: '#f5d6cc', low: '#fbe9e2', warm: '#ffcf94' }, glow: '#ff8a5e', bark: '#2d1f1b' },
    Amarillo: { name: 'Lapacho amarillo', sci: 'Handroanthus albus', accent: '#f7cf55', mid: '#c99a10', ink: ['#e8a90c', '#f5c518'],
      bg: { top: '#221808', mid: '#40300f', low: '#573b0f', warm: '#d08a14' }, day: { top: '#efd58d', mid: '#f8e8bb', low: '#fcf4dc', warm: '#ffcf70' }, glow: '#f9cf62', bark: '#2d1f1b' },
    Blanco: { name: 'Lapacho blanco', sci: 'Tabebuia roseoalba', accent: '#f3f1ec', mid: '#aeaaa2', ink: ['#e6e2da', '#fbfaf6'],
      bg: { top: '#2c2c34', mid: '#4b4b55', low: '#63626b', warm: '#a8896a' }, day: { top: '#a7a6aa', mid: '#cfcdcf', low: '#ecebea', warm: '#f6dcc2' }, glow: '#f1ece4', bark: '#2d1f1b' },
    Verde: { name: 'Árbol en hoja nueva', sci: '', accent: '#98d878', mid: '#4e9a3b', ink: ['#4e9a3b', '#86c25a'],
      bg: { top: '#07201a', mid: '#0f3a2c', low: '#175038', warm: '#9a7a1c' }, day: { top: '#a9d8be', mid: '#d3ebdc', low: '#ecf6ef', warm: '#ffe9a6' }, glow: '#74cf8a', bark: '#2d1f1b' },
    Negro: { name: 'Silueta al atardecer', sci: '', accent: '#e3cfa2', mid: '#8c7b5c', ink: ['#a8997f', '#e3cfa2'],
      bg: { top: '#09080d', mid: '#16131c', low: '#241d26', warm: '#7a4a1c' }, day: { top: '#8a868c', mid: '#b4b0b3', low: '#e2dedb', warm: '#e8c08e' }, daySky: { top: '#141216', mid: '#2c292f', low: '#5e5862', warm: '#e2a866' }, glow: '#9a6a3c', bark: '#0a0608' },
  };

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

  window.SunsetTree = { TREES: TREES, flowerSVG: flowerSVG };
})();
