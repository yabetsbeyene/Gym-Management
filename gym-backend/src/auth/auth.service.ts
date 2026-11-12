import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  async login(rawEmail: string, password: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = !!user && user.isActive && !user.deletedAt && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) {
      await this.audit.record({
        actor: { id: user?.id ?? null, name: user?.name ?? email, role: user?.role ?? 'UNKNOWN' },
        action: 'auth.login_failed',
        summary: `Failed sign-in attempt for ${email}`,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.record({
      actor: { id: user.id, name: user.name, role: user.role },
      action: 'auth.login',
      summary: 'Signed in',
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}