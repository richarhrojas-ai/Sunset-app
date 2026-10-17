# Revisión teológica de los guiones de octubre 2027 (semanas 40 a 43), con content/criterios_teologicos.md.
# Uso: python3 tools/revision_teologica_oct_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = []  # los criterios se aplicaron en el borrador; la lectura posterior no encontró frases de guion para corregir

P = [  # (semana, día de la planilla, punto anterior, punto nuevo, motivo)
 (40,'Miercoles','El trasfondo de la afrenta personal y nacional','La batalla es del Señor (17:47)',
  'El punto sale del texto y evita leer el relato como promesa de vencer a todo «gigante»'),
 (41,'Lunes','La diligencia en casa no descansa','La diligencia cuida a toda la familia',
  'Proverbios 31 es un retrato de la sabiduría, no una exigencia de no descansar para cada madre'),
 (41,'Martes','No hacerlo niega la fe','Desentenderse de los suyos contradice la fe',
  '1 Timoteo 5:8 habla de quien se desentiende, no de quien no puede proveer'),
 (41,'Viernes','No es jerarquía rígida, es humildad mutua','La humildad mutua sostiene la familia',
  'Las iglesias interpretan de distintas maneras los roles de Efesios 5:22-33; no se toma posición'),
 (42,'Lunes','La obediencia trae bendición prometida','La bendición de Dios no es un pago',
  'Malaquías 3:10 es parte del pacto con Israel; evitar la lectura de «dar para recibir más»'),
 (42,'Martes','Los graneros se llenan por confiar primero en El','Es un principio de sabiduría, no una fórmula',
  'Proverbios 3:9-10 es un principio; hay creyentes generosos que pasan escasez'),
 (42,'Miercoles','Dar activa el principio de recibir','Dar con la misma generosidad con que Dios nos trata',
  'Lucas 6:38 está en un pasaje sobre no juzgar y perdonar (6:37); no es una fórmula de prosperidad'),
 (42,'Miercoles','La generosidad no empobrece','La generosidad nace de la gracia recibida',
  'Mismo motivo; además era una afirmación absoluta'),
 (40,'Domingo','Moisés dudo de si mismo','Moisés dudó de sí mismo','Tildes'),
 (40,'Jueves','La grandeza esta en servir','La grandeza está en servir','Tilde'),
]

V = []  # sin erratas en las citas

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, campo, motivo, nuevo in G:
    fila[(s, d)][h.index(campo)].value = nuevo
t = wb['Temas Macro 2027']; ht = [c.value for c in t[1]]
for s, d, viejo, nuevo, motivo in P:
    c = t.cell(s + 1, ht.index('3 Puntos ' + d) + 1)
    if viejo in nuevo and nuevo in c.value: continue   # ya aplicado
    c.value = c.value.replace(viejo, nuevo)
for s, col, viejo, nuevo in V:
    c = t.cell(s + 1, ht.index(col) + 1)
    c.value = c.value.replace(viejo, nuevo)
wb.save(path)
print(f'{len(G)} campos de guion, {len(P)} puntos y {len(V)} citas corregidos')
