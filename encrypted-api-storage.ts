// 암호화된 API 키 데이터베이스 저장 시스템

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// 암호화 설정
const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

interface EncryptedApiKey {
  id: string;
  service: 'gemini' | 'azure' | 'openai';
  encryptedKey: string;
  iv: string;
  createdAt: Date;
  updatedAt: Date;
}

class EncryptedApiStorage {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // API 키 암호화
  private encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  // API 키 복호화
  private decrypt(encryptedText: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // API 키 저장
  async storeApiKey(service: string, apiKey: string): Promise<void> {
    const { encrypted, iv } = this.encrypt(apiKey);
    
    await this.prisma.apiKey.upsert({
      where: { service },
      update: {
        encryptedKey: encrypted,
        iv,
        updatedAt: new Date()
      },
      create: {
        service,
        encryptedKey: encrypted,
        iv,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // API 키 조회
  async getApiKey(service: string): Promise<string | null> {
    const record = await this.prisma.apiKey.findUnique({
      where: { service }
    });

    if (!record) return null;

    return this.decrypt(record.encryptedKey, record.iv);
  }

  // API 키 삭제
  async deleteApiKey(service: string): Promise<void> {
    await this.prisma.apiKey.delete({
      where: { service }
    });
  }

  // 모든 키 마스킹하여 조회
  async getAllMaskedKeys(): Promise<Record<string, string>> {
    const keys = await this.prisma.apiKey.findMany();
    const masked: Record<string, string> = {};

    for (const key of keys) {
      const decrypted = this.decrypt(key.encryptedKey, key.iv);
      masked[key.service] = `${decrypted.slice(0, 10)}...`;
    }

    return masked;
  }
}

// Prisma 스키마 (schema.prisma)
const prismaSchema = `
model ApiKey {
  id           String   @id @default(cuid())
  service      String   @unique
  encryptedKey String
  iv           String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("api_keys")
}
`;

// 사용 예시
export class ApiKeyManager {
  private storage: EncryptedApiStorage;

  constructor() {
    this.storage = new EncryptedApiStorage();
  }

  // Gemini API 키 설정
  async setGeminiKey(apiKey: string): Promise<boolean> {
    try {
      // 키 유효성 검증
      await this.validateGeminiKey(apiKey);
      
      // 암호화하여 저장
      await this.storage.storeApiKey('gemini', apiKey);
      
      return true;
    } catch (error) {
      console.error('Gemini API 키 저장 실패:', error);
      return false;
    }
  }

  // Gemini API 키 조회
  async getGeminiKey(): Promise<string | null> {
    return await this.storage.getApiKey('gemini');
  }

  // 키 유효성 검증
  private async validateGeminiKey(apiKey: string): Promise<void> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const result = await model.generateContent("test");
    const response = await result.response;
    
    if (!response.text()) {
      throw new Error('Invalid API key');
    }
  }
}

// API 엔드포인트
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyManager = new ApiKeyManager();

  if (req.method === 'POST') {
    const { service, apiKey } = req.body;
    
    if (service === 'gemini') {
      const success = await keyManager.setGeminiKey(apiKey);
      return res.json({ success, message: success ? '저장 완료' : '저장 실패' });
    }
  }

  if (req.method === 'GET') {
    const storage = new EncryptedApiStorage();
    const maskedKeys = await storage.getAllMaskedKeys();
    return res.json(maskedKeys);
  }
}