import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CheckInDto } from './dto/check-in.dto';
import { GetCheckInStatusesDto } from './dto/get-check-in-statuses.dto';
import { CheckInResult, DayStatus } from './check-in.types';

@Controller('check-in')
export class CheckInController {
  constructor(private readonly service: CheckInService) {}

  @Get('statuses')
  getStatuses(@Query() dto: GetCheckInStatusesDto): Promise<DayStatus[]> {
    return this.service.getStatuses(dto);
  }

  @Post()
  checkIn(@Body() dto: CheckInDto): Promise<CheckInResult> {
    return this.service.checkIn(dto);
  }
}
