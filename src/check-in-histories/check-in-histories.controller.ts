import { Controller, Get, Query } from '@nestjs/common';
import { CheckInHistoriesService } from './check-in-histories.service';
import { GetCheckInStatusesDto } from './dto/get-check-in-statuses.dto';
import { DayStatus } from './check-in-histories.types';

@Controller('check-in-histories')
export class CheckInHistoriesController {
  constructor(private readonly service: CheckInHistoriesService) {}

  @Get('statuses')
  getStatuses(@Query() dto: GetCheckInStatusesDto): Promise<DayStatus[]> {
    return this.service.getStatuses(dto);
  }
}
