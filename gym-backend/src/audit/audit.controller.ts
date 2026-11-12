import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { AuditService } from './audit.service';
import { AuditQuery } from './audit.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  list(@Query() query: AuditQuery) {
    return this.audit.list(query);
  }

  @Get('actors')
  actors() {
    return this.audit.actors();
  }
}