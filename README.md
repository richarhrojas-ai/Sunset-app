# Sunset App

Dashboard semanal del Sistema Sunset (Richarh Rojas).

## Estructura

```
index.html                    App Sunset 2027
css/app.css                   Estilos
js/app.js                     Lógica (rotación, autoevaluación, tablero, respaldo)
data/sunset-contenido-2027.xlsx   Planilla fuente (contenido de las 52 semanas)
data/sunset-2027.js           Datos generados desde la planilla — no editar a mano
tools/build_data.py           Generador de data/sunset-2027.js
manifest.webmanifest, sw.js, icons/   Instalación como app (PWA) y uso sin conexión
2026.html                     App anterior (2026), se mantiene hasta fin de año
```

## Actualizar el contenido

1. Reemplazar `data/sunset-contenido-2027.xlsx` por la versión nueva.
2. Correr `python3 tools/build_data.py` (requiere `openpyxl`).
3. Si cambió algún archivo de la app, subir la versión de caché en `sw.js` (`sunset-2027-vN`).

El script valida que las 3 palabras principales de cada semana coincidan con la rotación:

```
phase     = floor((semana-1) / 7)
col       = (3 + (semana-1) % 7) % 7
palabra_k = tablero[(phase+k) % 7][col]     // k = 0,1,2 activas; 3..6 "en juego"
```

La columna define el color: Negro, Rojo, Azul, Lila, Verde, Amarillo, Blanco.

## Datos del usuario

El progreso se guarda en `localStorage` (clave `sunset_2027_v1`). No hay sincronización
entre dispositivos: usar *Respaldo de datos → Exportar / Importar*.
