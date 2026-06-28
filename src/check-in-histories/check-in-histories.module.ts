import { Module } from '@nestjs/common';
import { CheckInHistoriesController } from './check-in-histories.controller';
import { CheckInHistoriesService } from './check-in-histories.service';

@Module({
  controllers: [CheckInHistoriesController],
  providers: [CheckInHistoriesService],
})
export class CheckInHistoriesModule {}
