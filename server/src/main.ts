import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app.config.js';
import { json } from 'express';
import type { Express, NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService).values;
  const express = app.getHttpAdapter().getInstance() as Express;
  // SEO file uploads need room for JSON escaping and multibyte text.
  express.put(['/admin/seo/robots', '/admin/seo/sitemap'], json({ limit: '8mb' }));
  express.put('/admin/general-settings', json({ limit: '3mb' }));
  if (config.TRUST_PROXY_HOPS > 0)
    express.set('trust proxy', config.TRUST_PROXY_HOPS);
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
