import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EligibilityResult, EligibilityService } from '../eligibility/eligibility.service';
import { todayRange } from '../common/date.util';
import { AttemptsQuery } from './check-ins.dto';

type Db = Prisma.TransactionClient;

@Injectable()
export class CheckInsService {
  private readonly cooldownMs: number;

  constructor(
    private prisma: PrismaService,
    private eligibility: EligibilityService,
    config: ConfigService,
  ) {
    this.cooldownMs = Number(config.get('CHECKIN_COOLDOWN_MINUTES') ?? 60) * 60_000;
  }

  /**
   * Eligibility → duplicate guard → CheckIn row. Every outcome is logged as an AccessAttempt.
   * A repeat within the cooldown is still "allowed", but creates no new CheckIn.
   */
  async create(identifier: string, userId: string) {
    const result = await this.eligibility.checkEligibility(identifier);

    if (!result.allowed) {
      await this.log(this.prisma, { identifier, userId, result });
      return { ...result, duplicate: false, checkIn: null };
    }

    const subject = this.subjectOf(result);
    const lockKey = `checkin:${subject.memberId ?? subject.dayPassId}`;

    return this.prisma.$transaction(async (tx) => {
      // Serialise concurrent scans of the same person so two taps can't both pass the guard.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}::text))`;

      const recent = await tx.checkIn.findFirst({
        where: { ...subject, checkInTime: { gte: new Date(Date.now() - this.cooldownMs) } },
        orderBy: { checkInTime: 'desc' },
      });

      if (recent) {
        const reason = 'Already checked in recently';
        await this.log(tx, { identifier, userId, result, duplicate: true, reason });
        return { ...result, reason, duplicate: true, checkIn: recent };
      }

      const checkIn = await tx.checkIn.create({ data: { ...subject, checkedInById: userId } });
      await this.log(tx, { identifier, userId, result });
      return { ...result, duplicate: false, checkIn };
    });
  }

  today() {
    const { start, end } = todayRange();
    return this.prisma.checkIn.findMany({
      where: { checkInTime: { gte: start, lt: end } },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true } },
        dayPass: { include: { visitor: true } },
      },
      orderBy: { checkInTime: 'desc' },
    });
  }

  attempts({ allowed, limit = 50 }: AttemptsQuery) {
    return this.prisma.accessAttempt.findMany({
      where: allowed === undefined ? {} : { allowed: allowed === 'true' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, memberNumber: true } },
        dayPass: { include: { visitor: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ───── helpers ─────
  private subjectOf(r: EligibilityResult) {
    return r.grantedBy === 'DAY_PASS'
      ? { type: 'DAY_PASS' as const, memberId: null, dayPassId: r.dayPassId! }
      : { type: 'MEMBER' as const, memberId: r.person!.id as string, dayPassId: null };
  }

  private log(
    db: Db,
    a: { identifier: string; userId: string; result: EligibilityResult; duplicate?: boolean; reason?: string },
  ) {
    const { result } = a;
    return db.accessAttempt.create({
      data: {
        identifier: a.identifier,
        allowed: result.allowed,
        duplicate: a.duplicate ?? false,
        reason: a.reason ?? result.reason,
        memberId: result.person?.kind === 'MEMBER' ? result.person.id : null,
        dayPassId: result.dayPassId ?? null,
        createdById: a.userId,
      },
    });
  }
}