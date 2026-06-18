import { DATABASE_POOL_MANAGER, DatabasePoolManager } from '@core/modules';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class SeasonGroupService {
  constructor(
    @Inject(DATABASE_POOL_MANAGER)
    private readonly databasePoolManager: DatabasePoolManager,
    @InjectPinoLogger(SeasonGroupService.name)
    private readonly logger: PinoLogger,
  ) {}

  async getSeasonGroups() {
    this.logger.info('Getting season groups');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [];
  }
}
