import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v1 } from 'uuid';

export type CrawlRequestDocument = CrawlRequest & Document;

@Schema({ collection: 'crawlRequest' })
export class CrawlRequest {
  @Prop({ default: v1 })
  _id: string;

  @Prop()
  endCursors: string[];

  @Prop()
  isDone: boolean;

  @Prop()
  repoUrl: string;

  @Prop()
  createdAt: number;
}

export const CrawlRequestSchema = SchemaFactory.createForClass(CrawlRequest);
