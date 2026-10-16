# Revisión teológica de los guiones de marzo 2027 (semanas 9 a 13), con content/criterios_teologicos.md.
# Cada cambio indica qué se corrige y por qué. Uso:
# python3 tools/revision_teologica_mar_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = [  # (semana, día, campo, motivo, texto nuevo)
 (9,'Viernes','Desarrollo 3','La entrega de Cristo es única (redención); el paso a la cadena de trabajo se dice como inspiración, no como imitación',
  'La entrega de Jesús también inspira el trabajo de cada día. Detrás de cada comida hay una cadena de personas que se dedican: el que cría, el que transporta, el que vende. Cada eslabón, hecho con dedicación, es una forma de servir.'),
 (10,'Viernes','Desarrollo 2','No llamar «necio» a quien duda o tiene miedo: se describe la conducta sin culpar a la persona',
  'Escuchar el consejo de quien sabe, como un profesional de la salud, es una forma concreta de sabiduría. Postergarlo por miedo o por orgullo suele salir caro.'),
]

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (9,'Jueves','La diligencia trae prosperidad visible','La bendición de Dios acompañó el trabajo fiel',
  'Génesis 30 es una narración: el texto atribuye la bendición al Señor (30:30), no promete prosperidad a la diligencia'),
 (9,'Martes','El modelo de Dios enseña como cuidar','El modelo de Dios enseña cómo cuidar','Tilde'),
 (10,'Jueves','El uso de remedios naturales aparece en la Escritura','Dios usó un remedio de su tiempo',
  'Evitar que se lea como aval de remedios caseros en lugar del tratamiento médico'),
 (10,'Viernes','Rechazar el consejo médico es necedad','Rechazar un buen consejo sale caro',
  'No etiquetar de «necio» a quien duda o tiene miedo; mismo sentido, sin culpa'),
 (12,'Viernes','La visión da orden y propósito','La Palabra de Dios da orden y propósito',
  'En Proverbios 29:18 «visión» es la revelación de Dios, no la visión de una organización'),
 (13,'Martes','El respeto es el lenguaje de la esposa','La esposa honra a su esposo',
  'El texto dice «honren»; «el lenguaje de la esposa» es una generalización de autoayuda'),
 (13,'Martes','No hay jerarquía de valor, si de función','Igual valor y respeto mutuo',
  'Las iglesias explican los roles de distintas maneras; se queda en lo que todas comparten (Efesios 5:21; 1 Pedro 3:7)'),
]

V = [  # tildes en el texto del versículo (sin cambiar su contenido)
 (9,'Martes','El Senor es mi pastor','El Señor es mi pastor'),
 (9,'Miercoles','pero los impios son crueles de corazon','pero los impíos son crueles de corazón'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, campo, motivo, nuevo in G:
    fila[(s, d)][h.index(campo)].value = nuevo
t = wb['Temas Macro 2027']; ht = [c.value for c in t[1]]
for s, d, viejo, nuevo, motivo in P:
    c = t.cell(s + 1, ht.index('3 Puntos ' + d.replace('é', 'e').replace('á', 'a')) + 1)
    assert viejo in c.value, (s, d, c.value)
    c.value = c.value.replace(viejo, nuevo)
for s, d, viejo, nuevo in V:
    c = t.cell(s + 1, ht.index('Versiculo ' + d) + 1)
    assert viejo in c.value, (s, d, c.value)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion, {len(P)} puntos y {len(V)} versículos corregidos')
