// src/pages/api/login.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { verifyCredentials, generateToken } from '../../data/auth';

// Simple rate limiting en memoria (en producción usar Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real.trim();
  }
  if (remoteAddr) {
    return remoteAddr.trim();
  }
  
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    return false;
  }
  
  // Si ha pasado el tiempo de bloqueo, resetear
  if (now - attempts.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
  }
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export const POST: APIRoute = async ({ request }) => {
  const clientIP = getClientIP(request);
  
  try {
    // Verificar rate limiting
    if (isRateLimited(clientIP)) {
      return new Response(JSON.stringify({ 
        error: 'Demasiados intentos fallidos. Intenta nuevamente en 15 minutos.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { username, password } = body;
    
    // Validaciones de entrada
    if (!username || !password) {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Credenciales incompletas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (typeof username !== 'string' || typeof password !== 'string') {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Formato de credenciales inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (username.length > 50 || password.length > 100) {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Credenciales demasiado largas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar credentials (ahora es async con bcrypt)
    const isValid = await verifyCredentials(username.trim(), password);
    
    if (!isValid) {
      recordFailedAttempt(clientIP);
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Login exitoso - limpiar intentos fallidos y generar token
    clearFailedAttempts(clientIP);
    const token = generateToken(username.trim());
    
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    recordFailedAttempt(clientIP);
    
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};