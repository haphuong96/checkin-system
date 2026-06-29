import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Redlock from 'redlock';
import { PrismaService } from '../prisma/prisma.service';
import { REDLOCK } from '../redis/redis.constants';
import { CheckInDto } from './dto/check-in.dto';
import { GetCheckInStatusesDto } from './dto/get-check-in-statuses.dto';
import { CheckInResult, DayStatus } from './check-in-histories.types';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const LOCK_TTL_MS = 5_000;

function toVnDate(utcMs: number): Date {
  return new Date(utcMs + VN_OFFSET_MS);
}

function vnDateString(vnDate: Date): string {
  const y = vnDate.getUTCFullYear();
  const m = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(vnDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class CheckInHistoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDLOCK) private readonly redlock: Redlock,
  ) {}

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

  async checkIn(dto: CheckInDto): Promise<CheckInResult> {
    const { userId } = dto;
    const nowMs = Date.now();
    const vnNow = toVnDate(nowMs);
    const hourVN = vnNow.getUTCHours();

    if (!((hourVN >= 9 && hourVN < 11) || (hourVN >= 19 && hourVN < 21))) {
      throw new BadRequestException(
        'Check-in is only allowed between 09:00–11:00 and 19:00–21:00 (Vietnam time)',
      );
    }

    const lock = await this.redlock
      .lock(`checkin:lock:${userId}`, LOCK_TTL_MS)
      .catch(() => {
        throw new ConflictException(
          'Check-in already in progress for this user',
        );
      });

    try {
      const vnYear = vnNow.getUTCFullYear();
      const vnMonth = vnNow.getUTCMonth();
      const vnDay = vnNow.getUTCDate();

      const startOfMonth = new Date(Date.UTC(vnYear, vnMonth, 1));
      const startOfNextMonth = new Date(Date.UTC(vnYear, vnMonth + 1, 1));
      const todayDate = new Date(Date.UTC(vnYear, vnMonth, vnDay));

      const [user, monthlyCount, alreadyToday] = await Promise.all([
        this.prisma.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.prisma.checkInHistory.count({
          where: { userId, date: { gte: startOfMonth, lt: startOfNextMonth } },
        }),
        this.prisma.prisma.checkInHistory.findUnique({
          where: { userId_date: { userId, date: todayDate } },
        }),
      ]);

      if (!user) throw new NotFoundException(`User ${userId} not found`);
      if (alreadyToday)
        throw new BadRequestException('Already checked in today');
      if (monthlyCount >= 7)
        throw new BadRequestException(
          'Monthly check-in limit of 7 days reached',
        );

      const checkInPoints = await this.prisma.prisma.checkInPoint.findMany({
        orderBy: { day: 'asc' },
      });
      const pointsEarned = checkInPoints[monthlyCount]?.pointsAdded ?? 1;
      const dayNumber = monthlyCount + 1;

      const [, updatedUser] = await this.prisma.prisma.$transaction([
        this.prisma.prisma.checkInHistory.create({
          data: { userId, date: todayDate, score: pointsEarned },
        }),
        this.prisma.prisma.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: pointsEarned } },
        }),
      ]);

      return {
        date: vnDateString(vnNow),
        dayNumber,
        pointsEarned,
        totalPoints: updatedUser.totalPoints,
      };
    } finally {
      await lock.unlock().catch(() => undefined);
    }
  }
}
