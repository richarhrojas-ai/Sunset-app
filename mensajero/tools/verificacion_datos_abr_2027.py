# Verificación de los datos curiosos de abril 2027 (semanas 14 a 17), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_abr_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (14,'Martes','En una encuesta de Gallup en Estados Unidos, solo uno de cada tres adultos (32 %) dijo preparar cada mes un presupuesto detallado de sus ingresos y gastos.',
  'Gallup, abril de 2013','Se encuestó a adultos, no a hogares; la pregunta era sobre un presupuesto mensual'),
 (15,'Miércoles','Las águilas aprovechan las corrientes de aire caliente para subir en espiral y luego planear largos tramos casi sin aletear, ahorrando energía.',
  'Duerr y otros, PLoS ONE, 2012 (águilas reales seguidas con GPS)','Fuente concreta'),
 (16,'Martes','Según los análisis de Gallup, los equipos de trabajo más comprometidos son alrededor de un 23 % más rentables que los menos comprometidos.',
  'Gallup, State of the Global Workplace, 2023','Compara los equipos más y menos comprometidos; es una asociación'),
 (16,'Miércoles','En un estudio con más de 6.000 funcionarios públicos británicos varones, quienes sentían que en su trabajo los trataban con justicia tuvieron menos riesgo de enfermedades del corazón en los años siguientes.',
  'Kivimäki y otros, estudio Whitehall II, Archives of Internal Medicine, 2005','La muestra era solo de varones; estudio observacional'),
 (16,'Jueves','Jeremías 17 compara dos plantas: el que confía en el ser humano es como una retama en el desierto; el que confía en el Señor, como un árbol junto al agua.',
  'Jeremías 17:5-8 (RVC)','La RVC dice «retama», no «zarza»'),
 (16,'Viernes','En Paraguay, seis de cada diez personas ocupadas trabajan en la informalidad: el 60,1 % en 2025.',
  'Instituto Nacional de Estadística (INE), Ocupación Informal 2025, Encuesta Permanente de Hogares Continua','Cifra actualizada: «más de seis de cada diez» exageraba'),
 (17,'Lunes','La Organización Mundial de la Salud recomienda a los adultos entre 150 y 300 minutos por semana de actividad física moderada, o entre 75 y 150 de actividad intensa.',
  'Organización Mundial de la Salud, Directrices sobre actividad física y hábitos sedentarios, 2020','La recomendación es un rango'),
 (17,'Miércoles','Un estudio genético estimó que sumar actividad equivalente a 15 minutos de correr o una hora de caminata rápida por día, en lugar de estar sentado, se asocia con un 26 % menos de probabilidad de depresión.',
  'Choi y otros, JAMA Psychiatry, 2019','Precisión del tipo de estudio y de lo que midió'),
 (17,'Jueves','Adultos que, medidos con un sensor de movimiento, sumaban al menos 150 minutos semanales de actividad física tuvieron un 65 % menos de probabilidad de sentirse muy somnolientos durante el día.',
  'Loprinzi y Cardinal, Mental Health and Physical Activity, 2011','El 65 % se refiere a la somnolencia diurna, no a «dormir mucho mejor»'),
 (17,'Sábado','Para niños y adolescentes de 5 a 17 años, la recomendación es de al menos 60 minutos por día, en promedio, de actividad física moderada a intensa.',
  'Organización Mundial de la Salud, Directrices sobre actividad física, 2020','Se agregan la edad y la intensidad'),
]
T = [
 (16,'Jueves','Desarrollo 1','Jeremías contrasta al que confía en el ser humano con el que confía en el Señor: uno es como una retama en el desierto; el otro, como un árbol plantado junto al agua (17:5-8).'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, dato, fuente, motivo in A:
    fila[(s, d)][h.index('Dato curioso')].value = dato
    fila[(s, d)][h.index('Fuente dato')].value = fuente
for s, d, campo, nuevo in T:
    fila[(s, d)][h.index(campo)].value = nuevo
wb.save(path)
print(f'{len(A)} datos ajustados y {len(T)} textos de guion')
