import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { RequireRoles } from '../../../common/security/roles.decorator';
import { AppRole } from '../../identity/domain/identity.types';
import type { SessionPrincipal } from '../../identity/domain/identity.types';
import { CreateVoucherDto } from '../application/admin-operations.dto';
import { AdminOperationsService } from '../application/admin-operations.service';

@RequireRoles(AppRole.ADMIN)
@Controller('admin')
export class AdminOperationsController {
  constructor(private readonly operations: AdminOperationsService) {}

  @Get('operations')
  overview() {
    return this.operations.overview();
  }

  @Post('vouchers')
  createVoucher(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateVoucherDto,
  ) {
    return this.operations.createVoucher(principal.userId, input);
  }
}
