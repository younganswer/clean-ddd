import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { appDefaultImportList } from '@/app.default';
import { OutboxSweepInterceptor } from '@/modules/outbox/presentation/outbox-sweep.interceptor';

@Module({
  controllers: [AppController],
  imports: [...appDefaultImportList],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OutboxSweepInterceptor,
    },
  ],
})
export class AppModule {}
