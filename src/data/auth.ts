// src/data/auth.ts
import { createHash } from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

interface WhatsAppEntry {
  heroId: number; 
  number: string;
}

export interface Config {
  whatsappEntries: WhatsAppEntry[];
  admin: {
    username: string;
    password: string;
  };
}

const configPath = path.join(process.cwd(), 'credentials.json');
const DEFAULT_NUMBER = "5491123456789";

export async function readConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    
    // Asegurar estructura correcta
    if (!config.whatsappEntries) {
      config.whatsappEntries = [];
    }
    
    if (!config.admin) {
      config.admin = {
        username: "admin",
        password: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
      };
    }
    
    return config as Config;
  } catch (error) {
    console.error("Error reading config:", error);
    
    // Config por defecto - sin entradas automáticas
    const defaultConfig: Config = {
      whatsappEntries: [],
      admin: {
        username: "admin",
        password: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"
      }
    };
    
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

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

// Funciones CRUD para gestionar números
export async function getAllWhatsAppEntries(): Promise<WhatsAppEntry[]> {
  const config = await readConfig();
  return config.whatsappEntries;
}

export async function getWhatsAppNumber(heroId: number): Promise<string> {
  const config = await readConfig();
  const entry = config.whatsappEntries.find(entry => entry.heroId === heroId);
  
  if (entry) {
    return entry.number;
  }
  
  // Si no existe, devolver número por defecto
  return DEFAULT_NUMBER;
}

export async function updateWhatsAppEntry(oldHeroId: number, newHeroId: number, number: string): Promise<void> {
  if (!number || !/^\d+$/.test(number)) {
    throw new Error('El número debe contener solo dígitos');
  }
  
  const config = await readConfig();
  const entryIndex = config.whatsappEntries.findIndex(entry => entry.heroId === oldHeroId);
  
  if (entryIndex === -1) {
    throw new Error(`No se encontró entrada para Hero ID ${oldHeroId}`);
  }
  
  // Verificar que el nuevo heroId no esté duplicado (excepto si es el mismo)
  if (oldHeroId !== newHeroId) {
    const duplicateIndex = config.whatsappEntries.findIndex(entry => entry.heroId === newHeroId);
    if (duplicateIndex !== -1) {
      throw new Error(`Ya existe una entrada para Hero ID ${newHeroId}`);
    }
  }
  
  // Actualizar la entrada
  config.whatsappEntries[entryIndex] = {
    heroId: newHeroId,
    number
  };
  
  // Ordenar por heroId para mantener consistencia
  config.whatsappEntries.sort((a, b) => a.heroId - b.heroId);
  
  await writeConfig(config);
}

export async function createWhatsAppEntry(heroId: number, number: string): Promise<void> {
  if (!number || !/^\d+$/.test(number)) {
    throw new Error('El número debe contener solo dígitos');
  }
  
  if (heroId < 1) {
    throw new Error('Hero ID debe ser un número positivo');
  }
  
  const config = await readConfig();
  
  // Verificar que no exista ya una entrada para este heroId
  const existingIndex = config.whatsappEntries.findIndex(entry => entry.heroId === heroId);
  if (existingIndex !== -1) {
    throw new Error(`Ya existe una entrada para Hero ID ${heroId}`);
  }
  
  // Añadir la nueva entrada
  config.whatsappEntries.push({
    heroId,
    number
  });
  
  // Ordenar por heroId para mantener consistencia
  config.whatsappEntries.sort((a, b) => a.heroId - b.heroId);
  
  await writeConfig(config);
}

export async function deleteWhatsAppEntry(heroId: number): Promise<void> {
  console.log(`Attempting to delete WhatsApp entry for Hero ID: ${heroId}`);
  
  if (!heroId || heroId < 1) {
    console.error(`Invalid Hero ID for deletion: ${heroId}`);
    throw new Error(`ID de Hero inválido: ${heroId}`);
  }
  
  try {
    const config = await readConfig();
    console.log(`Before deletion - Entries count: ${config.whatsappEntries.length}`);
    
    // Find the entry with the matching heroId
    const entryIndex = config.whatsappEntries.findIndex(entry => entry.heroId === heroId);
    
    if (entryIndex === -1) {
      console.error(`Entry for Hero ID ${heroId} not found`);
      throw new Error(`No se encontró entrada para Hero ID ${heroId}`);
    }
    
    // Log the entry being removed
    console.log(`Removing entry: ${JSON.stringify(config.whatsappEntries[entryIndex])}`);
    
    // Remove the entry
    config.whatsappEntries.splice(entryIndex, 1);
    console.log(`After deletion - Entries count: ${config.whatsappEntries.length}`);
    
    // Write the updated config back to file
    await writeConfig(config);
    console.log(`Configuration file updated successfully after deletion`);
  } catch (error) {
    console.error(`Error deleting WhatsApp entry:`, error);
    throw error; // Re-throw to handle in the API
  }
}