import { Test, TestingModule } from '@nestjs/testing';
import { SeasonGroupController } from './season-group.controller';
import { SeasonGroupService } from './season-group.service';

describe('SeasonGroupController', () => {
  let controller: SeasonGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonGroupController],
      providers: [
        {
          provide: SeasonGroupService,
          useValue: { getSeasonGroups: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<SeasonGroupController>(SeasonGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
