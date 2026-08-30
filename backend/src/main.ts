import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';
  const allowed = (process.env.CORS_ORIGIN ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    // In development the web app moves between ports and LAN addresses, so
    // reflect whatever origin asks. Deployments stay pinned to CORS_ORIGIN.
    origin: isProduction ? allowed : true,
  });

  // 0.0.0.0 so the container is reachable from outside it.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
