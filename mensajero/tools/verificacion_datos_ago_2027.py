# Verificación de los datos curiosos de agosto 2027 (semanas 31 a 34), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_ago_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (32,'Martes','La palabra griega que Mateo usa para «habitación» designaba el cuarto interior o la despensa de la casa, a veces el único lugar con puerta.',
  'Mateo 6:6; léxico griego de Strong (G5009, tameíon)','Jesús probablemente hablaba en arameo; la palabra griega es la del evangelista'),
 (32,'Viernes','Jesús dijo estas palabras camino a Jerusalén, en su última semana; pocos días después, en Getsemaní, pidió que se hiciera la voluntad del Padre y no la suya.',
  'Marcos 11:20-24; 14:36','Fue en el camino desde Betania, antes de volver a Jerusalén (11:27)'),
 (32,'Sábado','Después de este versículo, Jesús cuenta la parábola de una viuda que insistió ante un juez injusto; si ese juez le hizo justicia, cuánto más Dios a sus escogidos que claman a él día y noche.',
  'Lucas 18:1-8','El texto dice «sus escogidos» (18:7)'),
 (34,'Viernes','El investigador de parejas John Gottman señaló el desprecio como uno de los signos que más anticipan una ruptura.',
  'John Gottman, Why Marriages Succeed or Fail, 1994','«¿Qué hace que el amor perdure?» es otro libro; se deja el título original'),
]

V = [  # texto del versículo (hoja «Temas Macro 2027»)
 (33,'Versiculo Lunes','y que cuiden el rebaño','y que velen por el rebaño'),  # Hechos 20:28 RVC
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
