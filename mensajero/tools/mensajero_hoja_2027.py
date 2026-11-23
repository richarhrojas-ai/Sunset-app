# Datos institucionales de la hoja «Mensajero» de la planilla 2027 (los ve el locutor en la app, sección Sobre Mensajero).
# Uso: python3 tools/mensajero_hoja_2027.py  →  después python3 tools/build_data.py
# Solo pisa las filas listadas acá; lo demás queda como está en la planilla.
import openpyxl
from pathlib import Path

XLSX = Path(__file__).resolve().parent.parent / 'content' / 'planillas' / 'Mensajero_TemasMacro_2027.xlsx'
DATOS = {  # (Sección, Título): texto
    ('Propósito', 'Misión'): 'Edificar una cultura con principios bíblicos.',
    ('Propósito', 'Visión'): 'Que cada oyente reconozca que Jesús es el camino a seguir.',
}

wb = openpyxl.load_workbook(XLSX)
ws = wb['Mensajero']
h = [c.value for c in ws[1]]
hechos = 0
for fila in ws.iter_rows(min_row=2):
    k = (fila[h.index('Seccion')].value, fila[h.index('Titulo')].value)
    if k in DATOS:
        fila[h.index('Texto')].value = DATOS[k]
        hechos += 1
wb.save(XLSX)
print(f'{hechos} de {len(DATOS)} datos cargados en la hoja «Mensajero»')
