import { Type } from 'class-transformer';
import {
  IsInt,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  variantId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class CreateAddressDto {
  @IsString()
  @MaxLength(40)
  label!: string;

  @IsString()
  @MaxLength(120)
  recipientName!: string;

  @IsString()
  @MaxLength(17)
  @Matches(/^\+?[0-9]{8,16}$/)
  phone!: string;

  @IsString()
  @MaxLength(250)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  line2?: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsString()
  @MaxLength(100)
  province!: string;

  @IsString()
  @MaxLength(5)
  @Matches(/^[0-9]{5}$/)
  postalCode!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
