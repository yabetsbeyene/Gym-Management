import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EligibilityService } from '../eligibility/eligibility.service';
import { todayRange } from '../common/date.util';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService, private eligibility: EligibilityService) {}

  /** Returns the eligibility result. A CheckIn row is only created when allowed. */
  async create(personIdentifier: string, userId: string) {
    const result = await this.eligibility.checkEligibility(personIdentifier);
    if (!result.allowed) return { ...result, checkIn: null };

    const viaDayPass = result.grantedBy === 'DAY_PASS';
    const checkIn = await this.prisma.checkIn.create({
      data: {
        type: viaDayPass ? 'DAY_PASS' : 'MEMBER',
        memberId: viaDayPass ? null : result.person!.id,
        dayPassId: viaDayPass ? result.dayPassId : null,
        checkedInById: userId,
      },
    });
    return { ...result, checkIn };
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
}