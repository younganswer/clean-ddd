import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createHttpApp } from '@/init';
import { isPortListenEnabled } from '@/runtime-role';

async function bootstrap(): Promise<void> {
	const app = await createHttpApp();

	try {
		const configService = app.get(ConfigService);

		const swaggerEnabled =
			process.env.SWAGGER_ENABLED === 'true' &&
			process.env.NODE_ENV !== 'prod' &&
			process.env.NODE_ENV !== 'production';

		if (swaggerEnabled) {
			const apiVersion = configService.get<string>(
				'APP.API.VERSION',
				'v1',
			);
			const swaggerPath = `api/${apiVersion}/docs`;

			const swaggerConfig = new DocumentBuilder()
				.setTitle(configService.get<string>('APP.NAME', 'api'))
				.setVersion(apiVersion)
				.build();

			const document = SwaggerModule.createDocument(app, swaggerConfig);
			SwaggerModule.setup(swaggerPath, app, document);
		}

		// 멀티 프로세스/클러스터 환경에서 PORT_LISTEN이 true(또는 미설정)일 때만 listen
		if (isPortListenEnabled()) {
			const portFromConfig = configService.get<number>('APP.PORT');
			const port = portFromConfig ?? Number(process.env.PORT ?? 3000);
			await app.listen(port);
		} else {
			await app.init();
		}
	} catch (e) {
		console.error(e);
		process.exit(1);
	}

	if (typeof process.send === 'function') {
		process.send('ready');
	}
}

void bootstrap();
