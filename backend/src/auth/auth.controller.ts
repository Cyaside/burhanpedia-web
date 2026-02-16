import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { RequestWithUser } from './types/jwt.types';
import {
  AdminProfile,
  BuyerProfile,
  SellerProfile,
  User,
} from '@prisma/client';

type UserProfileResponse = Pick<User, 'id' | 'email' | 'name'> & {
  buyerProfile: BuyerProfile | null;
  sellerProfile: SellerProfile | null;
  adminProfile: AdminProfile | null;
};
type RegisterResponse = Omit<User, 'password'> & {
  buyerProfile?: BuyerProfile | null;
  sellerProfile?: SellerProfile | null;
  adminProfile?: AdminProfile | null;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: Omit<User, 'password'>; access_token: string }> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Request() req: RequestWithUser,
  ): Promise<UserProfileResponse | { error: string }> {
    // Fetch all user info including profiles
    const user = await this.authService.getUserById(req.user.id);
    if (!user) {
      return { error: 'User not found' };
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      buyerProfile: user.buyerProfile,
      sellerProfile: user.sellerProfile,
      adminProfile: user.adminProfile,
    };
  }
}
