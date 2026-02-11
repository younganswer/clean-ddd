import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { createHttpApp } from './init';

async function bootstrap(): Promise<void> {
  const app = await createHttpApp();

  try {
    const configService = app.get(ConfigService);

    // PM2/Cluster 환경에서 PORT_LISTEN이 true(또는 미설정)일 때만 listen
    if (process.env.PORT_LISTEN === undefined || process.env.PORT_LISTEN === 'true') {
      const portFromConfig = configService.get<number>('APP.PORT');
      const port = portFromConfig ?? Number(process.env.PORT ?? 3000);
      await app.listen(port);
    } else {
      await app.init();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }

  process.send = process.send || (() => true);
  process.send('ready');
}

bootstrap();
