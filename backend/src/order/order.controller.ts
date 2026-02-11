import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService } from './order.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get('orders')
  list(@Request() req: any) {
    return this.service.list(req.user.userId);
  }

  @Post('checkout')
  checkout(@Request() req: any, @Body() body: { addressId: number }) {
    return this.service.createFromCart(req.user.userId, Number(body.addressId));
  }

  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(Number(id), body.status);
  }
}
