#!/usr/bin/env python3
"""Planilla de Temas Macro (Excel) -> datos JSON inyectados en public/index.html.

Uso: python3 tools/build_data.py [ruta.xlsx]
Lee las hojas «Temas Macro AAAA», «Historia y Marcos» y «Guia de Valores ADN».
El bloque entre /*DATA*/ y /*/DATA*/ de index.html se reemplaza; no editar a mano.
"""
import json, re, sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']


def txt(v):
    return '' if v is None else str(v).strip()


def puntos(v):
    return [re.sub(r'^[•\-\s]+', '', l).strip() for l in txt(v).splitlines() if l.strip()]


def versiculo(v):
    # «Cita — texto» ; la cita queda separada para poder corregirla aparte
    s = txt(v)
    if '—' in s:
        ref, texto = s.split('—', 1)
        return {'ref': ref.strip(), 'texto': ' '.join(texto.split())}
    return {'ref': '', 'texto': ' '.join(s.split())}


def frase(v):
    s = txt(v)
    if '—' in s:
        f, autor = s.rsplit('—', 1)
        return {'texto': f.strip().strip('"“”'), 'autor': autor.strip()}
    return {'texto': s.strip('"“”'), 'autor': ''}


def rows(ws):
    it = ws.iter_rows(values_only=True)
    head = [txt(h) for h in next(it)]
    return [dict(zip(head, r)) for r in it if any(r)]


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    hoja = next(n for n in wb.sheetnames if n.startswith('Temas Macro'))
    anio = int(re.search(r'\d{4}', hoja).group())

    marcos = {}
    for r in rows(wb['Historia y Marcos']):
        marcos[(txt(r['Tema']), int(r['Ronda']))] = {
            'historiaTitulo': txt(r['Historia Biblica - Titulo']),
            'historia': txt(r['Historia Biblica - Texto']),
            'teorico': txt(r['Marco Teorico - Afirmacion']),
            'fuente': txt(r['Marco Teorico - Fuente']),
            'claves': [s.strip() for s in txt(r['Marco Biblico - Versiculos clave']).split('|') if s.strip()],
            'contexto': txt(r['Marco Biblico - Contexto']),
            'conexion': txt(r['Marco Biblico - Conexion']),
        }

    valores = {}
    for r in rows(wb['Guia de Valores ADN']):
        valores[txt(r['Valor'])] = {
            'definicion': txt(r['Definicion aplicada']),
            'contenido': txt(r['Como se nota en el contenido']),
            'pregunta': txt(r['Pregunta guia']),
            'ejemplo': txt(r['Ejemplo de aplicacion']),
        }

    semanas = []
    for r in rows(wb[hoja]):
        d, m, a = txt(r['Fecha inicio (Dom)']).split('/')
        tema, ronda = txt(r['Tema']), int(r['Ronda'])
        semanas.append({
            'n': int(r['Semana']),
            'inicio': f'{a}-{m}-{d}',
            'color': txt(r['Color']),
            'tema': tema,
            'ronda': ronda,
            'enfoque': txt(r['Enfoque']),
            'subtemas': [{
                'titulo': txt(r[f'Subtema {i}']),
                'desarrollo': txt(r[f'Desarrollo {i}']),
                'nota': txt(r[f'Nota Locutor {i}']),
                'frase': frase(r[f'Frase Celebre {i}']),
            } for i in (1, 2, 3)],
            'historia': txt(r['Historia Ilustrativa']),
            'valor': txt(r['Valor (ADN)']),
            'programa': txt(r['Programa']),
            'locutor': txt(r['Locutor']),
            'dias': [{**versiculo(r[f'Versiculo {d}']), 'puntos': puntos(r[f'3 Puntos {d}'])} for d in DIAS],
            'marco': marcos.get((tema, ronda)),
        })

    data = {'anio': anio, 'semanas': semanas, 'valores': valores}
    html = ROOT / 'public' / 'index.html'
    src = html.read_text(encoding='utf-8')
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    out, n = re.subn(r'/\*DATA\*/.*?/\*/DATA\*/', lambda _: f'/*DATA*/{blob}/*/DATA*/', src, flags=re.S)
    if n != 1:
        sys.exit('No se encontró el marcador /*DATA*/ en index.html')
    html.write_text(out, encoding='utf-8')
    sin_marco = [s['n'] for s in semanas if not s['marco']]
    print(f'{anio}: {len(semanas)} semanas · {len(marcos)} marcos · {len(valores)} valores'
          + (f' · sin marco: {sin_marco}' if sin_marco else ''))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else next((ROOT / 'content' / 'planillas').glob('*.xlsx')))
