import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,40}$/)
  code!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsIn(['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'])
  kind!: 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING';

  @IsOptional()
  @Matches(/^[0-9]{1,15}$/)
  valueAmount?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  valueBasisPoints?: number;

  @IsOptional()
  @Matches(/^[0-9]{1,15}$/)
  maximumDiscountAmount?: string;

  @Matches(/^[0-9]{1,15}$/)
  minimumSubtotalAmount!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quota?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perBuyerLimit!: number;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;
}
