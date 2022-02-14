import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlRequestService } from './crawlRequest.service';
import { CrawlRequest, CrawlRequestSchema } from './schemas/crawlRequest.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CrawlRequest.name, schema: CrawlRequestSchema },
    ]),
  ],
  providers: [CrawlRequestService],
})
export class CrawlRequestModule {}
