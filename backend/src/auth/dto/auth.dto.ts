import {
  IsEmail,
  IsString,
  MinLength,
  IsArray,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // Milih profile mana yang dibuat
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['BUYER', 'SELLER', 'ADMIN'], { each: true })
  profileTypes: string[];
}
