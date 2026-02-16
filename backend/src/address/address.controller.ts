import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressService } from './address.service';
import { RequestWithUser } from '../auth/types/jwt.types';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { Address } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Get()
  list(@Request() req: RequestWithUser): Promise<Address[]> {
    return this.service.list(req.user.id);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() body: CreateAddressDto,
  ): Promise<Address> {
    return this.service.create(req.user.id, body);
  }

  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAddressDto,
  ): Promise<Address> {
    return this.service.update(req.user.id, id, body);
  }

  @Delete(':id')
  remove(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: true }> {
    return this.service.remove(req.user.id, id);
  }
}
