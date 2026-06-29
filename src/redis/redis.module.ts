import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import Redlock, { CompatibleRedisClient } from 'redlock';
import { REDIS_CLIENT, REDLOCK } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL')),
      inject: [ConfigService],
    },
    {
      provide: REDLOCK,
      useFactory: (client: Redis) =>
        new Redlock([client as unknown as CompatibleRedisClient], {
          retryCount: 0,
          retryDelay: 0,
        }),
      inject: [REDIS_CLIENT],
    },
  ],
  exports: [REDIS_CLIENT, REDLOCK],
})
export class RedisModule {}
