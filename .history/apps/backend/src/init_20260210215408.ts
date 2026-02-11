import { ConsoleLogger, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AuthGuard } from './common/guards/auth.guard';
import { NestApp } from './nest-app';

let isConfigured = false;

async function configureHttpApp(app: INestApplication): Promise<void> {
  if (isConfigured) return;
  isConfigured = true;

  // Cluster 환경에서 무중단 배포 (keep-alive close 지원)
  let isDisableKeepAlive = false;
  process.on('SIGINT', () => {
    isDisableKeepAlive = true;
    app.close().then(() => process.exit(0));
  });

  const configService = app.get(ConfigService);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isDisableKeepAlive) res.set('Connection', 'close');
    next();
  });
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

  NestApp.setApp(app);
  NestApp.setName(configService.get<string>('APP.NAME', 'api'));
}

export async function createHttpApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: process.env['APP.NAME'] || 'api',
      colors: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'production',
    }),
  });

  await configureHttpApp(app);
  return app;
}
