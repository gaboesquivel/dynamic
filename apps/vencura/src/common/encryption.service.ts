import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 16;

  constructor(private readonly configService: ConfigService) {}

  private async getKey(): Promise<Buffer> {
    const encryptionKey = this.configService.get<string>('encryption.key');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not set');
    }
    const salt = Buffer.from(encryptionKey.slice(0, this.saltLength), 'utf8');
    const key = (await promisify(scrypt)(
      encryptionKey,
      salt,
      this.keyLength,
    )) as Buffer;
    return key;
  }

  async encrypt(text: string): Promise<string> {
    const key = await this.getKey();
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decrypt(encryptedText: string): Promise<string> {
    const key = await this.getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
