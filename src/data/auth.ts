// src/data/auth.ts
import { createHash } from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface Config {
  whatsappNumbers: string[];
  admin: {
    username: string;
    password: string;
  };
}

const configPath = path.join(process.cwd(), 'credentials.json');

// Leer configuración
export async function readConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    
    // Asegurarse de que la estructura es correcta
    if (!config.whatsappNumbers) {
      config.whatsappNumbers = Array(23).fill("5491123456789");
    }
    
    if (!config.admin) {
      config.admin = {
        username: "admin",
        password: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
      };
    }
    
    return config as Config;
  } catch (error) {
    // Si el archivo no existe, crear configuración por defecto
    const defaultConfig: Config = {
      whatsappNumbers: Array(23).fill("5491123456789"),
      admin: {
        username: "admin",
        password: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
      }
    };
    
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

// Escribir configuración
export async function writeConfig(config: Config): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

// Autenticación
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const config = await readConfig();
  const hashedPassword = hashPassword(password);
  return username === config.admin.username && hashedPassword === config.admin.password;
}

export function generateToken(username: string): string {
  const payload = { username, exp: Date.now() + 3600000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Funciones para gestionar números de WhatsApp
export async function getAllWhatsAppNumbers(): Promise<string[]> {
  const config = await readConfig();
  return config.whatsappNumbers;
}

export async function getWhatsAppNumber(heroId: number): Promise<string> {
  const config = await readConfig();
  // Los heroId van de 1 a 23, pero los índices del array van de 0 a 22
  const index = heroId - 1;
  
  if (index >= 0 && index < config.whatsappNumbers.length) {
    return config.whatsappNumbers[index];
  }
  
  // Si no existe, devolver el primero como fallback
  return config.whatsappNumbers[0] || "5491123456789";
}

export async function updateWhatsAppNumber(heroId: number, number: string): Promise<void> {
  if (!number || !/^\d+$/.test(number)) {
    throw new Error('El número debe contener solo dígitos');
  }
  
  const config = await readConfig();
  const index = heroId - 1;
  
  if (index >= 0 && index < config.whatsappNumbers.length) {
    config.whatsappNumbers[index] = number;
    await writeConfig(config);
  } else {
    throw new Error(`ID de Hero inválido: ${heroId}`);
  }
}

export async function createWhatsAppNumber(number: string): Promise<void> {
  if (!number || !/^\d+$/.test(number)) {
    throw new Error('El número debe contener solo dígitos');
  }
  
  const config = await readConfig();
  config.whatsappNumbers.push(number);
  await writeConfig(config);
}

export async function deleteWhatsAppNumber(heroId: number): Promise<void> {
  const config = await readConfig();
  const index = heroId - 1;
  
  if (index >= 0 && index < config.whatsappNumbers.length) {
    // No eliminar realmente, sólo reemplazar con valor por defecto
    config.whatsappNumbers[index] = "5491123456789";
    await writeConfig(config);
  } else {
    throw new Error(`ID de Hero inválido: ${heroId}`);
  }
}