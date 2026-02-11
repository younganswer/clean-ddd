import serverlessExpress from '@vendia/serverless-express';
import type { Handler } from 'aws-lambda';
import { createHttpApp } from '../init';

let cachedHandler: Handler | undefined;

export const handler: Handler = async (event, context, callback) => {
  if (!cachedHandler) {
    const app = await createHttpApp();
    await app.init();
    cachedHandler = serverlessExpress({
      app: app.getHttpAdapter().getInstance(),
    }) as unknown as Handler;
  }

  const result = await cachedHandler(event, context, callback);
  return result as unknown;
};
