import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appDefaultImportList } from './app.default';

@Module({
  controllers: [AppController],
  imports: [...appDefaultImportList],
  providers: [AppService],
})
export class AppModule {}
