import { BadRequestException, Injectable } from '@nestjs/common';
import { Address } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerId(userId: number): Promise<number> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new BadRequestException('Buyer profile not found');
    return profile.id;
  }

  async list(userId: number): Promise<Address[]> {
    const buyerId = await this.getBuyerId(userId);
    return this.prisma.address.findMany({
      where: { buyerId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async create(userId: number, payload: CreateAddressDto): Promise<Address> {
    const buyerId = await this.getBuyerId(userId);
    if (payload.isDefault) {
      await this.prisma.address.updateMany({
        where: { buyerId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: { ...payload, buyerId },
    });
  }

  async update(
    userId: number,
    id: number,
    payload: UpdateAddressDto,
  ): Promise<Address> {
    const buyerId = await this.getBuyerId(userId);
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.buyerId !== buyerId)
      throw new BadRequestException('Address not found');
    if (payload.isDefault) {
      await this.prisma.address.updateMany({
        where: { buyerId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({ where: { id }, data: payload });
  }

  async remove(userId: number, id: number): Promise<{ success: true }> {
    const buyerId = await this.getBuyerId(userId);
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.buyerId !== buyerId)
      throw new BadRequestException('Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { success: true };
  }
}
