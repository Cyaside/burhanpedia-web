import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TopUpWalletDto {
  @Type(() => Number)
  @IsInt()
  @Min(10_000)
  @Max(100_000_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;
}

export class WalletHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;
}
