import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { SmsService } from './sms.service';

class SendSmsDto {
  @IsOptional() @IsString() memberId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @MaxLength(480) message: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms')
export class SmsController {
  constructor(private sms: SmsService) {}

  @Post('send')
  send(@Body() dto: SendSmsDto, @Req() req: any) {
    return this.sms.send(dto, req.user.id);
  }
}