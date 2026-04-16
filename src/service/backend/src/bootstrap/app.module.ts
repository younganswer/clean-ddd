import { Module } from '@nestjs/common';
import { AppController } from '@/bootstrap/app.controller';
import { AppService } from '@/bootstrap/app.service';
import { appDefaultImportList } from '@/bootstrap/app.default';
import { HttpIdempotencyInterceptor } from '@/common/interceptors/http-idempotency.interceptor';

const AppImports = [...appDefaultImportList];

const AppControllers = [AppController];

const AppProviders = [AppService, HttpIdempotencyInterceptor];

@Module({
	imports: AppImports,
	controllers: AppControllers,
	providers: AppProviders,
})
export class AppModule {}
