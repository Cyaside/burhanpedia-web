import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AppRole } from '../domain/identity.types';

const PUBLIC_REGISTRATION_ROLES = [
  AppRole.BUYER,
  AppRole.SELLER,
  AppRole.DRIVER,
] as const;

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(PUBLIC_REGISTRATION_ROLES, { each: true })
  roles!: AppRole[];
}

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class SwitchRoleDto {
  @IsEnum(AppRole)
  role!: AppRole;
}
