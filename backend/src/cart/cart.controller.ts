import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types/jwt.types';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async list(@Request() req: RequestWithUser) {
    return this.cartService.list(req.user.id);
  }

  @Post()
  async add(@Request() req: RequestWithUser, @Body() body: AddToCartDto) {
    return this.cartService.add(req.user.id, {
      productId: body.productId,
      variantId: body.variantId,
      quantity: body.quantity,
    });
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCartDto,
  ) {
    return this.cartService.updateQuantity(req.user.id, id, body.quantity);
  }

  @Delete(':id')
  async remove(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cartService.remove(req.user.id, id);
  }
}
