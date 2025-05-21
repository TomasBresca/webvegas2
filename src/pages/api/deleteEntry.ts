// src/pages/api/deleteEntry.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { validateToken, deleteWhatsAppEntry } from '../../data/auth';

export const POST: APIRoute = async ({ request }) => {
  console.log("DELETE ENTRY API called");
  
  try {
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Authorization header missing or invalid");
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.split(' ')[1];
    if (!validateToken(token)) {
      console.error("Invalid or expired token");
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Process request
    const body = await request.json();
    const { heroId } = body;
    
    console.log(`Request body parsed. Hero ID to delete: ${heroId}`);
    
    if (!heroId || typeof heroId !== 'number') {
      console.error(`Invalid Hero ID format: ${heroId}, type: ${typeof heroId}`);
      return new Response(JSON.stringify({ error: 'ID de Hero inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Call the delete function
    await deleteWhatsAppEntry(heroId);
    console.log(`Successfully deleted entry for Hero ID: ${heroId}`);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`Error in deleteEntry API: ${errorMessage}`, error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}