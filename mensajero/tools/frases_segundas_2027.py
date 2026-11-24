# Segunda frase célebre de los subtemas 1 y 2 (martes y jueves), verificada como las primeras.
# Fuente: content/frases_2027_b.txt (semana|subtema|"frase" — Autor|fuente|URL|nota). Escribe las columnas
# «Frase Celebre 1b» y «Frase Celebre 2b» de la hoja «Temas Macro 2027». Después: python3 tools/build_data.py
import sys, openpyxl
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / 'content' / 'planillas' / 'Mensajero_TemasMacro_2027.xlsx'
SRC = ROOT / 'content' / 'frases_2027_b.txt'

filas = {}
for n, l in enumerate(SRC.read_text(encoding='utf-8').splitlines(), 1):
    if not l.strip():
        continue
    sem, sub, frase = [x.strip() for x in l.split('|')[:3]]
    filas[(int(sem), int(sub))] = frase
faltan = [(s, k) for s in range(1, 53) for k in (1, 2) if (s, k) not in filas]
if faltan:
    sys.exit(f'Faltan frases: {faltan[:10]}')

wb = openpyxl.load_workbook(XLSX)
ws = wb['Temas Macro 2027']
head = [c.value for c in ws[1]]
for k in (1, 2):
    nombre = f'Frase Celebre {k}b'
    if nombre not in head:
        ws.cell(row=1, column=len(head) + 1, value=nombre); head.append(nombre)
col = {h: i for i, h in enumerate(head)}
for r in ws.iter_rows(min_row=2):
    if not r[col['Semana']].value:
        continue
    s = int(r[col['Semana']].value)
    for k in (1, 2):
        r[col[f'Frase Celebre {k}b']].value = filas[(s, k)]
wb.save(XLSX)
print(f'{len(filas)} segundas frases cargadas')
