import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fmt, todayDate } from '../common/date.util';

export type EligibilityResult = {
  allowed: boolean;
  reason: string;
  person: Record<string, any> | null;
  grantedBy: 'MEMBERSHIP' | 'DAY_PASS' | null;
  dayPassId?: string;
};

@Injectable()
export class EligibilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * personIdentifier can be: member id, phone number, member code (GYM-0001),
   * day pass id, or day pass code.
   */
  async checkEligibility(personIdentifier: string): Promise<EligibilityResult> {
    const identifier = personIdentifier.trim();
    const today = todayDate();

    const member = await this.findMember(identifier);
    if (member) return this.checkMember(member, today);

    const pass = await this.findDayPass(identifier);
    if (pass) return this.checkDayPass(pass, today);

    return {
      allowed: false,
      reason: 'No member or day pass found for this identifier',
      person: null,
      grantedBy: null,
    };
  }

  // ───── lookups ─────
  private async findMember(identifier: string) {
    const phone = identifier.replace(/\s+/g, '');
    const codeMatch = /^GYM-?(\d+)$/i.exec(identifier);
    const or: any[] = [{ id: identifier }, { phone }];
    if (codeMatch) or.push({ memberNumber: parseInt(codeMatch[1], 10) });

    return this.prisma.member.findFirst({
      where: { OR: or },
      include: { memberships: { orderBy: { endDate: 'desc' } } },
    });
  }

  private findDayPass(identifier: string) {
    return this.prisma.dayPass.findFirst({
      where: { OR: [{ id: identifier }, { code: identifier.toUpperCase() }] },
      include: { visitor: true, member: true },
    });
  }

  // ───── member path ─────
  private async checkMember(member: any, today: Date): Promise<EligibilityResult> {
    const person = { kind: 'MEMBER', ...member, memberships: undefined };

    // 1. Active membership covering today
    const active = member.memberships.find(
      (m: any) => m.status === 'ACTIVE' && m.startDate <= today && m.endDate >= today,
    );
    if (active) {
      return { allowed: true, reason: 'Active membership', person, grantedBy: 'MEMBERSHIP' };
    }

    // 2. OR a valid day pass for today
    const todaysPasses = await this.prisma.dayPass.findMany({
      where: { memberId: member.id, validDate: today },
    });
    const validPass = todaysPasses.find((p) => p.paymentStatus === 'PAID' && p.waiverSigned);
    if (validPass) {
      return {
        allowed: true,
        reason: 'Valid day pass for today',
        person,
        grantedBy: 'DAY_PASS',
        dayPassId: validPass.id,
      };
    }

    // 3. Denied: explain why
    return { allowed: false, reason: this.denyReason(member.memberships, todaysPasses, today), person, grantedBy: null };
  }

  private denyReason(memberships: any[], todaysPasses: any[], today: Date): string {
    if (todaysPasses.length) {
      const p = todaysPasses[0];
      if (p.paymentStatus !== 'PAID') return 'Day pass payment is not completed';
      if (!p.waiverSigned) return 'Day pass waiver has not been signed';
    }
    const latest = memberships[0]; // ordered by endDate desc
    if (!latest) return 'No membership on record';

    switch (latest.status) {
      case 'FROZEN':
        return 'Membership is frozen';
      case 'SUSPENDED':
        return `Membership is suspended${latest.statusReason ? `: ${latest.statusReason}` : ''}`;
      case 'EXPIRED':
        return `Membership expired on ${fmt(latest.endDate)}`;
      case 'ACTIVE':
        if (latest.startDate > today) return `Membership starts on ${fmt(latest.startDate)}`;
        return `Membership expired on ${fmt(latest.endDate)}`; // ACTIVE but past endDate
      default:
        return 'No valid membership';
    }
  }

  // ───── day pass path ─────
  private checkDayPass(pass: any, today: Date): EligibilityResult {
    const person = {
      kind: 'DAY_PASS',
      id: pass.id,
      code: pass.code,
      fullName: pass.visitor?.fullName ?? `${pass.member?.firstName} ${pass.member?.lastName}`,
      phone: pass.visitor?.phone ?? pass.member?.phone ?? null,
      validDate: pass.validDate,
    };
    const base = { person, grantedBy: null as null, dayPassId: pass.id };

    if (fmt(pass.validDate) !== fmt(today)) {
      return { ...base, allowed: false, reason: `Day pass is valid for ${fmt(pass.validDate)}, not today` };
    }
    if (pass.paymentStatus !== 'PAID') {
      return { ...base, allowed: false, reason: 'Day pass payment is not completed' };
    }
    if (!pass.waiverSigned) {
      return { ...base, allowed: false, reason: 'Waiver has not been signed' };
    }
    return { ...base, allowed: true, reason: 'Valid day pass for today', grantedBy: 'DAY_PASS' };
  }
}