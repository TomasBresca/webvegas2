// src/pages/api/createEntry.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { validateToken, createWhatsAppEntry, validateCSRFToken } from '../../data/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación
    const authToken = cookies.get('auth_token')?.value;
    const sessionId = cookies.get('session_id')?.value;
    
    if (!authToken || !sessionId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    const tokenValidation = validateToken(authToken);
    if (!tokenValidation.valid || !tokenValidation.payload) {
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // Procesar solicitud
    const body = await request.json();
    const { heroId, number, csrfToken } = body;
    
    // Validar CSRF token
    if (!csrfToken || typeof csrfToken !== 'string') {
      return new Response(JSON.stringify({ error: 'Token CSRF faltante' }), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    if (!validateCSRFToken(sessionId, csrfToken)) {
      return new Response(JSON.stringify({ error: 'Token CSRF inválido' }), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    if (!heroId || typeof heroId !== 'number') {
      return new Response(JSON.stringify({ error: 'ID de Hero inválido' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    if (!number || typeof number !== 'string' || !/^\d+$/.test(number)) {
      return new Response(JSON.stringify({ error: 'Número inválido: debe contener solo dígitos' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    await createWhatsAppEntry(heroId, number);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error en el servidor' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};