import { DynamicModule, Global, Module } from '@nestjs/common';

import { DatabasePoolManager } from './database-pool.manager';
import {
  DATABASE_CONFIG,
  DATABASE_POOL_MANAGER,
} from './database-pool.di-token';
import { DatabasePoolBootstrap } from './database-pool.bootstrap';
import { DatabaseConfig } from './database-pool.types';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_POOL_MANAGER,
          useFactory: (configService: ConfigService) => {
            const config = configService.getOrThrow<DatabaseConfig>(
              DATABASE_CONFIG.toString(),
            );
            return new DatabasePoolManager(config);
          },
          inject: [ConfigService],
        },
        DatabasePoolBootstrap,
      ],
      exports: [DATABASE_POOL_MANAGER],
    };
  }
}
