import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async list(@Request() req: any) {
    return this.cartService.list(req.user.userId);
  }

  @Post()
  async add(
    @Request() req: any,
    @Body() body: { productId: number; variantId?: number; quantity?: number },
  ) {
    return this.cartService.add(req.user.userId, {
      productId: Number(body.productId),
      variantId: body.variantId ? Number(body.variantId) : undefined,
      quantity: body.quantity ? Number(body.quantity) : 1,
    });
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.userId,
      Number(id),
      Number(body.quantity),
    );
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.cartService.remove(req.user.userId, Number(id));
  }
}
