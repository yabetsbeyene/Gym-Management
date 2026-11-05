import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './plans.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  list(includeInactive: boolean) {
    return this.prisma.membershipPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }],
    });
  }

  create(dto: CreatePlanDto) {
    return this.prisma.membershipPlan.create({ data: dto });
  }

  async update(id: string, dto: UpdatePlanDto) {
    const found = await this.prisma.membershipPlan.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Plan not found');
    return this.prisma.membershipPlan.update({ where: { id }, data: dto });
  }
}