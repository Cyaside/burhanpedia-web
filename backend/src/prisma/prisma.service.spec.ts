import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('throws when DATABASE_URL is missing', async () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;

    const service = new PrismaService(config);

    await expect(service.onModuleInit()).rejects.toThrow(/DATABASE_URL/i);
  });
});
