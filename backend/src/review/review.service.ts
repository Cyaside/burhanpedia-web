import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Buyer profile not found');
    return profile.id;
  }

  list(productId: number) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { buyer: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: number,
    payload: { productId: number; rating: number; comment?: string },
  ) {
    const buyerId = await this.getBuyerId(userId);
    const review = await this.prisma.review.create({
      data: {
        productId: payload.productId,
        rating: payload.rating,
        comment: payload.comment,
        buyerId,
      },
    });
    // Update aggregates
    const agg = await this.prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { productId: payload.productId },
    });
    await this.prisma.product.update({
      where: { id: payload.productId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating ?? 0,
      },
    });
    return review;
  }
}
