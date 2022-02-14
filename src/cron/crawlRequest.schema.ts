import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v1 } from 'uuid';

export type PageAfterDocument = CrawlRequest & Document;

@Schema({ collection: 'crawlRequests' })
export class CrawlRequest {
  @Prop({ default: v1 })
  _id: string;

  @Prop()
  nextCursor: string;

  @Prop()
  isDone: boolean

  @Prop()
  repoUrl: string;

  @Prop()
  createdAt: Date;
}

export const CrawlRequestSchema = SchemaFactory.createForClass(CrawlRequest);
