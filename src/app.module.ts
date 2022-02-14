import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { PageAfterModule } from './pageAfter/pageAfter.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    PageAfterModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
