import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v1 } from 'uuid';

export type PageAfterDocument = PageAfter & Document;

@Schema({ collection: 'pageAfter' })
export class PageAfter {
  @Prop({ default: v1 })
  _id: string;

  @Prop()
  value: string;

  @Prop()
  hasNextPage: boolean;

  @Prop()
  repoUrl: string;

  @Prop()
  createdAt: number;
}

export const PageAfterSchema = SchemaFactory.createForClass(PageAfter);
