// src/pages/api/getEntries.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { getAllWhatsAppEntries } from '../../data/auth';

export const GET: APIRoute = async () => {
  try {
    const entries = await getAllWhatsAppEntries();
    
    return new Response(JSON.stringify({ entries }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting entries:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener entradas' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}