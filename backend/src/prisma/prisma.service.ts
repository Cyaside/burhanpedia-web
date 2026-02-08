import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Use the Prisma Postgres adapter in environments without the Rust engine
let Adapter: any = null;
try {
  // dynamic require so local dev without adapter won't crash early
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaPg } = require('@prisma/adapter-pg');
  Adapter = PrismaPg;
} catch (e) {
  Adapter = null;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    if (Adapter) {
      const conn = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
      const adapterInstance = new Adapter({ connectionString: conn });
      // pass adapter to PrismaClient constructor
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      super({ adapter: adapterInstance });
    } else {
      // Fallback to default constructor (may work for environments with classic engines)
      super();
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
