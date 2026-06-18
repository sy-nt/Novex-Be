import { DatabaseModule } from '../database/database.module';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './health-check.service';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class HealthCheckModule {
  static forRoot(): DynamicModule {
    return {
      module: HealthCheckModule,
      controllers: [HealthCheckController],
      providers: [HealthCheckService],
      exports: [HealthCheckService],
    };
  }
}
