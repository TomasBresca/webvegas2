// src/data/auth.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

interface WhatsAppEntry {
  heroId: number; 
  number: string;
}

export interface Config {
  whatsappEntries: WhatsAppEntry[];
}

interface JWTPayload {
  username: string;
  csrfToken: string;
  iat: number;
  exp: number;
}

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
}

const configPath = path.join(process.cwd(), 'whatsappNumbers.json');
const SALT_ROUNDS = 12;

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const WINDOW_TIME = 15 * 60 * 1000; // 15 minutes
const BLOCK_TIME = 60 * 60 * 1000; // 1 hour after max attempts
const rateLimitStore = new Map<string, RateLimitEntry>();

// CSRF token store
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// FUNCIÓN CORREGIDA PARA ASTRO - ACCESO DIRECTO A VARIABLES ESPECÍFICAS
const getEnvVar = (name: string, defaultValue?: string): string => {
  let value: string | undefined;
  
  // Acceso directo a variables específicas en Astro (NO dinámico)
  switch (name) {
    case 'JWT_SECRET':
      value = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
      break;
    case 'ADMIN_USERNAME':
      value = import.meta.env.ADMIN_USERNAME || process.env.ADMIN_USERNAME;
      break;
    case 'ADMIN_PASSWORD_HASH':
      value = import.meta.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH;
      break;
    case 'DEFAULT_WHATSAPP_NUMBER':
      value = import.meta.env.DEFAULT_WHATSAPP_NUMBER || process.env.DEFAULT_WHATSAPP_NUMBER;
      break;
    case 'NODE_ENV':
      value = import.meta.env.NODE_ENV || process.env.NODE_ENV;
      break;
    default:
      console.warn(`Variable de entorno no configurada: ${name}`);
  }
  
  // Usar valor por defecto si no se encuentra
  if (!value && defaultValue !== undefined) {
    value = defaultValue;
  }
  
  if (!value) {
    throw new Error(`CRITICAL: Variable de entorno requerida no encontrada: ${name}`);
  }
  
  return value.trim();
};

// VARIABLES CRÍTICAS CON VALIDACIÓN ESTRICTA
const JWT_SECRET: string = getEnvVar('JWT_SECRET');
const ADMIN_USERNAME: string = getEnvVar('ADMIN_USERNAME');
const ADMIN_PASSWORD_HASH: string = getEnvVar('ADMIN_PASSWORD_HASH');
const DEFAULT_NUMBER: string = getEnvVar('DEFAULT_WHATSAPP_NUMBER');
const NODE_ENV: string = getEnvVar('NODE_ENV', 'production');

// VALIDACIONES CRÍTICAS DE ARRANQUE
const validateEnvironment = (): void => {
  const errors: string[] = [];

  if (JWT_SECRET.length < 32) {
    errors.push(`JWT_SECRET debe tener al menos 32 caracteres, actual: ${JWT_SECRET.length}`);
  }

  if (ADMIN_PASSWORD_HASH.length !== 60) {
    errors.push(`ADMIN_PASSWORD_HASH debe tener exactamente 60 caracteres, actual: ${ADMIN_PASSWORD_HASH.length}`);
  }

  if (!ADMIN_PASSWORD_HASH.startsWith('$2b$12$')) {
    errors.push(`ADMIN_PASSWORD_HASH tiene formato inválido: ${ADMIN_PASSWORD_HASH.substring(0, 20)}...`);
  }

  if (ADMIN_USERNAME.length === 0) {
    errors.push('ADMIN_USERNAME no puede estar vacío');
  }

  if (DEFAULT_NUMBER.length < 10) {
    errors.push(`DEFAULT_NUMBER debe tener al menos 10 dígitos, actual: ${DEFAULT_NUMBER.length}`);
  }

  if (errors.length > 0) {
    console.error('❌ ERRORES DE CONFIGURACIÓN:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Configuración de entorno inválida: ${errors.join(', ')}`);
  }

  console.log('✅ Todas las variables de entorno son válidas');
};

// EJECUTAR VALIDACIÓN AL IMPORTAR EL MÓDULO
validateEnvironment();

// Rate limiting functions
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    return { allowed: true };
  }
  
  // Clean up old entries
  if (now - entry.lastAttempt > BLOCK_TIME) {
    rateLimitStore.delete(identifier);
    return { allowed: true };
  }
  
  // If blocked, check if block time has passed
  if (entry.blocked) {
    const timeLeft = BLOCK_TIME - (now - entry.lastAttempt);
    if (timeLeft > 0) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil(timeLeft / 1000) 
      };
    } else {
      rateLimitStore.delete(identifier);
      return { allowed: true };
    }
  }
  
  // Check if within window
  if (now - entry.firstAttempt > WINDOW_TIME) {
    // Reset window
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false
    });
    return { allowed: true };
  }
  
  // Within window, check attempts
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blocked = true;
    entry.lastAttempt = now;
    return { 
      allowed: false, 
      retryAfter: Math.ceil(BLOCK_TIME / 1000) 
    };
  }
  
  return { allowed: true };
}

