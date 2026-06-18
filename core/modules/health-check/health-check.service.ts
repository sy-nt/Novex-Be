import { Inject } from '@nestjs/common';
import { DATABASE_POOL_MANAGER } from '../database/database-pool.di-token';
import { DatabasePoolManager } from '../database/database-pool.manager';
import { ConfigService } from '@nestjs/config';

export class HealthCheckService {
  constructor(
    @Inject(DATABASE_POOL_MANAGER)
    private readonly databasePoolManager: DatabasePoolManager,
    private readonly configService: ConfigService,
  ) {}

  async check() {
    const { state } = this.databasePoolManager.pool.state();
    const serviceName = this.configService.getOrThrow<string>(
      'application.serviceName',
    );
    const serviceVersion = this.configService.getOrThrow<string>(
      'application.version',
    );
    const deploymentEnvironment = this.configService.getOrThrow<string>(
      'application.deploymentEnvironment',
    );
    const status = {
      database: state,
      service: {
        name: serviceName,
        version: serviceVersion,
        deploymentEnvironment: deploymentEnvironment,
      },
    };
    return status;
  }
}
