import {
  Body,
  Controller,
  Get,
  Post,
  StreamableFile,
  Response,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUsers(@Body() createUserDto: CreateUserDto) {
    await this.userService.createUsers(createUserDto);
  }

  @Get()
  async exportCSVFile(@Response({ passthrough: true }) res): Promise<StreamableFile> {
    await this.userService.createCSVFile()
    const file = createReadStream(join(process.cwd(), 'files/users.csv'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="users.csv"',
    });
    return new StreamableFile(file);
  }
}
