# Verificación de los datos curiosos de septiembre 2027 (semanas 35 a 39), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_sep_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (35,'Martes','En el griego, Pablo dice que el amor al dinero es raíz «de todos los males», en plural; por eso muchas versiones traducen «de toda clase de males»: no la única causa de todo mal, sino una raíz que produce muchos.',
  '1 Timoteo 6:10 (texto griego)','«Toda clase» es una traducción posible, no la letra del griego'),
 (35,'Miércoles','Justo después, Jesús cuenta la parábola del rico que planeaba construir graneros más grandes para guardar su cosecha, y Dios le dijo que esa misma noche le pedirían el alma.',
  'Lucas 12:16-21','El rico solo lo planeaba, y el texto no narra su muerte'),
 (37,'Lunes','En Paraguay, cerca de 1,85 millones de personas son socias de alguna cooperativa, según datos del Instituto Nacional de Cooperativismo (INCOOP).',
  'Instituto Nacional de Cooperativismo (INCOOP), datos difundidos en julio de 2026','Cifra más reciente; «más de un millón» se quedaba corto'),
 (37,'Sábado','La Constitución del Paraguay establece que el Estado fomentará la empresa cooperativa y otras formas asociativas.',
  'Constitución Nacional del Paraguay, 1992, artículo 113','Redacción del artículo («fomentará»)'),
 (38,'Martes','Hoy, 21 de septiembre, Paraguay celebra el Día de la Juventud, junto con la llegada de la primavera, que tradicionalmente se festeja en esta fecha.',
  'Fechas conmemorativas del Paraguay','El equinoccio de 2027 es el 23 de septiembre; la fiesta es tradicional'),
]

V = [  # texto del versículo (hoja «Temas Macro 2027»)
 (39,'Versiculo Sabado','— A todos los que recibieron','— Pero a todos los que recibieron'),  # Juan 1:12 RVC
]

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
