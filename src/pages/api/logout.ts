// src/pages/api/logout.ts
export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Clear all authentication cookies
    cookies.delete('auth_token', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
    
    cookies.delete('session_id', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Error al cerrar sesión' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};