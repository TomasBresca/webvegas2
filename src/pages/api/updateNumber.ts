// src/pages/api/updateNumber.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { validateToken, updateWhatsAppNumber } from '../../data/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.split(' ')[1];
    if (!validateToken(token)) {
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Procesar solicitud
    const body = await request.json();
    const { number } = body;
    
    if (!number || !/^\d+$/.test(number)) {
      return new Response(JSON.stringify({ error: 'Número inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await updateWhatsAppNumber(number);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}