import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, todayDate, todayRange } from '../common/date.util';
import { OverviewRange } from './dashboard.dto';

const DAY_MS = 86_400_000;
const PERIOD_DAYS: Record<OverviewRange, number> = { today: 1, week: 7, month: 30 };
const TONE_ORDER = { warn: 0, good: 1, info: 2 } as const;

type Insight = { tone: keyof typeof TONE_ORDER; text: string };

const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const plural = (n: number) => (n === 1 ? '' : 's');

@Injectable()
export class DashboardService {
  private readonly capacity: number;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.capacity = Number(config.get('GYM_CAPACITY') ?? 300) || 300;
  }

  /** Simple counters (kept for API compatibility). */
  async stats() {
    const today = todayDate();
    const { start, end } = todayRange();

    const [activeMembers, frozen, suspended, expiringSoon, checkInsToday, dayPassesToday, totalMembers, deniedToday] =
      await this.prisma.$transaction([
        this.prisma.membership.count({
          where: { status: 'ACTIVE', startDate: { lte: today }, endDate: { gte: today } },
        }),
        this.prisma.membership.count({ where: { status: 'FROZEN' } }),
        this.prisma.membership.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.membership.count({
          where: { status: 'ACTIVE', endDate: { gte: today, lte: addDays(today, 7) } },
        }),
        this.prisma.checkIn.count({ where: { checkInTime: { gte: start, lt: end } } }),
        this.prisma.dayPass.count({ where: { validDate: today } }),
        this.prisma.member.count(),
        this.prisma.accessAttempt.count({ where: { allowed: false, createdAt: { gte: start, lt: end } } }),
      ]);

    return {
      totalMembers,
      activeMembers,
      frozen,
      suspended,
      expiringIn7Days: expiringSoon,
      checkInsToday,
      dayPassesToday,
      deniedToday,
    };
  }

  /** Everything the admin dashboard screen needs, in one request. */
  async overview(range: OverviewRange) {
    const today = todayDate();
    const { start: dayStart, end: dayEnd } = todayRange();
    const days = PERIOD_DAYS[range];
    const start = new Date(dayStart.getTime() - (days - 1) * DAY_MS); // period start
    const prevStart = new Date(start.getTime() - days * DAY_MS); // previous period of equal length
    const running = { status: 'ACTIVE' as const, startDate: { lte: today }, endDate: { gte: today } };

    const [
      revenue, prevRevenue, checkInsToday, periodCheckIns, totalMembers, newMembers,
      activeMembers, expiringSoon, deniedToday, plans, subscribers, recent,
    ] = await Promise.all([
      this.revenue(start, dayEnd),
      this.revenue(prevStart, start),
      this.prisma.checkIn.count({ where: { checkInTime: { gte: dayStart, lt: dayEnd } } }),
      this.prisma.checkIn.findMany({ where: { checkInTime: { gte: start, lt: dayEnd } }, select: { checkInTime: true } }),
      this.prisma.member.count({ where: { archivedAt: null } }),
      this.prisma.member.count({ where: { archivedAt: null, createdAt: { gte: start } } }),
      this.prisma.member.count({ where: { archivedAt: null, memberships: { some: running } } }),
      // expiring within 7 days and NOT already renewed (no membership starting later)
      this.prisma.member.count({
        where: {
          archivedAt: null,
          memberships: {
            some: { status: 'ACTIVE', endDate: { gte: today, lte: addDays(today, 7) } },
            none: { startDate: { gt: today } },
          },
        },
      }),
      this.prisma.accessAttempt.count({ where: { allowed: false, createdAt: { gte: dayStart, lt: dayEnd } } }),
      this.prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } }),
      this.prisma.membership.groupBy({ by: ['planId'], where: running, _count: { _all: true } }),
      this.prisma.checkIn.findMany({
        orderBy: { checkInTime: 'desc' },
        take: 8,
        include: {
          member: {
            select: {
              id: true, firstName: true, lastName: true, memberNumber: true, photoUrl: true,
              memberships: { orderBy: { endDate: 'desc' }, take: 1, select: { plan: { select: { name: true } } } },
            },
          },
          dayPass: {
            select: {
              code: true,
              visitor: { select: { fullName: true } },
              member: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    // Check-ins per hour of the day (server time zone), over the selected period
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    for (const { checkInTime } of periodCheckIns) hourly[checkInTime.getHours()].count++;
    const busiest = hourly.reduce((best, h) => (h.count > best.count ? h : best), hourly[0]);
    const peakHour = busiest.count > 0 ? busiest.hour : null;

    // Packages: active subscribers per plan
    const subs = new Map(subscribers.map((s) => [s.planId, s._count._all]));
    const totalSubs = plans.reduce((sum, p) => sum + (subs.get(p.id) ?? 0), 0);
    const breakdown = plans.map((p) => {
      const n = subs.get(p.id) ?? 0;
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        durationDays: p.durationDays,
        subscribers: n,
        share: totalSubs ? Math.round((n / totalSubs) * 100) : 0,
      };
    });
    const top = totalSubs ? breakdown.reduce((a, b) => (b.subscribers > a.subscribers ? b : a)) : null;

    const changePct =
      prevRevenue.total > 0 ? Math.round(((revenue.total - prevRevenue.total) / prevRevenue.total) * 1000) / 10 : null;
    const expiringCount = expiringSoon;

    return {
      range,
      revenue: {
        amount: revenue.total,
        previous: prevRevenue.total,
        changePct,
        memberships: revenue.memberships,
        dayPasses: revenue.dayPasses,
      },
      checkIns: { today: checkInsToday, capacity: this.capacity, peakHour },
      members: {
        total: totalMembers,
        newInRange: newMembers,
        active: activeMembers,
        activePct: totalMembers ? Math.round((activeMembers / totalMembers) * 100) : 0,
        expiringSoon: expiringCount,
      },
      packages: {
        activePlans: plans.length,
        top: top ? { name: top.name, share: top.share } : null,
        breakdown,
      },
      hourly,
      recent: recent.map((c) => {
        if (c.member) {
          return {
            id: c.id,
            time: c.checkInTime,
            type: c.type,
            memberId: c.member.id,
            name: `${c.member.firstName} ${c.member.lastName}`,
            photoUrl: c.member.photoUrl,
            code: `GYM-${String(c.member.memberNumber).padStart(4, '0')}`,
            plan: c.member.memberships[0]?.plan.name ?? 'No package',
          };
        }
        const pass = c.dayPass;
        return {
          id: c.id,
          time: c.checkInTime,
          type: c.type,
          memberId: null,
          name: pass?.visitor?.fullName ?? (pass?.member ? `${pass.member.firstName} ${pass.member.lastName}` : 'Day pass'),
          photoUrl: null,
          code: pass?.code ?? '-',
          plan: 'Day pass',
        };
      }),
      insights: this.insights({
        changePct,
        peakHour,
        peakCount: busiest.count,
        expiringSoon: expiringCount,
        deniedToday,
        checkInsToday,
      }),
    };
  }

  // ───── helpers ─────
  /** Estimated revenue = price of memberships created in the window + PAID day passes. */
  private async revenue(from: Date, to: Date) {
    const [memberships, passes] = await Promise.all([
      this.prisma.membership.findMany({
        where: { createdAt: { gte: from, lt: to } },
        select: { plan: { select: { price: true } } },
      }),
      this.prisma.dayPass.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: from, lt: to } },
        _sum: { price: true },
      }),
    ]);
    const sold = memberships.reduce((sum, m) => sum + Number(m.plan.price), 0);
    const dayPasses = Number(passes._sum.price ?? 0);
    return { memberships: sold, dayPasses, total: sold + dayPasses };
  }

  /** Plain rule-based advice computed from the numbers (no external AI, no API key). */
  private insights(d: {
    changePct: number | null;
    peakHour: number | null;
    peakCount: number;
    expiringSoon: number;
    deniedToday: number;
    checkInsToday: number;
  }): Insight[] {
    const out: Insight[] = [];

    if (d.changePct !== null) {
      out.push(
        d.changePct >= 0
          ? { tone: 'good', text: `Estimated revenue is up ${d.changePct}% compared with the previous period.` }
          : {
              tone: d.changePct <= -10 ? 'warn' : 'info',
              text: `Estimated revenue is down ${Math.abs(d.changePct)}% compared with the previous period.`,
            },
      );
    }
    if (d.expiringSoon > 0) {
      out.push({
        tone: 'warn',
        text: `${d.expiringSoon} membership${plural(d.expiringSoon)} expire${d.expiringSoon === 1 ? 's' : ''} within 7 days. Send renewal reminders before they lapse.`,
      });
    }
    if (d.checkInsToday >= this.capacity * 0.9) {
      out.push({ tone: 'warn', text: 'The gym is close to its capacity today. Consider limiting day passes at peak times.' });
    }
    if (d.peakHour !== null) {
      out.push({
        tone: 'info',
        text: `The busiest hour in this period is ${hourLabel(d.peakHour)} (${d.peakCount} check-ins). Quieter hours are a good time for promotions.`,
      });
    }
    if (d.deniedToday > 0) {
      out.push({
        tone: 'info',
        text: `${d.deniedToday} entr${d.deniedToday === 1 ? 'y was' : 'ies were'} denied today. Check the audit log for the reasons.`,
      });
    }
    if (!out.length) out.push({ tone: 'good', text: 'Everything looks healthy. No action needed right now.' });

    return out.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]).slice(0, 4);
  }
}