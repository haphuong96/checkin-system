import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../prisma/prisma.types';
import { PrismaErrorCode } from '../prisma/prisma.constants';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<User> {
    return this.prisma.prisma.user.create({
      data: { name: dto.name },
    });
  }

  async findOne(id: number): Promise<User> {
    try {
      return await this.prisma.prisma.user.findUniqueOrThrow({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.P2025_RECORD_NOT_FOUND
      ) {
        throw new NotFoundException(`User #${id} not found`);
      }
      throw e;
    }
  }
}
