import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCrawlRequestDto } from './dto/create-crawlRequest.dto';
import { CrawlRequest, CrawlRequestDocument } from './schemas/crawlRequest.schema';

@Injectable()
export class CrawlRequestService {
  constructor(
    @InjectModel(CrawlRequest.name)
    private readonly crawlRequestModel: Model<CrawlRequestDocument>,
  ) {}

  async create(params: CreateCrawlRequestDto) {
    this.crawlRequestModel.create(params);
  }
}
