// src/pages/api/getNumber.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { getWhatsAppNumber } from '../../data/auth';

export const GET: APIRoute = async () => {
  try {
    const number = await getWhatsAppNumber();
    return new Response(JSON.stringify({ number }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener número' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}