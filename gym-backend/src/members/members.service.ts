import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, toDateOnly, todayDate } from '../common/date.util';
import { CreateMemberDto, ListMembersQuery, UpdateStatusDto } from './members.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    const exists = await this.prisma.member.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('A member with this phone already exists');

    const { planId, startDate, dateOfBirth, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: { ...data, dateOfBirth: dateOfBirth ? toDateOnly(dateOfBirth) : undefined },
      });

      if (planId) {
        const plan = await tx.membershipPlan.findUnique({ where: { id: planId } });
        if (!plan || !plan.isActive) throw new BadRequestException('Invalid or inactive plan');
        const start = startDate ? toDateOnly(startDate) : todayDate();
        await tx.membership.create({
          data: { memberId: member.id, planId, startDate: start, endDate: addDays(start, plan.durationDays) },
        });
      }
      return tx.member.findUnique({
        where: { id: member.id },
        include: { memberships: { include: { plan: true }, orderBy: { endDate: 'desc' } } },
      });
    });
  }

  async findAll(q: ListMembersQuery) {
    const { search, status, page = 1, limit = 20 } = q;
    const where: Prisma.MemberWhereInput = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
      ...(status && { memberships: { some: { status } } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        include: { memberships: { orderBy: { endDate: 'desc' }, take: 1, include: { plan: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Changes the status of the member's most recent membership. */
  async updateStatus(memberId: string, dto: UpdateStatusDto) {
    const current = await this.prisma.membership.findFirst({
      where: { memberId },
      orderBy: { endDate: 'desc' },
    });
    if (!current) throw new NotFoundException('This member has no membership');

    const data: Prisma.MembershipUpdateInput = { status: dto.status, statusReason: dto.reason ?? null };

    if (dto.status === 'FROZEN' && current.status !== 'FROZEN') {
      data.frozenAt = new Date();
    }
    // Leaving FROZEN: push endDate forward by the number of days frozen
    if (current.status === 'FROZEN' && dto.status !== 'FROZEN' && current.frozenAt) {
      const frozenDays = Math.ceil((Date.now() - current.frozenAt.getTime()) / 86_400_000);
      data.endDate = addDays(current.endDate, frozenDays);
      data.frozenAt = null;
    }

    return this.prisma.membership.update({ where: { id: current.id }, data, include: { plan: true } });
  }
}