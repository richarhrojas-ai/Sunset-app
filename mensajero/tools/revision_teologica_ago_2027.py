# Revisión teológica de los guiones de agosto 2027 (semanas 31 a 34), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_ago_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (31,'Lunes','El día de reposo es mandato, no sugerencia','Dios estableció un ritmo de trabajo y descanso',
  'Las iglesias de la audiencia guardan el día de reposo de formas distintas; se toma el principio sin entrar en la discusión sobre el día'),
 (31,'Martes','El sueño tranquilo refleja fe, no solo cansancio','Dios nos cuida también en las noches difíciles',
  'Insinuaba que dormir mal es falta de fe; el insomnio puede tener causas físicas o emocionales'),
 (32,'Viernes','Creer antes de ver la respuesta','Confiar en que Dios responde según su voluntad',
  'Marcos 11:24 no es una fórmula; se lee con 1 Juan 5:14 y con la oración de Jesús en Getsemaní (14:36)'),
 (32,'Viernes','La fe activa la oración','La fe está puesta en Dios (11:22)',
  'Mismo motivo: la fe no es una fuerza que obliga a Dios'),
 (34,'Martes','• Habrá un día de juicio.\n• Dios hará justicia.\n• Vivir preparados delante de Dios.',
  '• Ser comprensivos: Conocer de verdad a la esposa.\n• Honrar: Coherederos del don de la vida.\n• Cuidar la relación: Afecta también la oración.',
  'Error de copia: los puntos eran de otro versículo; los nuevos salen de 1 Pedro 3:7'),
 (34,'Jueves',', de forma similar a como se describe en la Sociedad Bíblica a través de Bible Gateway.','.',
  'Texto pegado de una búsqueda'),
 (34,'Jueves','valor extraordinario;','valor extraordinario.','Puntuación'),
 (33,'Domingo','Cuidemos pensamientos y palabras:','Cuidemos pensamientos y palabras: Que agraden a Dios.','Punto incompleto'),
 (33,'Sabado','• • ','• ','Viñeta doble'),
 (31,'Miercoles','Jesús invito a Sus','Jesús invitó a sus','Tilde'),
 (31,'Viernes','descansar en El\n','descansar en Él\n','Tilde'),
 (31,'Viernes','Venir a El ','Venir a Él ','Tilde'),
 (34,'Viernes','Cristo perdono','Cristo perdonó','Tilde'),
]

V = [  # (semana, columna, texto anterior, texto nuevo)
 (33,'Versiculo Lunes','propia sangre.28','propia sangre.'),  # número de versículo pegado
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
    if viejo not in c.value: continue   # ya aplicado
    c.value = c.value.replace(viejo, nuevo)
for s, col, viejo, nuevo in V:
    c = t.cell(s + 1, ht.index(col) + 1)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion, {len(P)} puntos y {len(V)} citas corregidos')
