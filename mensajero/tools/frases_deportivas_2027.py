# Frase deportiva de cada día de 2027 (domingo a sábado): original, sin autor, con una imagen del deporte
# que mantiene el tema del día. La fuente es content/frases_deportivas_2027.txt (semana|Dia|deporte|frase);
# este script la carga en la hoja «Frases Deportivas 2027» de la planilla. Después: python3 tools/build_data.py
import sys, openpyxl
from pathlib import Path
from openpyxl.styles import Alignment, Font

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / 'content' / 'planillas' / 'Mensajero_TemasMacro_2027.xlsx'
SRC = ROOT / 'content' / 'frases_deportivas_2027.txt'
DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

filas = []
for n, l in enumerate(SRC.read_text(encoding='utf-8').splitlines(), 1):
    if not l.strip():
        continue
    sem, dia, dep, frase = [x.strip() for x in l.split('|')]
    if dia not in DIAS:
        sys.exit(f'Línea {n}: día «{dia}» no válido')
    filas.append((int(sem), dia, dep, frase))
filas.sort(key=lambda f: (f[0], DIAS.index(f[1])))
claves = [(f[0], f[1]) for f in filas]
faltan = [(s, d) for s in range(1, 53) for d in DIAS if (s, d) not in claves]
if len(set(claves)) != len(claves) or faltan:
    sys.exit(f'Días repetidos o faltantes: {faltan[:10]}')

wb = openpyxl.load_workbook(XLSX)
hoja = 'Frases Deportivas 2027'
if hoja in wb.sheetnames:
    del wb[hoja]
ws = wb.create_sheet(hoja)
ws.append(['Semana', 'Dia', 'Deporte', 'Frase'])
for c in ws[1]:
    c.font = Font(bold=True)
for f in filas:
    ws.append(list(f))
for col, ancho in zip('ABCD', (9, 12, 14, 110)):
    ws.column_dimensions[col].width = ancho
for row in ws.iter_rows(min_row=2):
    row[3].alignment = Alignment(wrap_text=True, vertical='top')
wb.save(XLSX)
print(f'{len(filas)} frases deportivas cargadas en «{hoja}»')
