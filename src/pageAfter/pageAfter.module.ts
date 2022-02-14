import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PageAfterService } from './pageAfter.service';
import { PageAfter, PageAfterSchema } from './schemas/pageAfter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageAfter.name, schema: PageAfterSchema },
    ]),
  ],
  providers: [PageAfterService],
})
export class PageAfterModule {}
