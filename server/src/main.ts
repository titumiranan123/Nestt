import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app.config.js';
import type { Express, NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService).values;
  if (config.TRUST_PROXY_HOPS > 0)
    (app.getHttpAdapter().getInstance() as Express).set(
      'trust proxy',
      config.TRUST_PROXY_HOPS,
    );
  app.use('/auth', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  if (config.SWAGGER_ENABLED) {
    const documentConfig = new DocumentBuilder()
      .setTitle('Nestt Furniture API')
      .setDescription('Authentication API and furniture commerce backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup('docs', app, document);
  }
  app.enableShutdownHooks();
  await app.listen(config.PORT);
}
await bootstrap();
