// Autenticación compartida por las funciones: una sola clave (variable SUNSET_KEY).
import { timingSafeEqual } from 'node:crypto';

export const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export function sameKey(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Devuelve una respuesta de error si la petición no es válida, o null si puede seguir.
// Una clave incorrecta espera un momento antes de responder, para frenar los intentos en serie.
export async function authorize(req, secret, delayMs = 800) {
  if (!secret) return json(500, { error: 'Falta configurar SUNSET_KEY en Netlify' });
  if (sameKey(req.headers.get('x-sunset-key'), secret)) return null;
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  return json(401, { error: 'Clave incorrecta' });
}
