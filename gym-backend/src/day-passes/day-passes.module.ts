import { Module } from '@nestjs/common';
import { DayPassesController } from './day-passes.controller';
import { DayPassesService } from './day-passes.service';

@Module({ controllers: [DayPassesController], providers: [DayPassesService] })
export class DayPassesModule {}