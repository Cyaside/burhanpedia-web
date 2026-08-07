import { Module } from '@nestjs/common';
import { ReviewService } from './application/review.service';
import { ReviewRepository } from './infrastructure/review.repository';
import {
  BuyerReviewsController,
  ProductReviewsController,
} from './presentation/review.controller';

@Module({
  controllers: [ProductReviewsController, BuyerReviewsController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewsModule {}
