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

// Junto al contenido van los datos públicos de configuración que la app necesita (nunca secretos).
export const publicConfig = (env) => ({ googleClientId: env.GOOGLE_CLIENT_ID || '', vapidPublicKey: env.VAPID_PUBLIC_KEY || '' });

export default async (req) => handleContent(req, process.env.SUNSET_KEY, Object.assign({}, content, { config: publicConfig(process.env) }));

export const config = { path: '/api/content' };
