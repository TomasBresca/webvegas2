// src/pages/api/getEntries.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { getAllWhatsAppEntries } from '../../data/auth';

export const GET: APIRoute = async () => {
  try {
    const entries = await getAllWhatsAppEntries();
    
    return new Response(JSON.stringify({ entries }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  } catch (error) {
    console.error('Error getting entries:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener entradas' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};