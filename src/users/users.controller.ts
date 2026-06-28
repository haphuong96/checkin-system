import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../prisma/prisma.types';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.service.create(dto);
  }

  @Get(':id')
  getProfile(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.service.findOne(id);
  }
}
