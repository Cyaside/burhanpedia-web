import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException('Buyer profile not found');
    }
    return profile.id;
  }

  async list(userId: number) {
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.cartItem.findMany({
      where: { buyerId },
      include: { product: { include: { images: true, category: true } }, variant: true },
    });
  }

  async add(userId: number, payload: { productId: number; variantId?: number | null; quantity?: number }) {
    const buyerId = await this.getBuyerId(userId);
    const quantity = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;
    const existing = await this.prisma.cartItem.findFirst({
      where: { buyerId, productId: payload.productId, variantId: payload.variantId ?? undefined },
    });
    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }
    return this.prisma.cartItem.create({
      data: {
        buyerId,
        productId: payload.productId,
        variantId: payload.variantId ?? undefined,
        quantity,
      },
    });
  }

  async updateQuantity(userId: number, id: number, quantity: number) {
    if (quantity < 1) throw new BadRequestException('Quantity must be at least 1');
    const buyerId = await this.getBuyerId(userId);
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.buyerId !== buyerId) throw new BadRequestException('Item not found');
    return this.prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  async remove(userId: number, id: number) {
    const buyerId = await this.getBuyerId(userId);
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.buyerId !== buyerId) throw new BadRequestException('Item not found');
    await this.prisma.cartItem.delete({ where: { id } });
    return { success: true };
  }
}

