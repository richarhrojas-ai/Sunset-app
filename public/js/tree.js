// Árboles de cada color: nombre, nombre científico y los dos tonos de su flor.
// El paisaje de cada semana es una imagen fija (public/images/trees); el código que la
// dibuja está en tools/tree-render.js y solo se usa para regenerarla.
(function () {
  'use strict';

  // accent/mid: colores de la interfaz de esa semana · ink: tonos de la flor en el progreso y el tablero
  // · top: color del cielo arriba (se ve mientras carga la imagen)
  const TREES = {
    Lila:     { name: 'Lapacho morado',      sci: 'Handroanthus impetiginosus', accent: '#c9a0f0', mid: '#9b59b6', ink: ['#b565c9', '#d58ad8'], top: '#1c102b' },
    Azul:     { name: 'Jacarandá',           sci: 'Jacaranda mimosifolia',      accent: '#a9b0fa', mid: '#6a6cc9', ink: ['#6a6cc9', '#9aa0ec'], top: '#190f2e' },
    Rojo:     { name: 'Flamboyán',           sci: 'Delonix regia',              accent: '#ff8e7b', mid: '#d4392a', ink: ['#d42a18', '#ef5a44'], top: '#1e0e24' },
    Amarillo: { name: 'Lapacho amarillo',    sci: 'Handroanthus albus',         accent: '#f7cf55', mid: '#c99a10', ink: ['#e8a90c', '#f5c518'], top: '#1c102b' },
    Blanco:   { name: 'Lapacho blanco',      sci: 'Tabebuia roseoalba',         accent: '#f4ebf6', mid: '#b9a8c0', ink: ['#e9cfdb', '#fbf1f5'], top: '#1c102b' },
    Verde:    { name: 'Árbol en hoja nueva', sci: '',                           accent: '#98d878', mid: '#4e9a3b', ink: ['#4e9a3b', '#86c25a'], top: '#14122a' },
    Negro:    { name: 'Silueta al atardecer', sci: '',                          accent: '#e3cfa2', mid: '#8c7b5c', ink: ['#a8997f', '#e3cfa2'], top: '#0f0916' },
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
