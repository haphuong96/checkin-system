import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DayStatus } from './check-in-histories.types';
import { GetCheckInStatusesDto } from './dto/get-check-in-statuses.dto';

@Injectable()
export class CheckInHistoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatuses(dto: GetCheckInStatusesDto): Promise<DayStatus[]> {
    const { userId } = dto;
    const now = new Date();
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [checkInPoints, checkInHistories] = await Promise.all([
      this.prisma.prisma.checkInPoint.findMany({ orderBy: { day: 'asc' } }),
      this.prisma.prisma.checkInHistory.findMany({
        where: { userId, date: { gte: startDate, lt: endDate } },
        orderBy: { date: 'asc' },
      }),
    ]);

    return checkInPoints.map((point, index) => ({
      day: point.day,
      pointsAdded: checkInHistories[index]?.score ?? point.pointsAdded,
      checkedIn: index < checkInHistories.length,
    }));
  }
}
