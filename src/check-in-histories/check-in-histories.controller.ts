import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CheckInHistoriesService } from './check-in-histories.service';
import { CheckInDto } from './dto/check-in.dto';
import { GetCheckInStatusesDto } from './dto/get-check-in-statuses.dto';
import { CheckInResult, DayStatus } from './check-in-histories.types';

@Controller('check-in-histories')
export class CheckInHistoriesController {
  constructor(private readonly service: CheckInHistoriesService) {}

  @Get('statuses')
  getStatuses(@Query() dto: GetCheckInStatusesDto): Promise<DayStatus[]> {
    return this.service.getStatuses(dto);
  }

  @Post()
  checkIn(@Body() dto: CheckInDto): Promise<CheckInResult> {
    return this.service.checkIn(dto);
  }
}
