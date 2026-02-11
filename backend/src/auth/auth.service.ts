import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, profileTypes } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create profiles as requested
    const profileResults: {
      buyerProfile?: any;
      sellerProfile?: any;
      adminProfile?: any;
    } = {};
    if (profileTypes.includes('BUYER')) {
      profileResults.buyerProfile = await this.prisma.buyerProfile.create({
        data: { userId: user.id },
      });
    }
    if (profileTypes.includes('SELLER')) {
      profileResults.sellerProfile = await this.prisma.sellerProfile.create({
        data: { userId: user.id },
      });
    }
    if (profileTypes.includes('ADMIN')) {
      profileResults.adminProfile = await this.prisma.adminProfile.create({
        data: { userId: user.id },
      });
    }

    // Remove password from response
    const { password: _password, ...result } = user;
    return { ...result, ...profileResults };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user.id,
    };

    const { password: _password, ...result } = user;

    return {
      user: result,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }

    return null;
  }

  getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        adminProfile: true,
      },
    });
  }
}
