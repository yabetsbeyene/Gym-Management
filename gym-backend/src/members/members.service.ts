import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, membershipEnd, toDateOnly, todayDate } from '../common/date.util';
import { CreateMemberDto, ListMembersQuery, RenewMembershipDto, UpdateStatusDto } from './members.dto';

const WITH_PLAN = { plan: true } as const;

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // ───── create / read ─────
  async create(dto: CreateMemberDto) {
    const exists = await this.prisma.member.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('A member with this phone already exists');

    const { planId, startDate, dateOfBirth, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: { ...data, dateOfBirth: dateOfBirth ? toDateOnly(dateOfBirth) : undefined },
      });

      if (planId) {
        const plan = await this.requireActivePlan(tx, planId);
        const start = startDate ? toDateOnly(startDate) : todayDate();
        await tx.membership.create({
          data: { memberId: member.id, planId, startDate: start, endDate: membershipEnd(start, plan.durationDays) },
        });
      }
      return tx.member.findUnique({
        where: { id: member.id },
        include: { memberships: { include: WITH_PLAN, orderBy: { endDate: 'desc' } } },
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
        include: { memberships: { orderBy: { endDate: 'desc' }, take: 1, include: WITH_PLAN } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        memberships: { include: WITH_PLAN, orderBy: { endDate: 'desc' } },
        checkIns: { orderBy: { checkInTime: 'desc' }, take: 10 },
      },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  // ───── renewal ─────
  /**
   * Adds a new membership. If the current one is still running, the new one starts the day
   * after it ends (no lost days). Otherwise it starts today. Frozen/suspended members must be
   * activated first so renewing can't silently bypass staff decisions.
   */
  async renew(memberId: string, dto: RenewMembershipDto) {
    await this.findOne(memberId);
    const plan = await this.requireActivePlan(this.prisma, dto.planId);
    const latest = await this.prisma.membership.findFirst({ where: { memberId }, orderBy: { endDate: 'desc' } });

    if (latest && (latest.status === 'SUSPENDED' || latest.status === 'FROZEN')) {
      throw new ConflictException(`Membership is ${latest.status.toLowerCase()}. Activate it before renewing.`);
    }

    const today = todayDate();
    const stacks = latest?.status === 'ACTIVE' && latest.endDate >= today;
    const start = dto.startDate ? toDateOnly(dto.startDate) : stacks ? addDays(latest!.endDate, 1) : today;

    return this.prisma.membership.create({
      data: { memberId, planId: plan.id, startDate: start, endDate: membershipEnd(start, plan.durationDays) },
      include: WITH_PLAN,
    });
  }

  // ───── status (freeze / suspend / activate) ─────
  /** Applies to the membership running today, falling back to the most recent one. */
  async updateStatus(memberId: string, dto: UpdateStatusDto) {
    const current = await this.currentMembership(memberId);
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

    return this.prisma.membership.update({ where: { id: current.id }, data, include: WITH_PLAN });
  }

  // ───── helpers ─────
  private async requireActivePlan(db: Prisma.TransactionClient, planId: string) {
    const plan = await db.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan?.isActive) throw new BadRequestException('Invalid or inactive plan');
    return plan;
  }

  private async currentMembership(memberId: string) {
    const today = todayDate();
    return (
      (await this.prisma.membership.findFirst({
        where: { memberId, startDate: { lte: today }, endDate: { gte: today } },
        orderBy: { endDate: 'desc' },
      })) ?? this.prisma.membership.findFirst({ where: { memberId }, orderBy: { endDate: 'desc' } })
    );
  }
}