import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewService } from './review.service';

@Controller('products/:productId/reviews')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get()
  list(@Param('productId') productId: string) {
    return this.service.list(Number(productId));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.service.create(req.user.userId, { productId: Number(productId), rating: Number(body.rating), comment: body.comment });
  }
}

