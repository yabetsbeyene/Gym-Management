import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
  }
}