import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { RetentionService } from './retention.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('retention')
export class RetentionController {
  constructor(private retention: RetentionService) {}

  /** Everyone can read the rule, so receptionists see the warnings and can renew in time. */
  @Get()
  settings() {
    return this.retention.settings();
  }

  @Roles(Role.ADMIN)
  @Get('pending')
  pending() {
    return this.retention.pending();
  }

  @Roles(Role.ADMIN)
  @Post('run')
  run(@Req() req: any) {
    return this.retention.purge({ id: req.user.id, name: req.user.name, role: req.user.role });
  }
}