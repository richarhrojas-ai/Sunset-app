# Verificación de los datos curiosos de enero a marzo 2027 (semanas 1 a 13), contra sus fuentes.
# Solo se listan los que se ajustan; el resto quedó confirmado (ver content/verificacion_datos_2027.md).
# Uso: python3 tools/verificacion_datos_ene_mar_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (1,'Miércoles','Un hábito nuevo tarda una media de 66 días en volverse automático; según la persona, el rango fue de 18 a 254 días.',
  'Lally y otros, University College London, European Journal of Social Psychology, 2010','66 es la mediana, no el promedio'),
 (1,'Jueves','Con un ritmo normal de unos 70 latidos por minuto, el corazón late alrededor de 100.000 veces por día, sin que tengamos que pensar en ello.',
  'Cálculo a partir del ritmo normal en reposo (60 a 100 latidos por minuto), American Heart Association','La AHA da el ritmo por minuto; los 100.000 diarios son un cálculo'),
 (1,'Viernes','En Estados Unidos, uno de cada tres adultos no duerme las horas que necesita.',
  'Centros para el Control y la Prevención de Enfermedades (CDC) de EE. UU., 2016','El dato es de Estados Unidos'),
 (1,'Sábado','Leer antes de dormir en una tableta con pantalla iluminada, en vez de un libro impreso, retrasó la melatonina, hizo más difícil dormirse y al otro día se amaneció menos alerta.',
  'Chang y otros, Brigham and Women\'s Hospital y Harvard Medical School, revista PNAS, 2015','El estudio comparó tableta con libro impreso; no probó «cualquier pantalla»'),
 (2,'Viernes','Unos 2.700 millones de personas en el mundo no pueden pagar una alimentación saludable.',
  'FAO y otros, El estado de la seguridad alimentaria y la nutrición en el mundo (SOFI), 2026','Cifra actualizada (3.100 millones era de 2021)'),
 (3,'Lunes','Las enfermedades no transmisibles (corazón, cáncer, diabetes, pulmones) causan unas tres de cada cuatro muertes en el mundo, sin contar las de la pandemia.',
  'Organización Mundial de la Salud, nota descriptiva sobre enfermedades no transmisibles (datos de 2021)','Cifra actualizada por la OMS (43 millones de muertes en 2021)'),
 (3,'Viernes','Más de 300 millones de personas en el mundo viven con depresión.',
  'Organización Mundial de la Salud, nota descriptiva sobre la depresión','La OMS actualizó la cifra (280 millones era de 2019)'),
 (4,'Lunes','En una encuesta del ministerio Back to the Bible, quienes leían la Biblia cuatro o más días por semana contaron hábitos de vida muy distintos de los que la leían menos.',
  'Center for Bible Engagement (Back to the Bible), Cole y Ovwigho, 2009','Es una encuesta: muestra una relación, no que la lectura cause el cambio'),
 (4,'Martes','En sus experimentos de memoria, Hermann Ebbinghaus comprobó que, sin repasar, al día siguiente ya había olvidado cerca de dos tercios de lo aprendido.',
  'Hermann Ebbinghaus, «Sobre la memoria», 1885; replicado por Murre y Dros, PLOS ONE, 2015','Precisión de la cifra y de lo que midió'),
 (4,'Miércoles','Estudiantes que, en vez de releer, trataron de recordar lo leído retuvieron una semana después el 61 % del texto; los que solo releyeron, el 40 %.',
  'Roediger y Karpicke, Washington University in St. Louis, Psychological Science, 2006','Reemplazo: el estudio sobre tomar notas a mano (2014) no se confirmó en réplicas posteriores'),
 (5,'Martes','En un experimento clásico, niños que vieron a un adulto golpear a un muñeco inflable lo imitaron después casi con los mismos golpes y gritos cuando les tocó jugar con él.',
  'Bandura, Ross y Ross, Universidad de Stanford, Journal of Abnormal and Social Psychology, 1961','Los niños no estaban solos durante la prueba'),
 (5,'Miércoles','Los jóvenes en situación de riesgo que tuvieron un mentor estaban cursando estudios superiores con más frecuencia que los que no lo tuvieron: 45 % frente a 29 %.',
  'MENTOR y Civic Enterprises, The Mentoring Effect, 2014','Se aclara lo que midió la encuesta'),
 (5,'Jueves','«Se necesitan 20 años para construir una reputación y cinco minutos para arruinarla»: la frase se le atribuye a Warren Buffett.',
  'Atribuida a Warren Buffett (Quote Investigator)','No hay un texto de Buffett que la contenga: es una atribución'),
 (5,'Viernes','Al menos el 70 % de la variación en el compromiso de los equipos de trabajo se explica por el jefe que los dirige.',
  'Gallup, State of the American Manager, 2015','Redacción fiel a Gallup'),
 (5,'Sábado','La palabra «carácter» viene del griego, a través del latín, y significaba la marca grabada en una moneda o en un sello.',
  'Diccionario de la lengua española (RAE), entrada «carácter»','Fuente verificada'),
 (6,'Miércoles','Enseñar en la comunidad a lavarse las manos con agua y jabón puede reducir entre un 23 y un 40 % los casos de diarrea.',
  'Centros para el Control y la Prevención de Enfermedades (CDC) de EE. UU.','Lo que midieron fue la educación en lavado de manos'),
 (6,'Jueves','En 14 esponjas de cocina usadas se encontraron 362 tipos distintos de bacterias.',
  'Cardinale, Egert y otros, Universidad de Furtwangen y Universidad de Giessen, Scientific Reports, 2017','Se agrega la muestra y se corrige la autoría'),
 (6,'Sábado','Comer en familia con frecuencia se asocia con menos síntomas de depresión, menos conductas de riesgo y más autoestima en niños y adolescentes.',
  'Harrison y otros, Canadian Family Physician, 2015','La revisión no estudió la alimentación; se ajusta a lo que midió'),
 (7,'Viernes','Muchos inversores revisan sus cuentas con menos frecuencia cuando la bolsa baja que cuando sube; los investigadores lo llamaron «efecto avestruz».',
  'Karlsson, Loewenstein y Seppi, Journal of Risk and Uncertainty, 2009','Lo que midieron fueron inversores'),
 (7,'Sábado','La Torre de Pisa empezó a inclinarse hacia 1178, cuando la obra iba por el segundo piso: tenía un cimiento de apenas 3 metros sobre un suelo blando. Terminarla llevó casi 200 años, de 1173 a 1372.',
  'Opera della Primaziale Pisana, historia de la Torre','Lo documentado es un cimiento poco profundo sobre suelo débil'),
 (8,'Miércoles','Estudiantes que limitaron Facebook, Instagram y Snapchat a 10 minutos por día cada una, durante tres semanas, se sintieron menos solos y menos deprimidos que quienes siguieron igual.',
  'Hunt, Marx, Lipson y Young, Universidad de Pensilvania, Journal of Social and Clinical Psychology, 2018','Precisión del límite usado'),
 (8,'Viernes','Más de 300 millones de personas en el mundo viven con depresión.',
  'Organización Mundial de la Salud, nota descriptiva sobre la depresión','Cifra actualizada'),
 (8,'Sábado','Escribir sobre algo que nos dolió, 15 minutos por día durante cuatro días seguidos, se asoció con menos visitas al médico en los meses siguientes.',
  'Pennebaker y Beall, Journal of Abnormal Psychology, 1986','Precisión del tiempo y de lo que midió'),
 (9,'Miércoles','El estrés del ganado antes de la faena puede oscurecer la carne, hacerla menos tierna y que dure menos: el buen trato también se nota en el plato.',
  'Temple Grandin, Universidad Estatal de Colorado','Precisión del efecto'),
 (9,'Jueves','Paraguay vacuna contra la fiebre aftosa en dos períodos por año: en uno a todo el ganado bovino y en el otro a los animales jóvenes. La cobertura ronda el 99,7 %.',
  'Servicio Nacional de Calidad y Salud Animal (SENACSA)','El segundo período es solo para terneros y animales jóvenes'),
 (9,'Sábado','Las ovejas pueden reconocer y recordar las caras de al menos 50 ovejas distintas durante más de dos años.',
  'Kendrick y otros, Instituto Babraham, revista Nature, 2001','Lo de las caras humanas no está en este estudio'),
 (10,'Lunes','Casi la mitad de los adultos con diabetes en el mundo (más del 40 %) no sabe que la tiene.',
  'Federación Internacional de Diabetes, Atlas de la Diabetes, 2021 y 2025','Cifra válida en las dos ediciones'),
 (10,'Miércoles','En Estados Unidos se recomienda medir la presión a todos los adultos: cada año desde los 40, y cada 3 a 5 años entre los 18 y los 39 si no hay factores de riesgo y la última medición fue normal.',
  'Grupo de Trabajo de Servicios Preventivos de EE. UU. (USPSTF), 2021','Es una recomendación de Estados Unidos'),
 (10,'Viernes','En los países donde el cáncer de mama se detecta temprano y se trata a tiempo, más del 90 % de las mujeres sigue con vida cinco años después del diagnóstico; en otros lugares, la cifra baja al 40 o 66 %.',
  'Organización Mundial de la Salud, Iniciativa Mundial contra el Cáncer de Mama','La OMS lo da como comparación entre países'),
 (10,'Sábado','Las Unidades de Salud de la Familia (USF) ofrecen atención primaria sin costo en todo el país.',
  'Ministerio de Salud Pública y Bienestar Social del Paraguay','Confirmado; ajuste de redacción'),
 (11,'Jueves','El cuerpo humano tiene más de 600 músculos, que trabajan coordinados hasta en un simple paso.',
  'Cleveland Clinic, «Muscle»','Fuente concreta'),
 (11,'Sábado','La palabra griega «koinonía», que traducimos como comunión o compañerismo, significa tener algo en común y participar juntos.',
  'Léxico griego de Strong (G2842) y Thayer','Fuente concreta'),
 (12,'Martes','Moisés atendía al pueblo «desde la mañana hasta la tarde», y su suegro le advirtió que así se iba a agotar.',
  'Éxodo 18:13-18 (RVC)','La frase citada antes era de otra versión (RVR1960)'),
 (12,'Viernes','La palabra hebrea que en este proverbio se traduce como «visión» se usa para la revelación que Dios daba a sus profetas.',
  'Léxico hebreo de Strong (H2377) y Brown-Driver-Briggs','Fuente concreta'),
 (12,'Sábado','En 1954, ante el Consejo Mundial de Iglesias, Dwight Eisenhower citó a un antiguo rector: «Tengo dos clases de problemas, los urgentes y los importantes». De esa idea nació un método para ordenar tareas.',
  'Dwight D. Eisenhower, discurso en Evanston, 19 de agosto de 1954 (The American Presidency Project)','Eisenhower citaba a otro; la frase popular es una paráfrasis'),
 (13,'Martes','Justo antes de hablar a los esposos, Pablo les pide algo a todos: «Cultiven entre ustedes la mutua sumisión, en el temor de Dios».',
  'Efesios 5:21 (RVC)','Texto exacto de la RVC'),
 (13,'Miércoles','Personas que oraron cada día durante cuatro semanas por el bienestar de un amigo mostraron más disposición a perdonarlo que quienes oraron sobre otros temas o solo pensaron cosas positivas de él.',
  'Lambert, Fincham y otros, Psychological Science, 2010','El estudio de cuatro semanas fue con oración por un amigo, no por la pareja'),
 (13,'Viernes','En un estudio de la Universidad de Virginia, las parejas que compartían tiempo a solas al menos una vez por semana tenían más probabilidades de decir que su matrimonio era muy feliz.',
  'Wilcox y Dew, «The Date Night Opportunity», National Marriage Project, Universidad de Virginia, 2012','Se agregan autores y título; es una asociación'),
]

T = [  # textos de guion que dependían de un dato o de un recurso verificado
 (13,'Martes','Desarrollo 1','Pablo cierra el pasaje con dos verbos: el esposo ama a su esposa como a sí mismo, y la esposa honra a su esposo. Y antes de todo pidió algo para los dos: cultivar la mutua sumisión (5:21).'),
 (13,'Martes','Solucion 3','Si vos o alguien que conocés sufre violencia, pedí ayuda: hablá con tu pastor y llamá a la línea 137 «SOS Mujer», gratuita y las 24 horas, o escribí al WhatsApp 0961 137 137. Si hay peligro inmediato, llamá al 911.'),
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
