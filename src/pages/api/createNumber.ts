// src/pages/api/createNumber.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { validateToken, createWhatsAppNumber } from '../../data/auth';

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
    
    if (!number || typeof number !== 'string' || !/^\d+$/.test(number)) {
      return new Response(JSON.stringify({ error: 'Número inválido: debe contener solo dígitos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await createWhatsAppNumber(number);
    
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