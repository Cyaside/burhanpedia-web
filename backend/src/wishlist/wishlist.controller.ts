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

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async list(@Request() req: any) {
    return this.wishlistService.list(req.user.userId);
  }

  @Post()
  async toggle(@Request() req: any, @Body() body: { productId: number }) {
    return this.wishlistService.toggle(req.user.userId, Number(body.productId));
  }
}
