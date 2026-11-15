import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActor, AuditService } from '../audit/audit.service';
import { MembersService } from '../members/members.service';
import { addDays, fmt, todayDate } from '../common/date.util';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const SYSTEM: AuditActor = { id: null, name: 'System (auto cleanup)', role: 'SYSTEM' };

/**
 * Deletes members whose membership ended more than N days ago and was never renewed.
 * Never touches: frozen/suspended members, protected members, members with no package,
 * and anyone who checked in or bought a day pass in the last N days.
 */
@Injectable()
export class RetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetentionService.name);
  private readonly enabled: boolean;
  private readonly days: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private prisma: PrismaService,
    private members: MembersService,
    private audit: AuditService,
    config: ConfigService,
  ) {
    this.enabled = String(config.get('AUTO_DELETE_ENABLED') ?? 'true') !== 'false';
    this.days = Math.max(1, Number(config.get('AUTO_DELETE_AFTER_DAYS') ?? 7) || 7);
  }

  onModuleInit() {
    if (!this.enabled) return;
    setTimeout(() => void this.tick(), 30_000).unref(); // first run shortly after start-up
    this.timer = setInterval(() => void this.tick(), HOUR_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  settings() {
    return { enabled: this.enabled, days: this.days };
  }

  /** Everyone whose membership has ended and who is waiting for the deadline. */
  async pending() {
    const today = todayDate();
    const rows = await this.prisma.member.findMany({
      where: this.where(today),
      select: {
        id: true, memberNumber: true, firstName: true, lastName: true, phone: true, photoUrl: true,
        memberships: { orderBy: { endDate: 'desc' }, take: 1, select: { endDate: true, plan: { select: { name: true } } } },
      },
    });

    return rows
      .map((m) => {
        const last = m.memberships[0];
        const deleteOn = addDays(last.endDate, this.days + 1); // first day they qualify
        return {
          id: m.id,
          memberNumber: m.memberNumber,
          name: `${m.firstName} ${m.lastName}`,
          phone: m.phone,
          photoUrl: m.photoUrl,
          plan: last.plan.name,
          endedOn: last.endDate,
          deleteOn,
          daysLeft: Math.round((deleteOn.getTime() - today.getTime()) / DAY_MS),
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }

  /** Deletes everyone who is past the deadline. Safe to run repeatedly. */
  async purge(actor: AuditActor = SYSTEM) {
    if (!this.enabled || this.running) return { deleted: 0 };
    this.running = true;
    try {
      const today = todayDate();
      const due = await this.prisma.member.findMany({
        where: this.where(addDays(today, -this.days)),
        select: {
          id: true,
          memberNumber: true,
          memberships: { orderBy: { endDate: 'desc' }, take: 1, select: { endDate: true } },
        },
        take: 200,
      });

      let deleted = 0;
      for (const m of due) {
        await this.members.erase(m.id);
        deleted++;
        await this.audit.record({
          actor,
          action: 'member.auto_delete',
          summary: `Auto-deleted GYM-${String(m.memberNumber).padStart(4, '0')}: membership ended ${fmt(m.memberships[0].endDate)} and was not renewed within ${this.days} days`,
          entityType: 'Member',
          entityId: m.id,
        });
      }
      return { deleted };
    } finally {
      this.running = false;
    }
  }

  // ───── helpers ─────
  /** endedBefore = today lists everyone waiting; today - N days selects only those past the deadline. */
  private where(endedBefore: Date): Prisma.MemberWhereInput {
    const today = todayDate();
    return {
      archivedAt: null,
      deletedAt: null,
      autoDeleteExempt: false,
      memberships: {
        some: {},
        none: { OR: [{ status: { in: [MembershipStatus.FROZEN, MembershipStatus.SUSPENDED] } }, { endDate: { gte: endedBefore } }] },
      },
      checkIns: { none: { checkInTime: { gte: new Date(Date.now() - this.days * DAY_MS) } } },
      dayPasses: { none: { validDate: { gte: addDays(today, -this.days) } } },
    };
  }

  private async tick() {
    try {
      const { deleted } = await this.purge();
      if (deleted) this.logger.log(`Auto-deleted ${deleted} expired member(s)`);
    } catch (e) {
      this.logger.error('Automatic cleanup failed', e as Error);
    }
  }
}