import { Module } from '@nestjs/common';
import { SeasonGroupService } from './season-group.service';
import { SeasonGroupController } from './season-group.controller';

@Module({
  providers: [SeasonGroupService],
  controllers: [SeasonGroupController],
  exports: [SeasonGroupService],
})
export class SeasonGroupModule {}
