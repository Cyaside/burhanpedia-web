import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TopUpDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
