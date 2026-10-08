// Árboles de cada color: nombre, nombre científico y los dos tonos de su flor.
// El paisaje de cada semana es una imagen fija (public/images/trees); el código que la
// dibuja está en tools/tree-render.js y solo se usa para regenerarla.
(function () {
  'use strict';

  const TREES = {
    Lila: { ink: ['#B565C9', '#D58AD8'], name: 'Lapacho morado', sci: 'Handroanthus impetiginosus' },
    Azul: { ink: ['#6A6CC9', '#9AA0EC'], name: 'Jacarandá', sci: 'Jacaranda mimosifolia' },
    Rojo: { ink: ['#D42A18', '#EF5A44'], name: 'Flamboyán', sci: 'Delonix regia' },
    Amarillo: { ink: ['#E8A90C', '#F5C518'], name: 'Lapacho amarillo', sci: 'Handroanthus albus' },
    Blanco: { ink: ['#E9CFDB', '#FBF1F5'], name: 'Lapacho blanco', sci: 'Tabebuia roseoalba' },
    Verde: { ink: ['#4E9A3B', '#86C25A'], name: 'Árbol en hoja nueva', sci: '' },
    Negro: { ink: ['#2A2420', '#5A4C42'], name: 'Silueta al atardecer', sci: '' },
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
