import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetCheckInHistoriesDto } from './dto/get-check-in-histories.dto';
import { CheckInHistoryItem, Paginated } from './check-in-histories.types';

@Injectable()
export class CheckInHistoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistories(
    dto: GetCheckInHistoriesDto,
  ): Promise<Paginated<CheckInHistoryItem>> {
    const { userId, page, limit } = dto;
    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      this.prisma.prisma.checkInHistory.count({ where: { userId } }),
      this.prisma.prisma.checkInHistory.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        score: r.score,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
