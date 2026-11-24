# Verificación de los datos curiosos de mayo 2027 (semanas 18 a 21), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_may_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (18,'Miércoles','En tiempos de Jesús, lavar los pies de otra persona se consideraba una tarea de sirvientes: lo normal era que el anfitrión ofreciera agua o que lo hiciera un siervo de la casa.',
  'Juan 13:4-5; Lucas 7:44; 1 Samuel 25:41','Las fuentes no coinciden en si lo hacía siempre un sirviente'),
 (18,'Jueves','Se estima que unos 862 millones de personas de 15 años o más hacen algún tipo de voluntariado cada mes en el mundo.',
  'Voluntarios de las Naciones Unidas (VNU), Informe sobre el estado del voluntariado en el mundo, 2022','«De 15 años o más», como dice el informe'),
 (18,'Viernes','El psicólogo Mihaly Csikszentmihalyi llamó «flujo» al estado en que estamos tan metidos en una tarea que el tiempo se pasa volando.',
  'Mihaly Csikszentmihalyi, «Flow», 1990 (en español, «Fluir», 1997)','Año del libro original y de la edición en español'),
 (19,'Lunes','Las experiencias negativas suelen impactarnos más que las positivas: por ejemplo, una crítica suele pesar más que un elogio.',
  'Baumeister, Bratslavsky, Finkenauer y Vohs, «Bad is stronger than good», Review of General Psychology, 2001','La revisión no da una proporción de elogios por crítica'),
 (19,'Martes','En la sabana abierta, el rugido de un león puede oírse hasta a unos 8 kilómetros de distancia.',
  'IFAW (Fondo Internacional para el Bienestar Animal)','Fuente concreta y condiciones'),
 (19,'Miércoles','En un estudio en un hospital, los equipos de enfermería con mejor liderazgo registraban más errores de medicación; según la autora, no se equivocaban más, sino que se animaban a reportarlos.',
  'Amy Edmondson, Journal of Applied Behavioral Science, 1996','La explicación es la interpretación de la autora'),
 (19,'Viernes','Dormir seis horas por noche durante dos semanas afectó la atención casi tanto como pasar una noche entera sin dormir, y los participantes apenas se sentían más somnolientos.',
  'Van Dongen y otros, revista Sleep, 2003','Con seis horas, el efecto equivale a una noche sin dormir, no a dos'),
 (21,'Martes','En Paraguay, alrededor de 16 de cada 100 personas viven en situación de pobreza.',
  'Instituto Nacional de Estadística (INE), Encuesta Permanente de Hogares Continua 2025','Cifra actualizada: 16 % en 2025 (20,1 % era de 2024)'),
 (21,'Miércoles','Muchas personas subestiman cuánto crece el dinero con intereses compuestos, tanto una deuda como un ahorro; los economistas lo llaman «sesgo del crecimiento exponencial».',
  'Stango y Zinman, Journal of Finance, 2009','El estudio no se limita a deudas'),
 (21,'Jueves','Las palabras de Jesús sobre ser fiel en lo poco vienen justo después de la parábola del administrador infiel.',
  'Lucas 16:1-9 y 16:10-13','Se precisan las palabras y las referencias'),
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
