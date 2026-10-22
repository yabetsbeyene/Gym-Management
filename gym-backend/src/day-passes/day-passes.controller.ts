import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { DayPassesService } from './day-passes.service';
import { CreateDayPassDto } from './day-passes.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('day-passes')
export class DayPassesController {
  constructor(private dayPasses: DayPassesService) {}

  @Post()
  create(@Body() dto: CreateDayPassDto, @Req() req: any) {
    return this.dayPasses.create(dto, req.user.id);
  }
}