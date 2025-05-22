// src/pages/api/login.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { verifyCredentials, generateToken, checkRateLimit, recordLoginAttempt, getSecureCookieOptions, generateCSRFToken } from '../../data/auth';
import crypto from 'node:crypto';

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  let ip = 'unknown';
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (real) {
    ip = real.trim();
  } else if (remoteAddr) {
    ip = remoteAddr.trim();
  }
  
  // Create a unique identifier combining IP and user agent
  const identifier = `${ip}-${crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16)}`;
  return identifier;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const clientIdentifier = getClientIdentifier(request);
  
  try {
    // Check rate limiting
    const rateLimitCheck = checkRateLimit(clientIdentifier);
    
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Demasiados intentos fallidos. Intenta nuevamente más tarde.',
        retryAfter: rateLimitCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitCheck.retryAfter || 3600),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + (rateLimitCheck.retryAfter || 3600) * 1000)
        }
      });
    }
    
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      recordLoginAttempt(clientIdentifier, false);
      return new Response(JSON.stringify({ error: 'Content-Type debe ser application/json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { username, password } = body;
    
    // Input validations
    if (!username || !password) {
      recordLoginAttempt(clientIdentifier, false);
      return new Response(JSON.stringify({ error: 'Credenciales incompletas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (typeof username !== 'string' || typeof password !== 'string') {
      recordLoginAttempt(clientIdentifier, false);
      return new Response(JSON.stringify({ error: 'Formato de credenciales inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (username.length > 50 || password.length > 100) {
      recordLoginAttempt(clientIdentifier, false);
      return new Response(JSON.stringify({ error: 'Credenciales demasiado largas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add timing attack protection
    const startTime = Date.now();
    const minDelay = 500; // minimum 500ms response time
    
    // Verify credentials
    const isValid = await verifyCredentials(username.trim(), password);
    
    // Calculate remaining delay
    const elapsedTime = Date.now() - startTime;
    const remainingDelay = Math.max(0, minDelay - elapsedTime);
    
    // Wait for remaining time to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
    
    if (!isValid) {
      recordLoginAttempt(clientIdentifier, false);
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // Login successful
    recordLoginAttempt(clientIdentifier, true);
    
    // Generate session ID and CSRF token
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = generateCSRFToken(sessionId);
    
    // Generate JWT with CSRF token
    const token = generateToken(username.trim(), csrfToken);
    
    // Set secure cookie
    const isSecure = request.url.startsWith('https://');
    cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });
    
    cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });
    
    return new Response(JSON.stringify({ 
      success: true,
      csrfToken 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    recordLoginAttempt(clientIdentifier, false);
    
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};