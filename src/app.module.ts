import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { CheckInHistoriesModule } from './check-in-histories/check-in-histories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    UsersModule,
    CheckInHistoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
