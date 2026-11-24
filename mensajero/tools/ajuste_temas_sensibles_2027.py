# Temas sensibles (criterio en content/criterios_teologicos.md): en vez de advertir sobre estafas, cadenas o esquemas,
# el guion anima a pedir consejo a un profesional. Pedido por Richarh el 16 oct 2026 (semanas 2 y 7; la 28 ya se escribió así).
# Uso: python3 tools/ajuste_temas_sensibles_2027.py content/planillas/Mensajero_TemasMacro_2027.xlsx
import sys, openpyxl

G = [  # (semana, día, campo, texto nuevo)
 (2,'Lunes','Problematica 1','Querer resultados sin esfuerzo y decidir sobre la plata sin pensar en el mañana.'),
 (2,'Lunes','Solucion 1','Antes de una decisión importante con tu plata, consultala con un profesional de confianza. Y anotá esta semana tres semillas concretas que sí quieras sembrar.'),
 (7,'Miércoles','Desarrollo 2','Lo que llega fácil, se va fácil. Lo que se construye con trabajo y paciencia suele durar.'),
 (7,'Miércoles','Problematica 2','Buscar atajos para hacer crecer el dinero en poco tiempo.'),
 (7,'Miércoles','Solucion 2','Si pensás en hacer crecer tus ahorros, conversalo primero con un profesional de confianza, como un contador.'),
]

path = sys.argv[1]
wb = openpyxl.load_workbook(path)
ws = wb['Guiones 2027']; h = [c.value for c in ws[1]]
fila = {(r[0].value, r[1].value): r for r in ws.iter_rows(min_row=2)}
for s, d, campo, nuevo in G:
    fila[(s, d)][h.index(campo)].value = nuevo
wb.save(path)
print(f'{len(G)} campos ajustados')
