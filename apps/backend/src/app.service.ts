import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { status: string; commit: string } {
    return { status: 'ok', commit: process.env.RENDER_GIT_COMMIT ?? 'local' };
  }
}
