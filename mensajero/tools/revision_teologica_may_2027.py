# Revisión teológica de los guiones de mayo 2027 (semanas 18 a 21), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_may_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = [  # (semana, día, campo, motivo, texto nuevo)
 (20,'Miércoles','Desarrollo 3','El desarrollo se había apartado del punto del versículo (la alegría de corregir con amor)',
  'Corregir con amor trae alegría a la casa. Y los hijos también tienen su parte: honrar y aportar según su edad; darles responsabilidades los hace parte activa de la familia.'),
 (20,'Viernes','Desarrollo 2','El desarrollo se había apartado del punto del versículo (la alegría por el testimonio de los hijos)',
  'La alegría de ver a los hijos firmes en la fe también pasa por la disciplina: formar el carácter, no castigar. Disciplinar es corregir con propósito.'),
 (21,'Jueves','Desarrollo 3','Se une el punto del versículo (fidelidad en la base) con la aplicación',
  'Ser fiel en la base es poner primero lo primario: las necesidades, las deudas y lo que vamos a dar. Lo secundario, después.'),
]

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (19,'Jueves','Todo es posible con ese respaldo','Contento en la abundancia y en la escasez',
  'Filipenses 4:13 habla de la fuerza de Cristo para vivir contento en toda situación (4:11-12), no de lograr cualquier meta'),
 (19,'Jueves','No hay desafío que anule esa fuerza','Su fuerza sostiene también en la derrota',
  'Mismo motivo: no presentar el versículo como garantía de éxito'),
 (19,'Sabado','Todo ayuda a bien para quien ama a Dios','Dios obra en todo para el bien de los que lo aman',
  'Romanos 8:28 no dice que todo sea bueno; se acerca a la redacción del texto'),
 (20,'Lunes','No se aparta cuando envejece','La formación deja huella para toda la vida',
  'Proverbios 22:6 es un principio, no una garantía; no culpar a los padres cuyos hijos se alejaron'),
 (21,'Lunes','El trabajo es condición para el sustento','Quien puede trabajar, que trabaje',
  '2 Tesalonicenses 3:10 es para el que no quiere trabajar, no para el que no puede'),
 (21,'Martes','La diligencia enriquece','La diligencia abre caminos',
  'Proverbios 10:4 es un principio; no toda pobreza es pereza'),
 (21,'Sabado','El alma generosa prospera','La generosidad enriquece la vida',
  'Evitar la lectura de «dar para recibir más plata»'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, campo, motivo, nuevo in G:
    fila[(s, d)][h.index(campo)].value = nuevo
t = wb['Temas Macro 2027']; ht = [c.value for c in t[1]]
for s, d, viejo, nuevo, motivo in P:
    c = t.cell(s + 1, ht.index('3 Puntos ' + d) + 1)
    if nuevo in c.value: continue   # ya aplicado
    assert viejo in c.value, (s, d, c.value)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion y {len(P)} puntos corregidos')
