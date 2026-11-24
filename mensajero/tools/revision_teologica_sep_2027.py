# Revisión teológica de los guiones de septiembre 2027 (semanas 35 a 39), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_sep_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (35,'Martes','• • El amor al dinero como origen del mal: \n• • La desviación de la fe: \n• • Consecuencias dolorosas:',
  '• El amor al dinero, no el dinero, es la raíz del problema\n• La codicia aparta de la fe\n• La codicia trae muchos dolores',
  'Puntos incompletos; se aclara que el problema es el amor al dinero, no el dinero'),
 (35,'Miercoles','Poner a Dios y lo espiritual en','Poner a Dios y lo espiritual en primer lugar.','Punto cortado'),
 (35,'Domingo','2 Necesidades','• Necesidades','Número suelto de copia'),
 (35,'Domingo','3 Fuente','• Fuente','Número suelto de copia'),
 (36,'Miercoles','La pereza lleva a servir a otros','La negligencia tiene consecuencias',
  'Proverbios 12:24 es un principio; no toda persona que sirve a otros o está abajo es perezosa'),
 (37,'Lunes','El modelo cooperativo tiene raíces bíblicas','Compartir nace del amor, no de la obligación',
  'Anacronismo: Hechos 4 no es un modelo económico; compartir era voluntario (5:4)'),
 (39,'Martes','• • ','• ','Viñeta doble'),
 (39,'Domingo','Lo viejo paso,','Lo viejo pasó,','Tilde'),
]

V = [  # (semana, columna, texto anterior, texto nuevo): tildes en el texto del versículo
 (38,'Versiculo Lunes','Acuerdate','Acuérdate'),
 (38,'Versiculo Lunes','los dias','los días'),
 (38,'Versiculo Lunes','los anos','los años'),
 (39,'Versiculo Viernes','El Espiritu mismo','El Espíritu mismo'),
 (39,'Versiculo Viernes','nuestro espiritu','nuestro espíritu'),
 (39,'Versiculo Viernes','somos tambien','somos también'),
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
