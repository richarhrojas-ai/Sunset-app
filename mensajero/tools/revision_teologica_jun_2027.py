# Revisión teológica de los guiones de junio 2027 (semanas 22 a 26), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_jun_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (23,'Martes','Dios puede restaurar: Lo poco puede convertirse en mucho.','Quien habla es Bildad: Un amigo de Job cuya idea de Dios fue corregida (42:7).',
  'Job 8:7 no es una promesa de Dios: lo dice Bildad'),
 (23,'Martes','Esperar en Dios: El proceso no define el resultado.','Los comienzos pequeños: No definen el final ni son una vergüenza.',
  'Mismo motivo: el punto sale de lo que sí enseña el pasaje leído en su contexto'),
 (23,'Martes','Un futuro mejor: Dios puede traer mayor bendición después.','Dios no abandona: Restauró a Job por gracia, no como pago.',
  'Evitar la promesa de prosperidad; lo que el libro de Job muestra es la fidelidad de Dios'),
 (24,'Sabado','La dieta sencilla mostró mejores resultados','Dios honró la fidelidad de Daniel',
  'Daniel 1 atribuye el resultado a Dios (1:9, 17); no es una «dieta bíblica»'),
]

V = [  # errata en la cita
 (22,'Versiculo Sabado','1 Tesalonisenses','1 Tesalonicenses'),
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
    if nuevo in c.value: continue   # ya aplicado
    assert viejo in c.value, (s, d, c.value)
    c.value = c.value.replace(viejo, nuevo)
for s, col, viejo, nuevo in V:
    c = t.cell(s + 1, ht.index(col) + 1)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion, {len(P)} puntos y {len(V)} citas corregidos')
