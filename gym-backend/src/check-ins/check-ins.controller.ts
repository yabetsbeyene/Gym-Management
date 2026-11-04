import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { CheckInsService } from './check-ins.service';
import { AttemptsQuery, CreateCheckInDto } from './check-ins.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('check-ins')
export class CheckInsController {
  constructor(private checkIns: CheckInsService) {}

  @Post()
  create(@Body() dto: CreateCheckInDto, @Req() req: any) {
    return this.checkIns.create(dto.personIdentifier, req.user.id);
  }

  @Get('today')
  today() {
    return this.checkIns.today();
  }

  @Roles(Role.ADMIN)
  @Get('attempts')
  attempts(@Query() query: AttemptsQuery) {
    return this.checkIns.attempts(query);
  }
}