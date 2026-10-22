import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SmsService {
  constructor(private prisma: PrismaService) {}

  async send(input: { memberId?: string; phone?: string; message: string }, userId: string) {
    let phone = input.phone;
    if (input.memberId) {
      const m = await this.prisma.member.findUnique({ where: { id: input.memberId } });
      if (!m) throw new NotFoundException('Member not found');
      phone = m.phone;
    }
    if (!phone) throw new BadRequestException('Provide memberId or phone');

    const log = await this.prisma.notificationLog.create({
      data: { memberId: input.memberId, phone, message: input.message, sentById: userId, provider: 'my-provider' },
    });

    try {
      const providerMessageId = await this.callProvider(phone, input.message);
      return this.prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: 'SENT', providerMessageId },
      });
    } catch (e: any) {
      return this.prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: String(e?.message ?? e) },
      });
    }
  }

  /** Replace with your SMS gateway (Twilio, Africa's Talking, local provider, etc.) */
  private async callProvider(phone: string, message: string): Promise<string> {
    // const res = await fetch('https://provider.example/send', { method: 'POST', ... });
    // return (await res.json()).messageId;
    console.log(`[SMS -> ${phone}] ${message}`);
    return `stub-${Date.now()}`;
  }
}