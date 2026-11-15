import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { RetentionController } from './retention.controller';
import { RetentionService } from './retention.service';

@Module({ imports: [MembersModule], controllers: [RetentionController], providers: [RetentionService] })
export class RetentionModule {}