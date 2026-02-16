import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ReviewWithBuyer = Prisma.ReviewGetPayload<{
  include: { buyer: { include: { user: true } } };
}>;

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number): Promise<number> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Buyer profile not found');
    return profile.id;
  }

  list(productId: number): Promise<ReviewWithBuyer[]> {
    return this.prisma.review.findMany({
      where: { productId },
      include: { buyer: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: number,
    payload: { productId: number; rating: number; comment?: string },
  ): Promise<Review> {
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
