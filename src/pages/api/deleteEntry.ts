// src/pages/api/deleteEntry.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { validateToken, deleteWhatsAppEntry, validateCSRFToken } from '../../data/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("DELETE ENTRY API called");
  
  try {
    // Authentication check
    const authToken = cookies.get('auth_token')?.value;
    const sessionId = cookies.get('session_id')?.value;
    
    if (!authToken || !sessionId) {
      console.error("Authorization token or session missing");
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
      console.error("Invalid or expired token");
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // Process request
    const body = await request.json();
    const { heroId, csrfToken } = body;
    
    console.log(`Request body parsed. Hero ID to delete: ${heroId}`);
    
    // Validate CSRF token
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
      console.error(`Invalid Hero ID format: ${heroId}, type: ${typeof heroId}`);
      return new Response(JSON.stringify({ error: 'ID de Hero inválido' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // Call the delete function
    await deleteWhatsAppEntry(heroId);
    console.log(`Successfully deleted entry for Hero ID: ${heroId}`);
    
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
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in deleteEntry API: ${errorMessage}`, error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};