# Verificación de los datos curiosos de junio 2027 (semanas 22 a 26), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_jun_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (22,'Sábado','En un estudio de Sun Microsystems, los empleados que recibieron mentoría fueron ascendidos cinco veces más que los que no la tuvieron, y los mentores, seis veces más.',
  'Gartner, análisis del programa de mentoría de Sun Microsystems, 2006','Cifras exactas; es una asociación'),
 (23,'Lunes','En 2024, casi la mitad (47 %) de los adultos que veían buenas oportunidades para emprender dijo que el miedo a fracasar le impediría hacerlo.',
  'Global Entrepreneurship Monitor (GEM), Informe mundial 2024/2025','Cifra y año exactos'),
 (23,'Martes','Al final del libro de Job, Dios les dice a los amigos de Job que no hablaron de Él con rectitud, como sí lo hizo su siervo Job.',
  'Job 42:7 (RVC)','Redacción de la RVC («con rectitud»)'),
 (23,'Sábado','Jesús dijo estas palabras al día siguiente de multiplicar los panes para unos cinco mil hombres, sin contar a las mujeres y a los niños.',
  'Juan 6:10, 22-27; Mateo 14:21','El texto cuenta «hombres»'),
 (24,'Jueves','Una revisión de 24 estudios encontró que comer distraídos, por ejemplo frente a una pantalla, se asoció con comer más en esa comida y aún más en la siguiente.',
  'Robinson y otros, American Journal of Clinical Nutrition, 2013','Es una revisión de distracciones en general'),
 (24,'Viernes','La mandioca, tan presente en la mesa paraguaya, es la tercera fuente más importante de calorías en las regiones tropicales del mundo, después del arroz y el maíz.',
  'Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO)','Dato concreto de la FAO'),
 (25,'Martes','Antes de los espejos de vidrio, la gente se miraba en el agua quieta, en piedra volcánica pulida o en láminas de metal pulido, como cobre o bronce.',
  'Encyclopaedia Britannica, «Mirror»','Fuente concreta'),
 (25,'Miércoles','En el Nuevo Testamento, la palabra «discípulo» aparece más de 250 veces, y solo en los evangelios y en Hechos.',
  'Mounce, Greek Dictionary (Strong G3101, mathetés)','No aparece en las cartas: «solo», no «casi siempre»'),
 (25,'Jueves','En el vestíbulo de la sede de la CIA, en Estados Unidos, está grabado «conocerán la verdad, y la verdad los hará libres», pero sin la condición del versículo anterior: «si permanecen en mi palabra».',
  'Agencia Central de Inteligencia (CIA), «Bible Quote Carving»','Lo que falta es el versículo 31, no parte del 32'),
 (25,'Viernes','Filipos es considerada la primera ciudad de Europa donde Pablo fundó una iglesia: allí creyó Lidia, y los creyentes se reunían en su casa.',
  'Hechos 16:11-15, 40','Precisión de la cita'),
 (26,'Viernes','En un experimento con estudiantes, cuando las correcciones venían con la nota «te hago estos comentarios porque tengo altas expectativas y sé que podés alcanzarlas», muchos más decidieron corregir y mejorar su trabajo.',
  'Yeager y otros, Journal of Experimental Psychology: General, 2014','Lo medido fue cuántos corrigieron su trabajo'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, dato, fuente, motivo in A:
    fila[(s, d)][h.index('Dato curioso')].value = dato
    fila[(s, d)][h.index('Fuente dato')].value = fuente
wb.save(path)
print(f'{len(A)} datos ajustados')
