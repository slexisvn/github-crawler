import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { CrawlRequestModule } from './crawlRequest/crawlRequest.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    CrawlRequestModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
