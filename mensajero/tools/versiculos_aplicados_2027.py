# Cambios de versículo aprobados por Richarh (ver content/versiculos_sugeridos.md).
# Uso: python3 tools/versiculos_aplicados_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

V = [  # (semana, columna, texto nuevo completo, motivo)
 (10, 'Versiculo Viernes', 'Proverbios 12:15 — El necio piensa que va por buen camino, pero el sabio presta atención al consejo.',
  'Error de copia: estaba cargado el texto de Proverbios 22:15 (aprobado el 16 oct 2026)'),
 (14, 'Versiculo Martes', 'Proverbios 21:5 — Si piensas lo que haces, tendrás abundancia; si te apresuras, acabarás en la pobreza.',
  'Error de copia: estaba cargado el texto de Proverbios 21:15 (aprobado el 16 oct 2026)'),
 (36, 'Versiculo Lunes', 'Proverbios 25:28 — Ciudad en ruinas, sin muralla protectora: ¡eso es el hombre que no frena sus impulsos!',
  'Error de copia: estaba cargado el texto de Proverbios 15:28 (aprobado el 17 oct 2026)'),
 (36, 'Versiculo Miercoles', 'Proverbios 12:24 — Los diligentes dominan a otros; los negligentes son dominados.',
  'Error de copia: estaba cargado el texto de Proverbios 12:22 (aprobado el 17 oct 2026)'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
t = wb['Temas Macro 2027']; h = [c.value for c in t[1]]
for s, col, nuevo, motivo in V:
    t.cell(s + 1, h.index(col) + 1).value = nuevo
wb.save(path)
print(len(V), 'versículos aplicados')
