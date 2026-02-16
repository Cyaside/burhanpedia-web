import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewService } from './review.service';
import { RequestWithUser } from '../auth/types/jwt.types';
import { CreateReviewDto } from './dto/review.dto';

@Controller('products/:productId/reviews')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get()
  list(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.list(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: CreateReviewDto,
  ) {
    return this.service.create(req.user.id, {
      productId,
      rating: body.rating,
      comment: body.comment,
    });
  }
}
