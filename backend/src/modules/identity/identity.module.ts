import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '../../common/security/roles.guard';
import { SessionGuard } from '../../common/security/session.guard';
import { IdentityService } from './application/identity.service';
import { IdentityRepository } from './infrastructure/identity.repository';
import {
  AuthController,
  MeController,
} from './presentation/identity.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    IdentityService,
    IdentityRepository,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [IdentityRepository],
})
export class IdentityModule {}
