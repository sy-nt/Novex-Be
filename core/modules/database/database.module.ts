import { DynamicModule, Global, Module } from '@nestjs/common';

import { DatabasePoolManager } from './database-pool.manager';
import {
  DATABASE_CONFIG,
  DATABASE_POOL_MANAGER,
} from './database-pool.di-token';
import { DatabasePoolBootstrap } from './database-pool.bootstrap';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(config: {
    host: string;
    port: number;
    database: string;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_CONFIG,
          useValue: config,
        },
        {
          provide: DATABASE_POOL_MANAGER,
          useFactory: (config: {
            host: string;
            port: number;
            database: string;
          }) => {
            return new DatabasePoolManager(config);
          },
          inject: [DATABASE_CONFIG],
        },
        DatabasePoolBootstrap,
      ],
      exports: [DATABASE_POOL_MANAGER],
    };
  }
}
