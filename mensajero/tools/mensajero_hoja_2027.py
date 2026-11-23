# Datos institucionales de la hoja «Mensajero» de la planilla 2027 (los ve el locutor en la app, sección Sobre Mensajero).
# Uso: python3 tools/mensajero_hoja_2027.py  →  después python3 tools/build_data.py
# Solo pisa las filas listadas acá; lo demás queda como está en la planilla.
import openpyxl
from pathlib import Path

XLSX = Path(__file__).resolve().parent.parent / 'content' / 'planillas' / 'Mensajero_TemasMacro_2027.xlsx'
DATOS = {  # (Sección, Título): texto
    # Historia: libro «Tejiendo vida en los corazones: La historia de Radio Mensajero 100.9 FM», Samuel Sosa, 2011
    ('Historia', 'Historia breve'): ('Radio Mensajero nació de una visión: en agosto de 1965, en Asunción, el misionero Frank Kroeker '
        'conversó con Dietrich Lepp sobre llevar el evangelio por la radio. Esa visión dio origen a ZP-30, La voz del Chaco paraguayo, '
        'que salió al aire en 1975, y más tarde al Ministerio Buenas Nuevas. En 1981, Gustavo Quiring donó una casa en Tres Palmas para '
        'una radio, y en 1998 CONATEL adjudicó la frecuencia 100.9 FM. El 26 de febrero de 1999 Radio Mensajero hizo su primera '
        'transmisión desde Tres Palmas, y el 6 de marzo de 1999 fue dedicada a Dios. Desde entonces creció a 10 kW y se escucha también por internet.'),
    ('Historia', 'Fecha de fundación'): ('Primera transmisión: 26 de febrero de 1999. Dedicación: sábado 6 de marzo de 1999. '
        'El aniversario se celebra el 25 de marzo.'),
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
