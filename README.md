# Sunset App

Dashboard semanal del Sistema Sunset (Richarh Rojas).

## Estructura

```
index.html                    App completa (HTML + CSS + JS en un solo archivo)
netlify/functions/notion.js   Proxy hacia la API de Notion
netlify.toml                  Configuración de Netlify
```

## Datos

- El progreso se guarda en `localStorage` del navegador (clave `sunset_v10_2026`).
- Los registros diarios, evaluaciones y @ semanales se envían a tres bases de Notion
  a través de `/.netlify/functions/notion`.

## Configuración en Netlify

En **Site configuration → Environment variables**, crear:

| Variable       | Valor                              |
| -------------- | ---------------------------------- |
| `NOTION_TOKEN` | Token de la integración de Notion  |

La función solo acepta el endpoint `pages` de Notion.
