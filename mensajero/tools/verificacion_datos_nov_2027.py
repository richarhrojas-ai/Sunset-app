# Verificación de los datos curiosos de noviembre 2027 (semanas 44 a 47), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_nov_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (45,'Viernes','En Paraguay, el 141 es el número del Servicio de Emergencias Médicas Extrahospitalarias (SEME), el 911 el del sistema de emergencias y el 132 el de los Bomberos Voluntarios.',
  'Ministerio de Salud Pública y Bienestar Social; Sistema 911; Cuerpo de Bomberos Voluntarios del Paraguay','Se agrega el número de los bomberos'),
 (46,'Martes','El Salmo 34 es un acróstico: en hebreo, sus versículos van siguiendo, uno tras otro, las letras del alfabeto.',
  'Salmo 34 (texto hebreo)','El acróstico no es perfecto (falta una letra)'),
 (47,'Miércoles','Una revisión de estudios sobre la postergación encontró que se asocia con peores resultados; otros estudios la vinculan también con más estrés.',
  'Piers Steel, Psychological Bulletin, 2007; Tice y Baumeister, Psychological Science, 1997','El vínculo con el estrés viene de otros estudios'),
]

V = []

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, dato, fuente, motivo in A:
    fila[(s, d)][h.index('Dato curioso')].value = dato
    fila[(s, d)][h.index('Fuente dato')].value = fuente
t = wb['Temas Macro 2027']; ht = [c.value for c in t[1]]
for s, col, viejo, nuevo in V:
    c = t.cell(s + 1, ht.index(col) + 1)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(A)} datos ajustados y {len(V)} versículos corregidos')
