// src/pages/api/getNumbers.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { getAllWhatsAppNumbers } from '../../data/auth';

export const GET: APIRoute = async () => {
  try {
    const numbers = await getAllWhatsAppNumbers();
    
    return new Response(JSON.stringify({ numbers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener números' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}