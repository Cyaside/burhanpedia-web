import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): { name: string; version: string; status: 'ok' } {
    return { name: 'Burhanpedia API', version: '1', status: 'ok' };
  }
}
