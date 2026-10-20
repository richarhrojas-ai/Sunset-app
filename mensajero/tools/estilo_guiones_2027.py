# Pasada de estilo 2027: varía los arranques repetidos («Si tenés…», «Antes de…», «Esta semana,…», «Pensar que…»)
# en «En la práctica», «Problemática» y la acción del sábado, sin cambiar el sentido.
# Los cambios están en content/estilo_guiones_2027.json ({semana, dia, campo, viejo, nuevo}).
# Orden: generador del mes → revisión teológica → verificación de datos → este script → build_data.py
import json, sys, openpyxl
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / 'content' / 'planillas' / 'Mensajero_TemasMacro_2027.xlsx'
CAMBIOS = json.loads((ROOT / 'content' / 'estilo_guiones_2027.json').read_text(encoding='utf-8'))

wb = openpyxl.load_workbook(XLSX)
ws = wb['Guiones 2027']
head = [c.value for c in ws[1]]
col = {h: i for i, h in enumerate(head)}
filas = {(int(r[col['Semana']].value), str(r[col['Dia']].value).strip()): r for r in ws.iter_rows(min_row=2) if r[col['Semana']].value}
norm = lambda s: ' '.join(str(s or '').split())
DIA = {'Miercoles': 'Miércoles', 'Sabado': 'Sábado'}

hechos = ya = 0
for c in CAMBIOS:
    r = filas.get((c['semana'], c['dia'])) or filas.get((c['semana'], DIA.get(c['dia'], c['dia'])))
    if not r:
        sys.exit(f'No encuentro la fila semana {c["semana"]} {c["dia"]}')
    celda = r[col[c['campo']]]
    if norm(celda.value) == norm(c['nuevo']):
        ya += 1
    elif norm(celda.value) == norm(c['viejo']):
        celda.value = c['nuevo']; hechos += 1
    else:
        print(f'Aviso: semana {c["semana"]} {c["dia"]} {c["campo"]} cambió desde la pasada de estilo; no se toca.')
wb.save(XLSX)
print(f'Estilo: {hechos} frases variadas, {ya} ya estaban.')
