import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService } from './order.service';
import { RequestWithUser } from '../auth/types/jwt.types';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get('orders')
  list(@Request() req: RequestWithUser) {
    return this.service.list(req.user.id);
  }

  @Post('checkout')
  checkout(@Request() req: RequestWithUser, @Body() body: CreateOrderDto) {
    return this.service.createFromCart(req.user.id, body.addressId);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, body.status);
  }
}
