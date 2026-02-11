import { createHttpApp } from "./init";

async function bootstrap() {
  const app = await createHttpApp();
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
