import {
	ForbiddenException,
	ConsoleLogger,
	INestApplication,
	ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from '@/bootstrap/app.module';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { GlobalHttpExceptionFilter } from '@/common/filters/global-http-exception.filter';
import { AuthGuard } from '@/common/guards/auth.guard';
import { HttpRequestLoggingInterceptor } from '@/common/interceptors/http-request-logging.interceptor';
import { HttpIdempotencyInterceptor } from '@/common/interceptors/http-idempotency.interceptor';
import { NonHttpRequestLoggingInterceptor } from '@/common/interceptors/non-http-request-logging.interceptor';
import { NestApp } from '@/bootstrap/nest-app';

let isConfigured = false;

function configureHttpApp(app: INestApplication): void {
	if (isConfigured) return;
	isConfigured = true;

	// Cluster 환경에서 무중단 배포 (keep-alive close 지원)
	let isDisableKeepAlive = false;
	process.on('SIGINT', () => {
		isDisableKeepAlive = true;
		void app
			.close()
			.then(() => process.exit(0))
			.catch((e) => {
				console.error(e);
				process.exit(1);
			});
	});

	const configService = app.get(ConfigService);
	app.use((req: Request, res: Response, next: NextFunction) => {
		if (isDisableKeepAlive) res.set('Connection', 'close');
		next();
	});

	const authContextAccessor = app.get(AuthContextAccessor);
	const httpIdempotencyInterceptor = app.get(HttpIdempotencyInterceptor);
	app.use((req: Request, res: Response, next: NextFunction) => {
		void req;
		void res;
		authContextAccessor.runWithNewContext(() => next());
	});

	const originVerifyHeaderName = process.env['EDGE_ORIGIN_VERIFY_HEADER_NAME']
		?.trim()
		.toLowerCase();
	const originVerifyHeaderValue =
		process.env['EDGE_ORIGIN_VERIFY_HEADER_VALUE']?.trim();
	if (originVerifyHeaderName && originVerifyHeaderValue) {
		app.use((req: Request, res: Response, next: NextFunction) => {
			const incomingHeader = req.header(originVerifyHeaderName);
			if (incomingHeader !== originVerifyHeaderValue) {
				next(new ForbiddenException('Forbidden'));
				return;
			}
			next();
		});
	}
	app.enableShutdownHooks();

	// Global guard (docs-first placeholder: always allow)
	app.useGlobalGuards(app.get(AuthGuard));

	const apiVersion = configService.get<string>('APP.API.VERSION', 'v1');
	app.setGlobalPrefix(`api/${apiVersion}`);

	const corsUrlsRaw = configService.get<string>('APP.CORS.URL');
	if (corsUrlsRaw && corsUrlsRaw.trim().length > 0) {
		const corsUrls = corsUrlsRaw
			.split(',')
			.map((x) => x.trim())
			.filter((x) => x.length > 0);

		app.enableCors({
			origin: corsUrls.length > 0 ? corsUrls : true,
			credentials: true,
			exposedHeaders: ['authorization', 'x-server-token', 'x-trace-id'],
		});
	} else {
		app.enableCors({
			origin: true,
			credentials: true,
		});
	}

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidUnknownValues: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);

	app.useGlobalInterceptors(
		new HttpRequestLoggingInterceptor(authContextAccessor),
		httpIdempotencyInterceptor,
		new NonHttpRequestLoggingInterceptor(),
	);

	app.useGlobalFilters(new GlobalHttpExceptionFilter());

	NestApp.setApp(app);
	NestApp.setName(configService.get<string>('APP.NAME', 'api'));
}

export async function createHttpApp(): Promise<INestApplication> {
	const app = await NestFactory.create(AppModule, {
		logger: new ConsoleLogger({
			prefix: process.env['APP.NAME'] || 'api',
			colors:
				process.env.NODE_ENV !== 'prod' &&
				process.env.NODE_ENV !== 'production',
		}),
	});

	configureHttpApp(app);
	return app;
}
