import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appDefaultImportList } from './app.default';
import { AuthGuard } from './common/guards/auth.guard';

@Module({
  controllers: [AppController],
  imports: [...appDefaultImportList],
  providers: [AppService, AuthGuard],
  exports: [AuthGuard],
})
export class AppModule {}
