# Verificación de los datos curiosos de octubre 2027 (semanas 40 a 43), contra sus fuentes.
# Uso: python3 tools/verificacion_datos_oct_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

A = [  # (semana, día, dato nuevo, fuente nueva, motivo)
 (41,'Miércoles','Según la Organización Internacional del Trabajo, las mujeres realizan en el mundo el 76,2 % del trabajo de cuidado no remunerado: unas tres cuartas partes.',
  'Organización Internacional del Trabajo, El trabajo de cuidados y los trabajadores del cuidado para un futuro con trabajo decente, 2018','Cifra exacta y título completo'),
 (41,'Jueves','Un estudio con parejas encontró que sentir gratitud por los pequeños gestos del otro se asociaba, al día siguiente, con una relación más conectada y satisfactoria para los dos.',
  'Algoe, Gable y Maisel, Personal Relationships, 2010','Se midió la gratitud sentida por los gestos del otro, no la expresada'),
 (42,'Lunes','En la ley de Moisés, cada tres años el diezmo de la cosecha se guardaba en cada ciudad para los levitas, los extranjeros, los huérfanos y las viudas.',
  'Deuteronomio 14:28-29','Es el diezmo del tercer año'),
 (42,'Miércoles','La imagen viene de la medición del grano: se apretaba y se sacudía para que la medida quedara llena hasta rebalsar, y se volcaba en el pliegue del manto de quien la recibía.',
  'Lucas 6:38; comentarios bíblicos','El texto no habla de un vendedor; se describe la medición del grano'),
 (43,'Martes','Pablo usa tres imágenes seguidas: la de un atleta que lucha en una competencia, la de un corredor que llega a la meta y la de alguien que cuida fielmente lo que se le confió.',
  '2 Timoteo 4:7 (texto griego)','«Batalla» traduce agón, la competencia atlética, no la guerra'),
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
