// src/data/auth.ts
import { createHash } from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Interfaces
export interface Config {
  whatsappNumber: string;
  admin: {
    username: string;
    password: string;
  };
}

// Ruta de configuración
const configPath = path.join(process.cwd(), 'credentials.json');

// Leer configuración
export async function readConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data) as Config;
  } catch (error) {
    // Configuración por defecto si no existe el archivo
    const defaultConfig: Config = {
      whatsappNumber: "541112345678",
      admin: {
        username: "admin",
        password: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" // "1234" hasheado
      }
    };
    
    // Crear archivo si no existe
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

// Escribir configuración
export async function writeConfig(config: Config): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

// Hash de contraseña
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Verificar credenciales
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const config = await readConfig();
  const hashedPassword = hashPassword(password);
  return username === config.admin.username && hashedPassword === config.admin.password;
}

// Generar token (1 hora)
export function generateToken(username: string): string {
  const payload = { username, exp: Date.now() + 3600000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Validar token
export function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Obtener número WhatsApp
export async function getWhatsAppNumber(): Promise<string> {
  const config = await readConfig();
  return config.whatsappNumber;
}

// Actualizar número WhatsApp
export async function updateWhatsAppNumber(number: string): Promise<void> {
  const config = await readConfig();
  config.whatsappNumber = number;
  await writeConfig(config);
}