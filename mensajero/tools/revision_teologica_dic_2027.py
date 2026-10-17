# Revisión teológica de los guiones de diciembre 2027 (semanas 48 a 52), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_dic_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (48,'Jueves','Creer trae salvación para la casa','La promesa alcanza a toda la casa que cree',
  'Hechos 16:31-34: creyeron todos los de la casa; la fe de uno no salva automáticamente a los demás'),
 (48,'Sabado','Evita la maldición del distanciamiento','Dios restaura lo que el distanciamiento rompe',
  'Sin amenaza: el foco de Malaquías 4:6 es la reconciliación'),
 (49,'Domingo','Prosperidad con propósito: La bendición','Bendición con propósito: La bendición',
  'Deuteronomio 15:6 es una promesa del pacto con Israel; evitar el lenguaje de prosperidad'),
 (49,'Jueves','bienes:','bienes','Puntuación'),
 (52,'Domingo','• La condición (Servicio exclusivo a Dios).\n• La provisión (Bendición del pan y del agua).\n• La sanidad y protección (Remoción de la enfermedad)',
  '• Servir solo a Dios: La fidelidad del pueblo del pacto.\n• Provisión: Dios bendice el pan y el agua.\n• Una promesa a Israel: Dios cuida la salud de su pueblo.',
  'Éxodo 23:25 es parte del pacto con Israel; no presentarlo como condición para no enfermarse hoy'),
 (52,'Lunes','Orar unos por otros trae sanidad','Orar unos por otros, también por la sanidad',
  'Santiago 5:16 no es una garantía de sanidad física'),
 (51,'Martes','sabiduría practica','sabiduría práctica','Tilde'),
 (51,'Martes','Saber que hacer','Saber qué hacer','Tilde'),
]

V = [  # (semana, columna, texto anterior, texto nuevo)
 (48,'Versiculo Martes','Josue 4:6-7','Josué 4:6-7'),
 (51,'Versiculo Martes','1 Cronicas 12:32','1 Crónicas 12:32'),
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
