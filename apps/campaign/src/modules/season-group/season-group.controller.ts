import { Controller, Get } from '@nestjs/common';
import { SeasonGroupService } from './season-group.service';

@Controller('season-group')
export class SeasonGroupController {
  constructor(private readonly seasonGroupService: SeasonGroupService) {}

  @Get()
  async getSeasonGroups() {
    return this.seasonGroupService.getSeasonGroups();
  }
}
