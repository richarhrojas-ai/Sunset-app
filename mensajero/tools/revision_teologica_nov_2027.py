# Revisión teológica de los guiones de noviembre 2027 (semanas 44 a 47), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_nov_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (45,'Jueves','La oración en emergencia tiene respuesta','Dios está cerca del que sufre (34:18)',
  'El mismo salmo reconoce que el justo pasa muchas aflicciones (34:19); no prometer que toda emergencia termina bien'),
 (46,'Sabado','La fortaleza y la elevación sobrenatural.','Dios da fuerza para seguir caminando.',
  'El punto sale del texto («me das pies ligeros, como de cierva») sin prometer experiencias extraordinarias'),
 (46,'Miercoles','• • ','• ','Viñeta doble'),
 (45,'Domingo','compasión practica','compasión práctica','Tilde'),
 (45,'Lunes','confianza en El calma','confianza en Él calma','Tilde'),
 (45,'Martes','quien esta en peligro','quien está en peligro','Tilde'),
 (45,'Viernes','Dios esta presente','Dios está presente','Tilde'),
 (47,'Domingo','El da generosamente','Él da generosamente','Tilde'),
 (47,'Lunes','El endereza','Él endereza','Tilde'),
]

V = [  # (semana, columna, texto anterior, texto nuevo)
 (46,'Versiculo Jueves','— Que todo lo que respira alabe al Senor! Aleluya','— ¡Que todo lo que respira alabe al Señor! ¡Aleluya!'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, campo, motivo, nuevo in G:
    fila[(s, d)][h.index(campo)].value = nuevo
t = wb['Temas Macro 2027']; ht = [c.value for c in t[1]]
for s, d, viejo, nuevo, motivo in P:
    c = t.cell(s + 1, ht.index('3 Puntos ' + d) + 1)
    if viejo in nuevo and nuevo in c.value: continue   # ya aplicado
    c.value = c.value.replace(viejo, nuevo)
for s, col, viejo, nuevo in V:
    c = t.cell(s + 1, ht.index(col) + 1)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion, {len(P)} puntos y {len(V)} citas corregidos')
