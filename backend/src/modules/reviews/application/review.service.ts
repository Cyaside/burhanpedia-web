import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from '../infrastructure/review.repository';
import { SaveProductReviewDto } from './review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly reviews: ReviewRepository) {}

  async save(
    userId: string,
    orderId: string,
    orderItemId: string,
    input: SaveProductReviewDto,
  ) {
    const result = await this.reviews.save(userId, orderId, orderItemId, input);
    if (result === 'NOT_FOUND') {
      throw new NotFoundException({
        code: 'ORDER_ITEM_NOT_FOUND',
        detail: 'The order item does not belong to this buyer.',
      });
    }
    if (result === 'NOT_COMPLETED') {
      throw new ConflictException({
        code: 'ORDER_NOT_COMPLETED',
        detail: 'A product can only be reviewed after the order is completed.',
      });
    }
    if (result === 'OWN_PRODUCT') {
      throw new ForbiddenException({
        code: 'OWN_PRODUCT_REVIEW_FORBIDDEN',
        detail: 'A seller cannot review their own product.',
      });
    }
    return this.present(result);
  }

  async productReviews(productId: string) {
    const rows = await this.reviews.productReviews(productId, 20);
    return { items: rows.map((row) => this.present(row)) };
  }

  private present(
    row: Awaited<ReturnType<ReviewRepository['productReviews']>>[number],
  ) {
    return {
      id: row.id,
      productId: row.product_id,
      orderItemId: row.order_item_id,
      rating: row.rating,
      comment: row.comment,
      reviewerName: row.reviewer_name,
      verifiedPurchase: true,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
