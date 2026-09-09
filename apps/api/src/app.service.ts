import { Injectable } from '@nestjs/common';
import { APP_NAME } from '@aljama/shared';

@Injectable()
export class AppService {
  getHello(): { message: string; timestamp: string; app: string } {
    return {
      app: APP_NAME,
      message: 'Welcome to AL-JAMA API — Requirements Management System',
      timestamp: new Date().toISOString(),
    };
  }
}
