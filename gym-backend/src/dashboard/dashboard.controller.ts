import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { DashboardService } from './dashboard.service';
import { OverviewQuery } from './dashboard.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Roles(Role.ADMIN)
  @Get('stats')
  stats() {
    return this.dashboard.stats();
  }

  @Roles(Role.ADMIN)
  @Get('overview')
  overview(@Query() query: OverviewQuery) {
    return this.dashboard.overview(query.range ?? 'week');
  }
}