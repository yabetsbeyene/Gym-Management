import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './plans.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) {}

  /** Everyone sees active plans; admins can pass ?all=true to include deactivated ones. */
  @Get()
  list(@Query('all') all: string | undefined, @Req() req: any) {
    return this.plans.list(all === 'true' && req.user.role === Role.ADMIN);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plans.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plans.update(id, dto);
  }
}