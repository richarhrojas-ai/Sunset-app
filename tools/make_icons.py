#!/usr/bin/env python3
"""Genera los 7 íconos de las dimensiones (solo línea, sin halo) como <symbol> SVG.

Uso: python3 tools/make_icons.py   → imprime los <symbol id="d-0"…"d-6"> que van dentro del sprite SVG
al final de public/index.html. Cada ícono vive en una cuadrícula de 48×48.
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

# Sin halo circular detrás de los íconos (se veía como un anillo); queda solo la línea.
G = lambda cx, cy, r: ''
icons = {}

# 0 · Regalo de Dios: dos manos juntas, palmas arriba, que ofrecen un sol (las manos de Dios dando)
def hand_pair():
    # Dos manos juntas en cuenco: el borde de abajo es el canto de las manos, el de arriba las yemas y las palmas;
    # se unen en el centro (línea del medio) y las muñecas bajan. La mano derecha es el espejo de la izquierda.
    left = ('M24 42.5 C11.5 42.5 2.5 37.5 1.6 26 C1.5 24.6 3.1 24 4.1 25.1 '
            'C7.8 29.6 12.4 32.6 17.2 34 C19.6 34.7 22 35 24 35')
    fingers = 'M6.6 27.8 L8 30.4 M10.2 30.4 L11.4 33 M13.9 32.3 L14.7 34.9'
    wrist = 'M18.4 42 L17 46.5'
    mirror = lambda d: __import__('re').sub(r'(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)', lambda m: f"{48 - float(m.group(1)):g} {m.group(2)}", d)
    return (f'<path d="{left}"/><path d="{mirror(left)}"/><path d="M24 35 V42.5"/>'
            f'<path d="{wrist} {mirror(wrist)}"/><path d="{fingers} {mirror(fingers)}" opacity=".8"/>')
icons[0] = (G(24, 16, 11) + f'<circle cx="24" cy="16" r="4.8"/><path d="{rays(24, 16, 7.2, 10, 8)}"/>' + hand_pair())

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

# 4 · Valores: mano abierta, palma arriba, con un diamante facetado apoyado en ella y un destello
icons[4] = (G(26, 21, 12) +
  '<path d="M17.5 12 H34.5 L39.5 18.5 L26 33.5 L12.5 18.5 Z"/>'
  '<path d="M12.5 18.5 H39.5 M17.5 12 L21 18.5 L26 12 L31 18.5 L34.5 12 M21 18.5 L26 33.5 L31 18.5"/>'
  '<path d="M42 4.5 V9.5 M39.5 7 H44.5" opacity=".9"/>'
  # mano: muñeca a la izquierda, pulgar que sube, dedos extendidos hacia la derecha y la palma que recibe
  '<path d="M3 36.5 H11 C13 36.5 14.2 34.4 16.2 34.2 C18.4 34 19.2 36 18.2 37.3 H35.5 C40 37.3 41.6 39.3 41.2 40.8 '
  'C40.8 42.4 38.6 42.9 36 43 L24 43.6 C19 45.4 14 46.2 3 45.6"/>'
  '<path d="M22 40.2 H38.2 M23 42 H33.5" opacity=".75"/>')

# 6 · Sistema: caballo de ajedrez sobre un engranaje (sus palabras son de ajedrez)
icons[6] = (G(24, 18, 12) +
  '<path d="M17 31 C17 26 19.5 24 21 21 C18 21.2 15.5 19.5 15.2 17 L20 10.5 L19.5 6.5 L23 8.2 C24 7.8 25 7.6 26 7.8 C32 9 34.5 15 33.8 21.5 C33.4 25 33.8 28 34.2 31 Z"/>'
  '<path d="M14.5 31 H35.5"/><circle cx="23.3" cy="13.4" r=".9"/><path d="M28.5 10.5 C30.5 14 30.5 18 28.5 22"/>'
  f'<path d="{gear(24, 39.5, 9.2, 7.2, 10, hole=2.4)}"/>')

# 5 · Estrategia: tres engranajes conectados con un sol radiante al centro
icons[5] = (G(24, 24, 10) +
  f'<path d="{gear(15.5, 29.5, 10.5, 8.2, 9, hole=3.2)}"/>'
  f'<path d="{gear(34.5, 14.5, 8, 6.2, 8, hole=2.6, rot=.2)}"/>'
  f'<path d="{gear(35.5, 36, 7, 5.4, 8, hole=2.2, rot=.4)}"/>'
  f'<circle cx="24" cy="24" r="2.6"/><path d="{rays(24,24,4,6,8)}" opacity=".9"/>')

out = []
for i in range(7):
    out.append(f'  <symbol id="d-{i}" viewBox="0 0 48 48">{icons[i]}</symbol>')
print("\n".join(out))
