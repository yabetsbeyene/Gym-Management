import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertStrongPassword } from '../common/password.policy';
import { ChangePasswordDto, UpdateProfileDto } from './auth.dto';

const ME = {
  id: true, name: true, email: true, role: true, phone: true, address: true, photoUrl: true, mustChangePassword: true,
} satisfies Prisma.UserSelect;

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

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: ME });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { currentPassword, ...data } = dto;
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // Changing the username (email) needs the current password, so a stolen session can't lock the owner out.
    // 400 (not 401) on purpose: a 401 would sign the person out of the app.
    if (data.email && data.email !== user.email) {
      if (!currentPassword) throw new BadRequestException('Enter your current password to change your username');
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new BadRequestException('Current password is incorrect');
    }

    try {
      await this.prisma.user.update({ where: { id: userId }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(String(e.meta?.target).includes('phone') ? 'This phone number is already used by another account' : 'This username is already taken');
      }
      throw e;
    }
    return this.me(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) throw new BadRequestException('Current password is incorrect');
    assertStrongPassword(dto.newPassword, { email: user.email, name: user.name });
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException('The new password must be different from the current one');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12), mustChangePassword: false, passwordChangedAt: new Date() },
    });
    return { ok: true };
  }
}