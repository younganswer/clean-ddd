import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';
import { NestApp } from '@/nest-app';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/app/health-check')
  healthCheck(): string {
    return NestApp.getName() || 'api';
  }
}
