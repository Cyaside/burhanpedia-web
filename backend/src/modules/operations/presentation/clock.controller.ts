import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import { AdvanceClockDto } from '../application/clock.dto';
import { ClockService } from '../application/clock.service';

@RequireRoles(AppRole.ADMIN)
@Controller('admin/clock')
export class ClockController {
  constructor(private readonly clock: ClockService) {}

  @Get()
  current() {
    return this.clock.current();
  }

  @Post('advance')
  advance(
    @CurrentUser() principal: SessionPrincipal,
    @Body() dto: AdvanceClockDto,
  ) {
    return this.clock.advance(principal.userId, dto.days);
  }
}
