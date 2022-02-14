import {
  Body,
  Controller,
  Get,
  Post,
  StreamableFile,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateRequestDto } from './dto/create-user.dto';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const status = await this.userService.createRequest(createRequestDto);

    if (status === HttpStatus.OK) {
      res.status(HttpStatus.OK).json({
        status: 'OK',
        message: 'Success',
      });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: 'BAD REQUEST',
        message: 'Already exists',
      });
    }
  }

  @Get()
  async exportCSVFile(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.userService.createCSVFile();
    const file = createReadStream(join(process.cwd(), 'files/users.csv'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="users.csv"',
    });
    return new StreamableFile(file);
  }
}
