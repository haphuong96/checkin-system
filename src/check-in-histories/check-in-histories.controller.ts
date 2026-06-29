import { Controller, Get, Query } from '@nestjs/common';
import { CheckInHistoriesService } from './check-in-histories.service';
import { GetCheckInHistoriesDto } from './dto/get-check-in-histories.dto';
import { CheckInHistoryItem, Paginated } from './check-in-histories.types';

@Controller('check-in-histories')
export class CheckInHistoriesController {
  constructor(private readonly service: CheckInHistoriesService) {}

  @Get()
  getHistories(
    @Query() dto: GetCheckInHistoriesDto,
  ): Promise<Paginated<CheckInHistoryItem>> {
    return this.service.getHistories(dto);
  }
}
