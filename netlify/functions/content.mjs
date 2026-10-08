// Entrega el contenido del año (semanas, preguntas, tablero) solo a quien tiene la clave.
// El contenido vive en netlify/content/data.mjs, fuera de la carpeta pública del sitio.
import content from '../content/data.mjs';
import { authorize, json } from '../lib/auth.mjs';

export async function handleContent(req, secret, data = content, delayMs) {
  const denied = await authorize(req, secret, delayMs);
  if (denied) return denied;
  if (req.method !== 'GET') return json(405, { error: 'Método no permitido' });
  return json(200, data);
}

export default async (req) => handleContent(req, process.env.SUNSET_KEY);

export const config = { path: '/api/content' };
