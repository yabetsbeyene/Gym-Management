import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { toDateOnly, todayDate } from '../common/date.util';
import { CreateDayPassDto } from './day-passes.dto';

@Injectable()
export class DayPassesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDayPassDto, userId: string) {
    if (!dto.memberId && !dto.visitor) throw new BadRequestException('Provide memberId or visitor');
    if (dto.memberId && dto.visitor) throw new BadRequestException('Provide only one of memberId or visitor');

    if (dto.memberId) {
      const m = await this.prisma.member.findUnique({ where: { id: dto.memberId } });
      if (!m) throw new NotFoundException('Member not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const visitor = dto.visitor ? await tx.visitor.create({ data: dto.visitor }) : null;
      return tx.dayPass.create({
        data: {
          code: randomBytes(3).toString('hex').toUpperCase(), // e.g. "A3F9C1"
          memberId: dto.memberId,
          visitorId: visitor?.id,
          validDate: dto.validDate ? toDateOnly(dto.validDate) : todayDate(),
          price: dto.price,
          paymentStatus: dto.paymentStatus ?? 'PENDING',
          waiverSigned: dto.waiverSigned ?? false,
          waiverSignedAt: dto.waiverSigned ? new Date() : null,
          createdById: userId,
        },
        include: { visitor: true, member: true },
      });
    });
  }
}