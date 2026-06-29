import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CheckInDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;
}
