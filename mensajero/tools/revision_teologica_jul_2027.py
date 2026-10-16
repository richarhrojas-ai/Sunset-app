# Revisión teológica de los guiones de julio 2027 (semanas 27 a 30), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_jul_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (28,'Lunes','El buen manejo trae recompensa','La recompensa: más responsabilidad y el gozo del Señor',
  'En la parábola la recompensa es «sobre mucho te pondré» y «entra en el gozo de tu señor», no una ganancia; evitar la lectura de prosperidad'),
 (29,'Viernes','• Confía en Dios: Pon tus planes en sus manos.','• Quien habla es Elifaz: Un amigo de Job cuya idea de Dios fue corregida (42:7).',
  'Job 22:28 no es una promesa de Dios: lo dice Elifaz, que creía que el sufrimiento de Job era castigo'),
 (29,'Viernes','• Persevera: Dios puede ayudarte a llevarlos a buen término.','• Confía en Dios: Pon tus planes en sus manos.',
  'Mismo motivo: no presentar el versículo como garantía de que los planes saldrán bien'),
 (29,'Viernes','3 Camina en su luz','• Camina en su luz','Número suelto de copia'),
 (28,'Viernes','lo 2. material.','lo material.','Número suelto de copia'),
 (28,'Sabado','3 Aprender','• Aprender','Número suelto de copia'),
 (29,'Sabado','no esta garantizado','no está garantizado','Tilde'),
 (30,'Martes','le pertenece a El','le pertenece a Él','Tilde'),
 (30,'Sabado','La prAI31:AK31oduccion propia','La producción propia','Referencia de celda pegada en el texto y tilde'),
]

V = []  # sin erratas en las citas

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
