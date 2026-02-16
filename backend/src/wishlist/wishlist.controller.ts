import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';
import type { RequestWithUser } from '../auth/types/jwt.types';
import { ToggleWishlistDto } from './dto/wishlist.dto';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async list(@Request() req: RequestWithUser) {
    return this.wishlistService.list(req.user.id);
  }

  @Post()
  async toggle(
    @Request() req: RequestWithUser,
    @Body() body: ToggleWishlistDto,
  ) {
    return this.wishlistService.toggle(req.user.id, body.productId);
  }
}
