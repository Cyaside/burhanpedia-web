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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressService } from './address.service';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.service.create(req.user.userId, body);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.userId, Number(id), body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.userId, Number(id));
  }
}