export function recordLoginAttempt(identifier: string, success: boolean): void {
  const now = Date.now();
  
  if (success) {
    rateLimitStore.delete(identifier);
    return;
  }
  
  const entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false
    });
  } else {
    entry.count++;
    entry.lastAttempt = now;
    
    if (entry.count >= MAX_ATTEMPTS) {
      entry.blocked = true;
    }
  }
}

// CSRF token functions
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  csrfTokenStore.set(sessionId, { token, expires });
  
  // Clean up expired tokens
  for (const [key, value] of csrfTokenStore.entries()) {
    if (value.expires < Date.now()) {
      csrfTokenStore.delete(key);
    }
  }
  
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);
  
  if (!stored) {
    return false;
  }
  
  if (stored.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

export async function readConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data) as Config;
    
    if (!Array.isArray(config.whatsappEntries)) {
      config.whatsappEntries = [];
    }
    
    return config;
  } catch (error) {
    console.error("Error reading config:", error);
    
    const defaultConfig: Config = {
      whatsappEntries: []
    };
    
    try {
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      console.log('Archivo de configuración por defecto creado');
    } catch (writeError) {
      console.error("Error creating default config:", writeError);
    }
    
    return defaultConfig;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  if (!config || !Array.isArray(config.whatsappEntries)) {
    throw new Error('Configuración inválida para escribir');
  }
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password debe ser una string válida');
  }
  if (password.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  try { 
    // Validaciones de entrada estrictas
    if (!username || typeof username !== 'string') {
      console.log("❌ Username inválido");
      return false;
    }
    
    if (!password || typeof password !== 'string') {
      console.log("❌ Password inválido");
      return false;
    }
    
    if (username.trim() !== ADMIN_USERNAME) {
      console.log("❌ Username no coincide");
      return false;
    }
    
    if (ADMIN_PASSWORD_HASH.length !== 60) {
      console.log(`❌ Hash length incorrecto: ${ADMIN_PASSWORD_HASH.length}`);
      return false;
    }
    
    // Verificación con bcrypt
    const isValid: boolean = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying credentials:', error);
    return false;
  }
}

export function generateToken(username: string, csrfToken: string): string {
  if (!username || typeof username !== 'string') {
    throw new Error('Username debe ser una string válida para generar token');
  }
  
  if (!csrfToken || typeof csrfToken !== 'string') {
    throw new Error('CSRF token debe ser una string válida');
  }
  
  const payload = {
    username: username.trim(),
    csrfToken,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    algorithm: 'HS256',
    issuer: 'las-vegas-app',
    audience: 'admin-panel'
  });
}

