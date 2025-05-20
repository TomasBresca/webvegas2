// src/pages/api/deleteNumber.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { validateToken, deleteWhatsAppNumber } from '../../data/auth';

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
    const { heroId } = body;
    
    if (!heroId || typeof heroId !== 'number' || heroId < 1 || heroId > 23) {
      return new Response(JSON.stringify({ error: 'ID de Hero inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await deleteWhatsAppNumber(heroId);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}