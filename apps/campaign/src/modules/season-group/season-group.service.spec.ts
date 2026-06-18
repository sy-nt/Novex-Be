import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE_POOL_MANAGER } from '@core/modules';
import { getLoggerToken } from 'nestjs-pino';
import { SeasonGroupService } from './season-group.service';

describe('SeasonGroupService', () => {
  let service: SeasonGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonGroupService,
        {
          provide: DATABASE_POOL_MANAGER,
          useValue: { pool: {} },
        },
        {
          provide: getLoggerToken(SeasonGroupService.name),
          useValue: { info: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SeasonGroupService>(SeasonGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
