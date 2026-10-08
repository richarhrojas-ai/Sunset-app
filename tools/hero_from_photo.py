#!/usr/bin/env python3
"""Usa una foto real como paisaje de un color, en lugar de la ilustración.

Uso:
    python3 tools/hero_from_photo.py FOTO.jpg Lila [--x 0.5] [--y 0.5]

Genera public/images/trees/<Color>-wide.webp (pantallas anchas) y -tall.webp (celulares)
recortando la foto al formato de cada una. --x y --y (0 a 1) indican dónde está el árbol
en la foto, para que el recorte lo deje centrado (por defecto, al centro).

Consejos para la foto:
  - Horizontal y de buena calidad (al menos 2000 px de ancho).
  - El árbol entero, con aire arriba (la cabecera tapa un poco el cielo) y con el horizonte
    o el pie del árbol en el tercio de abajo: ahí van el nombre de la semana y los botones,
    sobre un degradé oscuro que la app agrega sola.
  - Que sea tuya, o con licencia que permita usarla.

Para volver a la ilustración: node tools/render_trees.cjs
"""
import argparse
import pathlib
import sys

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
COLORS = ["Negro", "Rojo", "Azul", "Lila", "Verde", "Amarillo", "Blanco"]
FORMATS = {"wide": (2080, 900), "tall": (960, 860)}   # mismo formato que las imágenes de la app


def crop_cover(img, size, fx, fy):
    """Recorta y escala la foto para cubrir `size`, dejando el punto (fx, fy) lo más centrado posible."""
    tw, th = size
    scale = max(tw / img.width, th / img.height)
    w, h = round(img.width * scale), round(img.height * scale)
    img = img.resize((w, h), Image.LANCZOS)
    left = min(max(round(fx * w - tw / 2), 0), w - tw)
    top = min(max(round(fy * h - th / 2), 0), h - th)
    return img.crop((left, top, left + tw, top + th))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("foto")
    ap.add_argument("color", choices=COLORS)
    ap.add_argument("--x", type=float, default=0.5)
    ap.add_argument("--y", type=float, default=0.5)
    a = ap.parse_args()

    img = ImageOps.exif_transpose(Image.open(a.foto)).convert("RGB")
    if img.width < 1400:
        print(f"Aviso: la foto mide {img.width} px de ancho; se verá borrosa en pantallas grandes.", file=sys.stderr)
    out = ROOT / "public" / "images" / "trees"
    out.mkdir(parents=True, exist_ok=True)
    for kind, size in FORMATS.items():
        dest = out / f"{a.color}-{kind}.webp"
        crop_cover(img, size, a.x, a.y).save(dest, "WEBP", quality=82, method=6)
        print("Escrito", dest.relative_to(ROOT))


if __name__ == "__main__":
    main()
