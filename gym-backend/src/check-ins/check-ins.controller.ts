import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CheckInsService } from './check-ins.service';

class CreateCheckInDto {
  @IsString() personIdentifier: string; // member id / phone / GYM-0001 / day pass code
}

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
}