import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePageAfterDto } from './dto/create-pageAfter.dto';
import { PageAfter, PageAfterDocument } from './schemas/pageAfter.schema';

@Injectable()
export class PageAfterService {
  constructor(
    @InjectModel(PageAfter.name)
    private readonly pageAfterModel: Model<PageAfterDocument>,
  ) {}

  async create(params: CreatePageAfterDto) {
    this.pageAfterModel.create(params);
  }

  async findAll(): Promise<PageAfter[]> {
    return await this.pageAfterModel.find({});
  }
}
