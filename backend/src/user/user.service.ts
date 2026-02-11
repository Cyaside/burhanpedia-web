// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Rename to match the controller call
  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        buyerProfile: { select: { id: true } },
        sellerProfile: { select: { id: true } },
        adminProfile: { select: { id: true } },
      },
    });

    return users.map((user) => {
      const roles: Array<'BUYER' | 'SELLER' | 'ADMIN'> = [];
      if (user.sellerProfile) roles.push('SELLER');
      if (user.buyerProfile) roles.push('BUYER');
      if (user.adminProfile) roles.push('ADMIN');

      const primaryRole =
        roles.find((role) => role === 'SELLER') ||
        roles.find((role) => role === 'BUYER') ||
        roles.find((role) => role === 'ADMIN') ||
        'BUYER';

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryRole,
        roles,
      };
    });
  }
}
