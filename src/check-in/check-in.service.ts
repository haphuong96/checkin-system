import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { LockError } from 'redlock';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT, REDLOCK } from '../redis/redis.constants';
import { CheckInDto } from './dto/check-in.dto';
import { GetCheckInStatusesDto } from './dto/get-check-in-statuses.dto';
import { CHECK_IN_DAY_CODES, CheckInResult, DayStatus } from './check-in.types';

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

// Redis key that marks a user as checked-in for a given VN date.
function checkinKey(userId: number, dateStr: string): string {
  return `checkin:done:${userId}:${dateStr}`;
}

// TTL in seconds until VN midnight (00:00:00 next day) — key expires exactly at 12:00 AM VN.
function secondsUntilVnMidnight(vnNow: Date): number {
  const elapsed =
    vnNow.getUTCHours() * 3600 +
    vnNow.getUTCMinutes() * 60 +
    vnNow.getUTCSeconds();
  return Math.max(1, 86400 - elapsed);
}

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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

    if (!((hourVN >= 9 && hourVN < 11) || (hourVN >= 19 && hourVN < 22))) {
      throw new BadRequestException(
        'Check-in is only allowed between 09:00–11:00 and 19:00–22:00 (Vietnam time)',
      );
    }

    const lock = await this.redlock
      .lock(`checkin:lock:${userId}`, LOCK_TTL_MS)
      .catch((err: unknown) => {
        if (err instanceof LockError) {
          throw new ConflictException(
            'Check-in already in progress for this user',
          );
        }
        throw err; // Redis down or other infra error — let NestJS return 500
      });

    try {
      const vnYear = vnNow.getUTCFullYear();
      const vnMonth = vnNow.getUTCMonth();
      const vnDay = vnNow.getUTCDate();
      const dateStr = vnDateString(vnNow);

      // Step 4: fast Redis check — avoids a Postgres round-trip on duplicate attempts.
      const alreadyInRedis = await this.redis.get(checkinKey(userId, dateStr));
      if (alreadyInRedis) {
        throw new UnprocessableEntityException('Already checked in today');
      }

      const startOfMonth = new Date(Date.UTC(vnYear, vnMonth, 1));
      const startOfNextMonth = new Date(Date.UTC(vnYear, vnMonth + 1, 1));
      const todayDate = new Date(Date.UTC(vnYear, vnMonth, vnDay));

      // Fetch user validity and monthly streak count in parallel.
      const [user, monthlyCount] = await Promise.all([
        this.prisma.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.prisma.checkInHistory.count({
          where: { userId, date: { gte: startOfMonth, lt: startOfNextMonth } },
        }),
      ]);

      if (!user) throw new NotFoundException(`User ${userId} not found`);
      if (monthlyCount >= 7)
        throw new BadRequestException(
          'Monthly check-in limit of 7 days reached',
        );

      const dayCode = CHECK_IN_DAY_CODES[monthlyCount];
      const checkInPoint = await this.prisma.prisma.checkInPoint.findUnique({
        where: { day: dayCode },
      });
      const pointsEarned = checkInPoint?.pointsAdded ?? 1;
      const dayNumber = monthlyCount + 1;

      // Steps 5–8: atomic — either both writes succeed or neither does.
      // The DB unique constraint on (userId, date) is a safety net if Redis misses.
      const [, updatedUser] = await this.prisma.prisma.$transaction([
        this.prisma.prisma.checkInHistory.create({
          data: { userId, date: todayDate, score: pointsEarned },
        }),
        this.prisma.prisma.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: pointsEarned } },
        }),
      ]);

      // Step 9: stamp Redis so subsequent attempts short-circuit at step 4.
      await this.redis.set(
        checkinKey(userId, dateStr),
        '1',
        'EX',
        secondsUntilVnMidnight(vnNow),
      );

      return {
        date: dateStr,
        dayNumber,
        pointsEarned,
        totalPoints: updatedUser.totalPoints,
      };
    } finally {
      // Step 10: always release the lock, success or error.
      await lock.unlock().catch(() => undefined);
    }
  }
}
