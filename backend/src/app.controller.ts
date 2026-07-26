import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/security/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(): { name: string; version: string; status: 'ok' } {
    return this.appService.getInfo();
  }
}
