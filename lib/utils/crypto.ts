// /lib/utils/crypto.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  // Validate encryption key
  if (!process.env.AGENT_ENCRYPTION_KEY) {
    throw new Error('AGENT_ENCRYPTION_KEY environment variable is not set. Please add it to your .env file.');
  }

  const key = process.env.AGENT_ENCRYPTION_KEY;
  
  // Check if it's a hex string (64 characters for 32 bytes)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  
  // Check if it's a 32-character string
  if (key.length === 32) {
    return Buffer.from(key, 'utf8');
  }
  
  throw new Error(`AGENT_ENCRYPTION_KEY must be either 32 characters (UTF-8) or 64 characters (hex). Current length: ${key.length}`);
}

export function encrypt(text: string): string {
  const encryptionKey = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const encryptionKey = getEncryptionKey();
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}