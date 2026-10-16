# Revisión teológica de los guiones de enero y febrero 2027 (semanas 1 a 8).
# Cada cambio indica qué se corrige y por qué; el texto anterior debe coincidir para aplicarse.
# Uso: python3 tools/revision_teologica_ene_feb_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = [  # (semana, día, campo, motivo, texto nuevo)
 (1,'Lunes','Desarrollo 1','Romanos 12:1: «cuerpo» es todo el ser y la ofrenda responde a la misericordia de Dios (gracia, no mérito)',
  'Pablo pide presentar todo nuestro ser, cuerpo incluido, como respuesta a la misericordia de Dios: no para ganar su amor, sino porque ya lo recibimos. Cuidar el cuerpo es parte de esa ofrenda, para amar, trabajar y servir mejor.'),
 (1,'Martes','Desarrollo 1','3 Juan 1:2 es el saludo de Juan a Gayo, no una promesa de prosperidad',
  'Juan le escribe a su amigo Gayo y le desea salud y que todo le vaya bien. Es un saludo de cariño, no una promesa de que al creyente nunca le faltarán salud ni dinero. Nos enseña que desear el bien del otro incluye su cuerpo.'),
 (1,'Viernes','Desarrollo 1','Génesis 2:2: Dios no reposa por cansancio (Isaías 40:28); evitar el antropomorfismo',
  'Dios no se cansa (Isaías 40:28): su reposo fue terminar la obra y bendecirla, y nos dejó ese ritmo como regalo (Éxodo 20:11). Descansar no es pereza: es parte de una vida bien ordenada.'),
 (2,'Lunes','Desarrollo 1','Gálatas 6:7 en su contexto: sembrar para la carne o para el Espíritu (6:8)',
  'Pablo habla de sembrar para la carne o para el Espíritu (Gálatas 6:8): nuestras decisiones tienen consecuencias. Lo que hacemos hoy con el tiempo, las palabras y el dinero es la semilla de mañana.'),
 (2,'Lunes','Desarrollo 2','Evitar la retribución automática: no toda dificultad es castigo (Juan 9:3)',
  'La siembra y la cosecha valen en la familia, en la salud y en la fe. Pero no es una cuenta automática: no toda dificultad es castigo por algo que hicimos (Juan 9:3). Los valores son la mejor semilla.'),
 (2,'Lunes','Desarrollo 3','El punto se apoya en el texto («Dios no puede ser burlado»), no en técnicas agrícolas',
  '«Dios no puede ser burlado»: podemos engañar a otros por un tiempo, pero no a Dios. Lo que se hace mal para ganar tiempo, sobre todo si daña al prójimo, vuelve como pérdida.'),
 (2,'Martes','Desarrollo 1','Marcos 4:26-27 habla del reino de Dios, que crece por el poder de Dios',
  'Jesús habla del reino de Dios: crece por el poder de Dios, aunque no lo veamos. De esa paciencia aprendemos también en otros procesos que no se pueden apurar: la confianza, el carácter, un proyecto.'),
 (2,'Martes','Desarrollo 3','En la parábola el crecimiento lo da Dios; evitar el activismo que el texto no dice',
  'En la parábola el sembrador duerme y la semilla igual crece: el crecimiento lo da Dios. Eso no nos vuelve pasivos (él siembra y cosecha), pero nos libra de la ansiedad de controlarlo todo.'),
 (2,'Miércoles','Desarrollo 3','«Dios bendice el trabajo, no la improvisación» condicionaba la gracia; se corrige',
  'Dios da el crecimiento y nos llama a trabajar con orden y responsabilidad. El esfuerzo ordenado es buena mayordomía de lo que Él provee.'),
 (2,'Jueves','Desarrollo 1','Santiago 5:7: la paciencia es hasta la venida del Señor, en medio de injusticias (5:1-6)',
  'Santiago anima a esperar con paciencia la venida del Señor, en medio de injusticias (5:1-6), y pone como ejemplo al labrador. Esperar con paciencia no es resignarse: es seguir firmes y prepararse para lo que no controlamos.'),
 # 2 Corintios 9:6 habla de la ofrenda generosa (9:1-15), no del cuidado del suelo: el día se reescribe
 (2,'Viernes','Dato curioso','El dato se alinea con la generosidad del texto',
  'Unos 3.100 millones de personas en el mundo no pueden pagar una alimentación saludable.'),
 (2,'Viernes','Fuente dato','', 'FAO, El estado de la seguridad alimentaria y la nutrición en el mundo, 2023'),
 (2,'Viernes','Desarrollo 1','2 Corintios 9:6 en su contexto: la ofrenda para hermanos necesitados; la cosecha no es ganancia asegurada (9:10-11)',
  'Pablo habla de la ofrenda para hermanos necesitados: dar con generosidad es sembrar. La cosecha no es una ganancia asegurada, sino frutos de justicia y gratitud a Dios (2 Corintios 9:10-11).'),
 (2,'Viernes','Problematica 1','', 'La idea de «dar para recibir más plata», que convierte la generosidad en un negocio.'),
 (2,'Viernes','Solucion 1','', 'Esta semana ayudá a alguien que lo necesita, sin esperar nada a cambio.'),
 (2,'Viernes','Desarrollo 2','', 'El que guarda todo por miedo se pierde la alegría de compartir y de ver a Dios obrar a través de lo que da. Sembrar también es pensar en los que vienen detrás.'),
 (2,'Viernes','Problematica 2','', 'Vecinos y productores que no se ayudan en los tiempos difíciles, cuando una mano a tiempo cambia todo.'),
 (2,'Viernes','Solucion 2','', 'Si tu cosecha o tu trabajo rindió, compartí una parte con una familia que pasa necesidad.'),
 (2,'Viernes','Desarrollo 3','', 'Pablo agrega que cada uno dé lo que decidió en su corazón, no con tristeza ni por obligación, porque Dios ama al que da con alegría (9:7).'),
 (2,'Viernes','Problematica 3','', 'Dar por presión, por quedar bien o por culpa.'),
 (2,'Viernes','Solucion 3','', 'Antes de dar, orá y decidí en tu corazón cuánto y a quién. Después, dalo con alegría.'),
 (3,'Lunes','Desarrollo 2','Éxodo 15:26 es una promesa del pacto con Israel; la enfermedad no es señal de pecado (Juan 9:3)',
  'Esta promesa fue parte del pacto de Dios con Israel en el desierto, y muchas de sus leyes cuidaban la salud del pueblo. No significa que quien se enferma está en pecado: Jesús lo aclaró (Juan 9:3). Sí nos enseña que escuchar instrucciones sabias protege.'),
 (3,'Martes','Desarrollo 1','«Temor del Señor» es reverencia y confianza, no miedo',
  'El temor del Señor no es miedo: es reverencia y confianza. Y esa confianza saca el miedo: prevenir no es vivir con paranoia, es cuidarse con tranquilidad.'),
 (3,'Miércoles','Desarrollo 1','Proverbios 4:20-22 habla de las palabras de sabiduría, no de las señales del cuerpo; se hace explícito el puente',
  'El padre de Proverbios pide atención a sus palabras de sabiduría: son vida y salud. Esa sabiduría también nos hace atentos con el cuerpo, como escuchar sus señales a tiempo: muchas enfermedades no duelen al principio.'),
 (3,'Miércoles','Desarrollo 2','No equiparar la Palabra con el consejo médico',
  'La sabiduría se recibe escuchando. Dios nos habla en su Palabra y además pone a nuestro lado personas que saben, como los profesionales de salud, para orientarnos.'),
 (4,'Martes','Desarrollo 3','Josué 1:8: prosperar es cumplir la misión de Dios, no una promesa de riqueza',
  'En Josué, prosperar es cumplir con éxito la misión que Dios le dio, guiado por su Palabra. No es una promesa de riqueza: es la bendición de andar en su camino, que se ve en integridad, paz y fruto, y se construye con constancia diaria.'),
 (5,'Sábado','Desarrollo 3','Evitar el moralismo: el carácter es obra de Dios en nosotros (Filipenses 2:13)',
  'Quién sos cuando nadie mira es quien realmente sos. Dios forma ese carácter en nosotros cuando le abrimos el corazón (Filipenses 2:13).'),
 (6,'Martes','Desarrollo 2','Generalización apresurada que podía culpar a quien vive con pobreza, enfermedad o depresión',
  'A veces el desorden de afuera refleja cansancio o cargas de adentro. No hace falta lujo ni perfección: hace falta cuidado, de a poco.'),
 (6,'Viernes','Desarrollo 3','Mateo 7:24: la roca es oír y hacer las palabras de Jesús; la familia no se pone al lado de Dios como fundamento',
  'Lo que va primero sostiene todo lo demás. Si Dios va primero, la familia, el trabajo y las cosas encuentran su lugar.'),
 (7,'Lunes','Desarrollo 3','Equilibrio con Mateo 6 y Lucas 12: prepararse no es acumular por miedo o avaricia',
  'Ahorrar no es desconfiar de Dios: es usar la sabiduría que Él puso en la creación. La diferencia está en el corazón: prepararse con confianza no es lo mismo que acumular por miedo o avaricia (Lucas 12:15-21).'),
 (7,'Martes','Desarrollo 2','La seguridad de fondo está en Dios, no en el ahorro',
  'El ahorro es el puente entre los años buenos y los malos. Lo que guardás hoy puede aliviar el mañana, aunque nuestra seguridad de fondo está en Dios, no en la cuenta.'),
 (7,'Jueves','Desarrollo 1','Eclesiastés 11:1-2 tiene dos lecturas (generosidad o reparto); no presentar una sola como segura',
  'Este consejo se lee de dos maneras: muchos lo entienden como un llamado a compartir con varios, y otros como repartir lo que uno tiene. Las dos coinciden en algo: no aferrarse a una sola seguridad, porque no sabemos qué puede pasar.'),
 (7,'Sábado','Solucion 1','Lucas 14:28 habla del costo de seguir a Jesús; se menciona su contexto',
  'Jesús usó esta imagen para hablar del costo de seguirlo, y la plata también es parte de ese camino. Esta semana abrí un sobre o una cuenta de ahorro y poné tu primer aporte, aunque sea pequeño.'),
 (8,'Lunes','Desarrollo 1','Mateo 5:37 habla de los juramentos y la palabra verdadera; se hace explícito el puente a las emociones',
  'Jesús habla de los juramentos: no hace falta jurar si nuestra palabra es verdadera. Un «sí» que es sí y un «no» que es no. Esa honestidad incluye no fingir lo que sentimos.'),
 (8,'Martes','Desarrollo 1','Romanos 12:2: «transfórmense» es obra de Dios, no solo técnica mental',
  'Pablo dice «transfórmense»: es Dios quien transforma, mientras nosotros renovamos la mente con su Palabra. Lo que pensamos una y otra vez va formando lo que sentimos.'),
 (8,'Miércoles','Desarrollo 1','Amor de Dios completo: acepta y transforma',
  'Entre tantas voces que escuchamos cada día, hay una verdad que debería sonar más fuerte: Dios te ama tal como sos, y por amor no te deja como estás.'),
 (8,'Miércoles','Desarrollo 3','El punto central de Juan 3:16 (vida eterna por creer en Jesús) no puede quedar desplazado',
  'El regalo es vida eterna para todo el que cree en Jesús. Esa fe se alimenta de lo que escuchamos: si lo que más oímos es miedo y queja, nos olvidamos de la esperanza que tenemos.'),
 (8,'Jueves','Desarrollo 1','2 Timoteo 1:7 en su contexto: no avergonzarse del testimonio (1:8)',
  'Pablo anima a Timoteo a no avergonzarse de dar testimonio: Dios no nos dio un espíritu de cobardía. Mucho del miedo que nos paraliza entra por lo que consumimos.'),
 (8,'Jueves','Solucion 3','La ansiedad no es falta de fe: se suma la invitación a pedir ayuda',
  'Cuando aparezca el miedo, ponele nombre, respirá hondo tres veces y decí: «Dios no me dio un espíritu de cobardía». Si la ansiedad no se va, pedí ayuda: no es falta de fe.'),
]

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (1,'Martes','Dios desea prosperidad y salud','Juan desea a su hermano bienestar y salud','3 Juan 1:2 es un saludo, no una promesa de prosperidad'),
 (2,'Lunes','No hay atajos en el trabajo de la tierra','Dios no puede ser burlado','El punto sale del texto de Gálatas 6:7'),
 (4,'Martes','Trae éxito verdadero y prosperidad','El verdadero éxito es andar en el camino de Dios','Josué 1:8 no promete riqueza'),
 (8,'Jueves','El temor no viene de Dios','La cobardía no viene de Dios','El texto dice «cobardía»; el «temor del Señor» es bueno (semana 3)'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, campo, motivo, nuevo in G:
    c = fila[(s, d)][h.index(campo)]
    c.value = nuevo
t = wb['Temas Macro 2027']; ht = [c.value for c in t[1]]
for s, d, viejo, nuevo, motivo in P:
    c = t.cell(s + 1, ht.index('3 Puntos ' + d.replace('é', 'e').replace('á', 'a')) + 1)
    assert viejo in c.value, (s, d, c.value)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion y {len(P)} puntos corregidos')
