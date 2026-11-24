# Revisión teológica de los guiones de abril 2027 (semanas 14 a 17), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_abr_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = [  # (semana, día, campo, motivo, texto nuevo)
 (14,'Sábado','Solucion 1','1 Corintios 4:2 habla de los que administran los misterios de Dios; se dice el contexto antes de aplicarlo al dinero',
  'Pablo habla de los que sirven administrando lo que Dios les confió: lo primero que se espera es que sean confiables. Lo mismo vale para lo que tenemos, que también es de Dios. Esta semana, sentate con tu familia y armen o ajusten su presupuesto del mes.'),
 (17,'Miércoles','Desarrollo 2','El paralelo entre el pecado y la falta de ejercicio podía leerse como si no moverse fuera pecado',
  'Para correr hay que soltar lo que pesa. En la fe, lo que nos frena es el pecado y las cargas innecesarias. En el cuidado del cuerpo, salvando las distancias, lo que más frena es la falta de movimiento.'),
]

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (15,'Miercoles','Correr sin fatigarse es promesa para quien espera','Dios da fuerzas nuevas para seguir',
  'Isaías 40:31 es poesía: no promete que nunca nos cansemos'),
 (15,'Viernes','Sin ese anhelo, la vida espiritual se estanca','Aun en la sequía, el anhelo nos lleva a buscarlo',
  'El subtema es la sequía espiritual: no generar culpa en quien no siente anhelo'),
 (17,'Domingo','Dios bendice la perseverancia: La constancia y la responsabilidad abren camino al progreso.','La constancia abre camino: La responsabilidad y la perseverancia suelen dar fruto.',
  'Proverbios 13:4 es un principio general; la bendición no se presenta como pago'),
 (17,'Martes','El ejercicio también forma el carácter','El dominio propio también se entrena',
  '1 Corintios 9:27 habla de dominio propio en el ministerio, no de ejercicio físico'),
 (17,'Jueves','Dios cine de fuerza al que confía en El','Dios ciñe de fuerza al que confía en Él','Error de tipeo'),
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
wb.save(path)
print(f'{len(G)} campos de guion y {len(P)} puntos corregidos')
