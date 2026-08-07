import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { SaveProductReviewDto } from '../application/review.dto';

interface ReviewTargetRow {
  product_id: string;
  buyer_profile_id: string;
  order_status: string;
  seller_user_id: string;
}

interface ReviewRow {
  id: string;
  product_id: string;
  order_item_id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ReviewRepository {
  constructor(private readonly database: DatabaseService) {}

  async save(
    userId: string,
    orderId: string,
    orderItemId: string,
    input: SaveProductReviewDto,
  ): Promise<ReviewRow | 'NOT_FOUND' | 'NOT_COMPLETED' | 'OWN_PRODUCT'> {
    return this.database.withTransaction(async (client) => {
      const target = await client.query<ReviewTargetRow>(
        `SELECT v.product_id, o.buyer_profile_id, o.status AS order_status,
                sp.user_id AS seller_user_id
         FROM orders o
         JOIN buyer_profiles bp ON bp.id = o.buyer_profile_id
         JOIN order_items oi ON oi.order_id = o.id
         JOIN product_variants v ON v.id = oi.variant_id
         JOIN products p ON p.id = v.product_id
         JOIN stores s ON s.id = p.store_id
         JOIN seller_profiles sp ON sp.id = s.seller_profile_id
         WHERE bp.user_id = $1 AND o.id = $2 AND oi.id = $3
         FOR SHARE OF o, oi`,
        [userId, orderId, orderItemId],
      );
      const row = target.rows[0];
      if (!row) return 'NOT_FOUND';
      if (row.order_status !== 'COMPLETED') return 'NOT_COMPLETED';
      if (row.seller_user_id === userId) return 'OWN_PRODUCT';

      const review = await client.query<ReviewRow>(
        `INSERT INTO product_reviews
         (product_id, buyer_profile_id, order_item_id, rating, comment)
         VALUES ($1, $2, $3, $4, nullif(btrim($5), ''))
         ON CONFLICT (order_item_id) DO UPDATE SET
           rating = EXCLUDED.rating,
           comment = EXCLUDED.comment
         RETURNING id, product_id, order_item_id, rating, comment,
                   (SELECT split_part(u.name, ' ', 1)
                    FROM buyer_profiles bp JOIN users u ON u.id = bp.user_id
                    WHERE bp.id = product_reviews.buyer_profile_id) AS reviewer_name,
                   created_at, updated_at`,
        [
          row.product_id,
          row.buyer_profile_id,
          orderItemId,
          input.rating,
          input.comment ?? '',
        ],
      );
      return review.rows[0];
    });
  }

  async productReviews(productId: string, limit: number): Promise<ReviewRow[]> {
    const result = await this.database.query<ReviewRow>(
      `SELECT r.id, r.product_id, r.order_item_id, r.rating, r.comment,
              split_part(u.name, ' ', 1) AS reviewer_name,
              r.created_at, r.updated_at
       FROM product_reviews r
       JOIN buyer_profiles bp ON bp.id = r.buyer_profile_id
       JOIN users u ON u.id = bp.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $2`,
      [productId, limit],
    );
    return result.rows;
  }
}
