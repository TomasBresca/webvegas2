// src/pages/api/login.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { verifyCredentials, generateToken } from '../../data/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Credenciales incompletas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const isValid = await verifyCredentials(username, password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = generateToken(username);
    return new Response(JSON.stringify({ token }), {
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