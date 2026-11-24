# Verificación de los datos curiosos de julio 2027 (semanas 27 a 30), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_jul_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (28,'Jueves','Warren Buffett compró sus primeras acciones a los 11 años. Cuando bajaron, se asustó y las vendió con una ganancia mínima, y después subieron muchísimo. Aprendió a no apurarse por una ganancia chica.',
  'Alice Schroeder, La bola de nieve: Warren Buffett y el negocio de la vida, 2008','Las vendió con una pequeña ganancia, no a precio de costo; título en español completo'),
 (29,'Lunes','Pablo escribió la carta a los Filipenses estando preso, y aun así habla de seguir avanzando hacia la meta.',
  'Filipenses 1:13; 3:13-14','Se suma a la fuente el pasaje de la meta'),
 (29,'Miércoles','Una revisión de 94 pruebas, con más de 8.000 participantes, encontró que decidir de antemano cuándo, dónde y cómo se va a dar un paso aumenta bastante la probabilidad de cumplir una meta.',
  'Gollwitzer y Sheeran, Advances in Experimental Social Psychology, 2006','Son 94 pruebas tomadas de 63 informes; efecto medio a grande'),
 (30,'Miércoles','Según el Ministerio de Industria y Comercio, cerca del 97 % de las empresas del Paraguay son micro, pequeñas o medianas, y la gran mayoría son microempresas.',
  'Ministerio de Industria y Comercio, Viceministerio de MIPYMES (datos del DIRGE 2019)','Se agrega la cifra oficial'),
 (30,'Jueves','Un estudio en un barrio de Chicago encontró que, de cada 100 dólares gastados en comercios locales, unos 68 seguían circulando en la economía de la ciudad, frente a 43 en las cadenas.',
  'Civic Economics, Andersonville Study of Retail Economics, 2004','El impacto se midió en la economía de Chicago, no solo del barrio'),
 (30,'Sábado','Itauguá es conocida como la «ciudad del ñandutí», y allí se realiza desde 1970 el Festival Nacional del Ñandutí; la primera edición fue en julio.',
  'Agencia de Información Paraguaya (IP), Festival Nacional del Ñandutí','Se llama Festival Nacional; las ediciones recientes cambiaron de fecha'),
]

V = [  # texto del versículo (hoja «Temas Macro 2027»)
 (30,'Versiculo Jueves','debe despreciar la mentira','debe desechar la mentira'),  # Efesios 4:25 RVC
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
