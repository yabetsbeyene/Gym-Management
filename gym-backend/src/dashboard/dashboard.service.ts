import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, todayDate, todayRange } from '../common/date.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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
}