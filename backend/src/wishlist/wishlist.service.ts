import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Buyer profile not found');
    return profile.id;
  }

  async list(userId: number) {
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.wishlist
      .findMany({
        where: { buyerId },
        include: { product: { include: { category: true, images: true } } },
      })
      .then((items) => items.map((i) => i.product));
  }

  async toggle(userId: number, productId: number) {
    const buyerId = await this.getBuyerId(userId);
    const existing = await this.prisma.wishlist.findFirst({
      where: { buyerId, productId },
    });
    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { success: true, removed: true };
    }
    await this.prisma.wishlist.create({ data: { buyerId, productId } });
    return { success: true, removed: false };
  }
}
