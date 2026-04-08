import { Module } from '@nestjs/common';
import { AppController } from '@/bootstrap/app.controller';
import { AppService } from '@/bootstrap/app.service';
import { appDefaultImportList } from '@/bootstrap/app.default';
import { HttpIdempotencyInterceptor } from '@/common/interceptors/http-idempotency.interceptor';

@Module({
	controllers: [AppController],
	imports: [...appDefaultImportList],
	providers: [AppService, HttpIdempotencyInterceptor],
})
export class AppModule {}