export function validateToken(token: string): { valid: boolean; payload?: JWTPayload } {
  try {
    if (!token || typeof token !== 'string') {
      console.error('Token inválido o vacío');
      return { valid: false };
    }
    
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'las-vegas-app',
      audience: 'admin-panel'
    }) as JWTPayload;
    
    if (!decoded.username || typeof decoded.username !== 'string') {
      console.error('Token no contiene username válido');
      return { valid: false };
    }
    
    if (!decoded.csrfToken || typeof decoded.csrfToken !== 'string') {
      console.error('Token no contiene CSRF token');
      return { valid: false };
    }
    
    const isValid = decoded.username === ADMIN_USERNAME;
    console.log(`Token validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    return { valid: isValid, payload: decoded };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

export function getSecureCookieOptions(isSecure: boolean = true): string {
  const options = [
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=3600' // 1 hour
  ];
  
  if (isSecure && NODE_ENV === 'production') {
    options.push('Secure');
  }
  
  return options.join('; ');
}

export async function getAllWhatsAppEntries(): Promise<WhatsAppEntry[]> {
  const config = await readConfig();
  return config.whatsappEntries;
}

export async function getWhatsAppNumber(heroId: number): Promise<string> {
  if (!heroId || typeof heroId !== 'number' || heroId < 1) {
    console.warn(`Invalid heroId: ${heroId}, using default number`);
    return DEFAULT_NUMBER;
  }
  
  const config = await readConfig();
  const entry = config.whatsappEntries.find(entry => entry.heroId === heroId);
  
  if (entry && entry.number) {
    return entry.number;
  }
  
  console.log(`No WhatsApp number found for Hero ID ${heroId}, using default`);
  return DEFAULT_NUMBER;
}

export async function updateWhatsAppEntry(oldHeroId: number, newHeroId: number, number: string): Promise<void> {
  // Validaciones estrictas de entrada
  if (!oldHeroId || typeof oldHeroId !== 'number' || oldHeroId < 1) {
    throw new Error('oldHeroId debe ser un número positivo válido');
  }
  
  if (!newHeroId || typeof newHeroId !== 'number' || newHeroId < 1) {
    throw new Error('newHeroId debe ser un número positivo válido');
  }
  
  if (!number || typeof number !== 'string' || !/^\d+$/.test(number.trim())) {
    throw new Error('El número debe contener solo dígitos');
  }
  
  const cleanNumber = number.trim();
  if (cleanNumber.length < 10 || cleanNumber.length > 15) {
    throw new Error('El número debe tener entre 10 y 15 dígitos');
  }
  
  const config = await readConfig();
  const entryIndex = config.whatsappEntries.findIndex(entry => entry.heroId === oldHeroId);
  
  if (entryIndex === -1) {
    throw new Error(`No se encontró entrada para Hero ID ${oldHeroId}`);
  }
  
  // Verificar duplicados solo si el heroId cambia
  if (oldHeroId !== newHeroId) {
    const duplicateIndex = config.whatsappEntries.findIndex(entry => entry.heroId === newHeroId);
    if (duplicateIndex !== -1) {
      throw new Error(`Ya existe una entrada para Hero ID ${newHeroId}`);
    }
  }
  
  // Actualizar entrada
  config.whatsappEntries[entryIndex] = {
    heroId: newHeroId,
    number: cleanNumber
  };
  
  // Ordenar por heroId
  config.whatsappEntries.sort((a, b) => a.heroId - b.heroId);
  
  await writeConfig(config);
  console.log(`Entrada actualizada: Hero ID ${oldHeroId} -> ${newHeroId}, Número: ${cleanNumber}`);
}

export async function createWhatsAppEntry(heroId: number, number: string): Promise<void> {
  // Validaciones estrictas
  if (!heroId || typeof heroId !== 'number' || heroId < 1) {
    throw new Error('Hero ID debe ser un número positivo válido');
  }
  
  if (!number || typeof number !== 'string' || !/^\d+$/.test(number.trim())) {
    throw new Error('El número debe contener solo dígitos');
  }
  
  const cleanNumber = number.trim();
  if (cleanNumber.length < 10 || cleanNumber.length > 15) {
    throw new Error('El número debe tener entre 10 y 15 dígitos');
  }
  
  const config = await readConfig();
  
  // Verificar duplicado
  const existingIndex = config.whatsappEntries.findIndex(entry => entry.heroId === heroId);
  if (existingIndex !== -1) {
    throw new Error(`Ya existe una entrada para Hero ID ${heroId}`);
  }
  
  // Crear nueva entrada
  const newEntry: WhatsAppEntry = {
    heroId,
    number: cleanNumber
  };
  
  config.whatsappEntries.push(newEntry);
  
  // Ordenar por heroId
  config.whatsappEntries.sort((a, b) => a.heroId - b.heroId);
  
  await writeConfig(config);
  console.log(`Nueva entrada creada: Hero ID ${heroId}, Número: ${cleanNumber}`);
}

export async function deleteWhatsAppEntry(heroId: number): Promise<void> {
  if (!heroId || typeof heroId !== 'number' || heroId < 1) {
    throw new Error(`ID de Hero inválido: ${heroId}`);
  }
  
  const config = await readConfig();
  
  const entryIndex = config.whatsappEntries.findIndex(entry => entry.heroId === heroId);
  
  if (entryIndex === -1) {
    throw new Error(`No se encontró entrada para Hero ID ${heroId}`);
  }
  
  const deletedEntry = config.whatsappEntries[entryIndex];
  config.whatsappEntries.splice(entryIndex, 1);
  
  await writeConfig(config);
  console.log(`Entrada eliminada: Hero ID ${heroId}, Número: ${deletedEntry.number}`);
}

export async function generatePasswordHash(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('plainPassword debe ser una string válida');
  }
  return await hashPassword(plainPassword);
}