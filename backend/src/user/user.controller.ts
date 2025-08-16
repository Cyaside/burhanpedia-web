import { Controller, Get, UseGuards, Request, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private readonly logger = new Logger(UserController.name);

  @UseGuards(JwtAuthGuard) 
  @Get()
  async getUsers(@Request() req) {
    try {
      this.logger.log(`Decoded user from JWT: ${JSON.stringify(req.user)}`);
      const users = await this.userService.findAll();
      return users;
    } catch (error) {
      this.logger.error('Error fetching users:', error);
      throw error;
    }
  }
}