# Verificación de los datos curiosos de diciembre 2027 (semanas 48 a 52), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_dic_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (48,'Miércoles','Cuando llevaron el arca del pacto a Jerusalén, David les encargó a Asaf y a sus hermanos que cantaran este salmo de alabanza al Señor.',
  '1 Crónicas 16:1-7','El texto dice que David lo encargó a Asaf, no que él lo cantara'),
 (49,'Martes','En tiempos bíblicos, quien se endeudaba podía dejar su manto en prenda; la ley pedía devolverlo antes de que se pusiera el sol, porque era su abrigo para dormir.',
  'Éxodo 22:26-27; Deuteronomio 24:12-13','Proverbios 22:27 habla de la cama, no del manto'),
 (50,'Miércoles','La palabra griega que en este versículo se traduce «resistencia» (hypomoné) se forma con «debajo» y «permanecer»: quedarse firme bajo la carga, sin abandonar.',
  'Romanos 5:3; léxico griego de Strong (G5281, hypomoné)','Es la formación de la palabra, no una definición literal'),
 (51,'Viernes','El Banco Central del Paraguay pide desconfiar de cualquier llamada o mensaje que solicite claves, PIN, token o códigos de verificación, y no compartirlos nunca, aunque quien llama diga ser del banco.',
  'Banco Central del Paraguay, campaña «Seguridad Financiera Digital», 2026','Se cita lo que dice el BCP'),
 (51,'Sábado','Hoy celebramos el nacimiento de Jesús: el ángel les dio a los pastores una buena noticia, motivo de mucha alegría para todo el pueblo.',
  'Lucas 2:10-11','Redacción de la RVC («mucha alegría»)'),
 (52,'Miércoles','Lucas era médico, y la tradición cristiana lo reconoce como autor del evangelio que lleva su nombre y del libro de los Hechos.',
  'Colosenses 4:14; Lucas 1:1-4; Hechos 1:1','La autoría es atribución tradicional'),
]

V = []

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
