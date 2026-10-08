#!/usr/bin/env python3
"""Genera los 7 íconos de las dimensiones (línea blanca + destello dorado) como <symbol> SVG.

Uso: python3 tools/make_icons.py   → imprime los <symbol id="d-0"…"d-6"> que van dentro del sprite SVG
al final de public/index.html (junto al degradé #goldGlow que da el destello dorado).
Cada ícono vive en una cuadrícula de 48×48; .glow es el destello dorado central.
"""
import math

def gear(cx, cy, r_out, r_in, teeth, hole=0.0, rot=0.0):
    """Contorno de un engranaje: dientes trapezoidales alrededor de un círculo."""
    pts = []
    step = 2 * math.pi / teeth
    for i in range(teeth):
        a = rot + i * step
        for off, r in ((-0.30, r_in), (-0.18, r_out), (0.18, r_out), (0.30, r_in)):
            ang = a + off * step * 1.6
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d = "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + " Z"
    if hole:
        d += f" M{cx + hole:.2f} {cy:.2f} A{hole:.2f} {hole:.2f} 0 1 0 {cx - hole:.2f} {cy:.2f} A{hole:.2f} {hole:.2f} 0 1 0 {cx + hole:.2f} {cy:.2f} Z"
    return d

def rays(cx, cy, r1, r2, n=8, start=0):
    return " ".join(f"M{cx + r1*math.cos(start + i*2*math.pi/n):.2f} {cy + r1*math.sin(start + i*2*math.pi/n):.2f} L{cx + r2*math.cos(start + i*2*math.pi/n):.2f} {cy + r2*math.sin(start + i*2*math.pi/n):.2f}" for i in range(n))

G = lambda cx, cy, r: f'<circle class="glow" cx="{cx}" cy="{cy}" r="{r}"/>'
icons = {}

# 0 · Regalo de Dios: manos en copa sosteniendo una esfera solar
icons[0] = (G(24, 16, 11) + f'<circle cx="24" cy="16" r="5"/><path d="{rays(24,16,7.5,10.5,8)}"/>'
  '<path d="M5 28 C5 37 13 43 24 43 C35 43 43 37 43 28"/>'
  '<path d="M5 28 C10 29 15 32 19 36 M43 28 C38 29 33 32 29 36"/>'
  '<path d="M10 33.5 C13 36.5 17 38.5 21 39.5 M38 33.5 C35 36.5 31 38.5 27 39.5" opacity=".75"/>')

# 1 · Prioridades: faro con haz de luz horizontal
icons[1] = (G(24, 14, 9) +
  '<path d="M19 42 L21 19 H27 L29 42 Z"/><path d="M20.4 27 H27.6 M19.7 34.5 H28.3"/>'
  '<path d="M20 19 V14 H28 V19"/><path d="M19 14 L24 9 L29 14"/><circle cx="24" cy="16.5" r="1.6"/>'
  '<path d="M15 42 H33"/><path d="M31 15 L45 11.5 M31 17.5 L45 18 M17 15 L3 11.5 M17 17.5 L3 18" opacity=".7"/>')

# 2 · Interés: libro abierto con un brote de hojas
icons[2] = (G(24, 18, 10) +
  '<path d="M24 41 C19 37.5 12 37 6 38.5 V25 C12 23.5 19 24 24 27.5 C29 24 36 23.5 42 25 V38.5 C36 37 29 37.5 24 41 Z"/>'
  '<path d="M24 27.5 V41"/>'
  '<path d="M24 26 V17"/><path d="M24 20 C24 15 19.5 13 15.5 14 C15.5 18.5 19 21 24 20 Z"/><path d="M24 17 C24 12 28.5 10 32.5 11 C32.5 15.5 29 18 24 17 Z"/>')

# 3 · Desafío: montaña con sendero en zigzag
icons[3] = (G(35, 11, 8) +
  '<path d="M3 42 L20 13 L29 28 L33 22 L45 42 Z"/>'
  '<path d="M16 42 L25 36.5 L15.5 31 L24 25.5 L17.5 21.5 L20 16.5" />'
  f'<circle cx="35" cy="11" r="2.6"/><path d="{rays(35,11,4.6,6.6,8)}" opacity=".85"/>')

# 4 · Valor: mano sosteniendo un diamante facetado con destello
icons[4] = (G(24, 15, 12) +
  '<path d="M16 7 H32 L38 14 L24 29 L10 14 Z"/><path d="M10 14 H38 M16 7 L19.5 14 L24 7 L28.5 14 L32 7 M19.5 14 L24 29 L28.5 14"/>'
  '<path d="M41 4 V9 M38.5 6.5 H43.5" opacity=".9"/>'
  '<path d="M4 38 C9 35.5 14 36.5 18 38.5 H29.5 C32.2 38.5 32.2 42 29.5 42 H20 M18 38.5 L11 42.5 L4 41 M20 42 L33 42 L42 38.5"/>')

# 5 · Estrategia: caballo de ajedrez sobre un engranaje
icons[5] = (G(24, 18, 12) +
  '<path d="M17 31 C17 26 19.5 24 21 21 C18 21.2 15.5 19.5 15.2 17 L20 10.5 L19.5 6.5 L23 8.2 C24 7.8 25 7.6 26 7.8 C32 9 34.5 15 33.8 21.5 C33.4 25 33.8 28 34.2 31 Z"/>'
  '<path d="M14.5 31 H35.5"/><circle cx="23.3" cy="13.4" r=".9"/><path d="M28.5 10.5 C30.5 14 30.5 18 28.5 22"/>'
  f'<path d="{gear(24, 39.5, 9.2, 7.2, 10, hole=2.4)}"/>')

# 6 · Sistema: tres engranajes conectados con un sol radiante al centro
icons[6] = (G(24, 24, 10) +
  f'<path d="{gear(15.5, 29.5, 10.5, 8.2, 9, hole=3.2)}"/>'
  f'<path d="{gear(34.5, 14.5, 8, 6.2, 8, hole=2.6, rot=.2)}"/>'
  f'<path d="{gear(35.5, 36, 7, 5.4, 8, hole=2.2, rot=.4)}"/>'
  f'<circle cx="24" cy="24" r="2.6"/><path d="{rays(24,24,4,6,8)}" opacity=".9"/>')

out = []
for i in range(7):
    out.append(f'  <symbol id="d-{i}" viewBox="0 0 48 48">{icons[i]}</symbol>')
print("\n".join(out))
