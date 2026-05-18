import { Module } from '@nestjs/common';
import { hashicorpVaultConfig, databaseConfig, appConfig } from './configs';
import { HashicorpVaultModule, DatabaseModule } from '@core/modules';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { LoggerModule } from 'nestjs-pino';
import { loggerModuleParams } from '@app/libs/logger';
import { ExceptionInterceptor } from '@core/application/interceptors/exception.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ContextInterceptor } from '@core/application/context/ContextInterceptor';
import { RequestContextModule } from 'nestjs-request-context';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), 'apps/catalog/.env'),
      ],
      load: [appConfig, hashicorpVaultConfig, databaseConfig],
    }),
    RequestContextModule,
    HashicorpVaultModule.forRoot(),
    DatabaseModule.forRoot(),
    LoggerModule.forRootAsync(loggerModuleParams),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor,
    },
  ],
})
export class AppModule {}
