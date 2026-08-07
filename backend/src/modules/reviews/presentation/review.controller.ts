import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { Public } from '../../../common/security/public.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import { SaveProductReviewDto } from '../application/review.dto';
import { ReviewService } from '../application/review.service';

@Controller('products/:productId/reviews')
export class ProductReviewsController {
  constructor(private readonly reviews: ReviewService) {}

  @Public()
  @Get()
  list(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviews.productReviews(productId);
  }
}

@RequireRoles(AppRole.BUYER)
@Controller('orders/:orderId/items/:orderItemId/review')
export class BuyerReviewsController {
  constructor(private readonly reviews: ReviewService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Put()
  save(
    @CurrentUser() principal: SessionPrincipal,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('orderItemId', ParseUUIDPipe) orderItemId: string,
    @Body() input: SaveProductReviewDto,
  ) {
    return this.reviews.save(principal.userId, orderId, orderItemId, input);
  }
}
