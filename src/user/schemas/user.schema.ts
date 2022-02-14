import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v1 } from 'uuid';

export type UserDocument = User & Document;

@Schema({ collection: 'user' })
export class User {
  @Prop({ default: v1 })
  _id: string;

  @Prop()
  login: string;

  @Prop()
  repoUrl: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  location: string;

  @Prop()
  email: string;

  @Prop()
  profileLink: string;

  @Prop()
  repos: number;

  @Prop()
  followers: number;

  @Prop()
  activityLevel: number;

  @Prop()
  openToNewOpportunities: boolean;

  @Prop()
  activeInOpenSource: boolean;

  @Prop()
  languages: string[];

  @Prop()
  miscKeywords: string[];

  @Prop()
  createdAt: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
