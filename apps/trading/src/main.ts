import tracing from '@app/libs/telemetry/tracing';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { setupSwagger } from '@app/libs';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { firstLetterToUpperCase } from '@core';

tracing('trading');

function configureGlobalPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      validateCustomDecorators: true,
      validationError: {
        target: true,
        value: true,
      },
    }),
  );
}

async function bootstrap() {
  const { AppModule } = await import('./app.module.js');
  const { Logger } = await import('nestjs-pino');

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const serviceName: string = configService.getOrThrow(
    'application.serviceName',
  );

  configureGlobalPipes(app);
  const logger = app.get(Logger);

  app.use(compression());
  app.use(helmet({}));
  app.useLogger(logger);

  setupSwagger(app, {
    path: serviceName,
    title: `${firstLetterToUpperCase(serviceName)} Service`,
    description: `${firstLetterToUpperCase(serviceName)} Service API Documentation`,
    version: configService.getOrThrow('application.version'),
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>('application.port');
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
