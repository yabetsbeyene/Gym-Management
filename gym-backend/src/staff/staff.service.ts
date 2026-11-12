import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

/** Everything the UI may see: never the password hash. */
const SELECT = {
  id: true, name: true, email: true, role: true, phone: true, address: true, photoUrl: true, notes: true,
  isActive: true, lastLoginAt: true, createdAt: true,
  createdBy: { select: { id: true, name: true } },
  _count: { select: { checkIns: true, dayPassesCreated: true } },
} satisfies Prisma.UserSelect;

/** Deleted accounts are kept for history but never listed or counted. */
const LIVE_RECEPTIONISTS = { role: 'RECEPTIONIST', deletedAt: null } satisfies Prisma.UserWhereInput;

@Injectable()
export class StaffService {
  private readonly max: number;

  constructor(private prisma: PrismaService, config: ConfigService) {
    this.max = Number(config.get('MAX_RECEPTIONISTS') ?? 5) || 5;
  }

  async list() {
    const items = await this.prisma.user.findMany({ where: LIVE_RECEPTIONISTS, select: SELECT, orderBy: { createdAt: 'asc' } });
    return { items, max: this.max, used: items.length };
  }

  async findOne(id: string) {
    const staff = await this.prisma.user.findFirst({ where: { id, ...LIVE_RECEPTIONISTS }, select: SELECT });
    if (!staff) throw new NotFoundException('Receptionist not found');
    return staff;
  }

  async create(dto: CreateStaffDto, adminId: string) {
    const { password, ...profile } = dto;
    const passwordHash = await bcrypt.hash(password, 10);

    return this.unique(() =>
      this.prisma.$transaction(async (tx) => {
        // Serialise creations so two admins can't both create the "last" slot at once.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('staff:create'))`;
        const used = await tx.user.count({ where: LIVE_RECEPTIONISTS });
        if (used >= this.max) {
          throw new ConflictException(`Maximum of ${this.max} receptionist accounts reached. Delete one first.`);
        }
        return tx.user.create({
          data: { ...profile, passwordHash, role: 'RECEPTIONIST', createdById: adminId },
          select: SELECT,
        });
      }),
    );
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.require(id);
    return this.unique(() => this.prisma.user.update({ where: { id }, data: dto, select: SELECT }));
  }

  async setActive(id: string, isActive: boolean) {
    await this.require(id);
    return this.prisma.user.update({ where: { id }, data: { isActive }, select: SELECT });
  }

  async resetPassword(id: string, password: string) {
    const staff = await this.require(id);
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    return { ok: true, name: staff.name };
  }

  /**
   * Soft delete: the account can no longer sign in and its email/phone become reusable,
   * but its name stays so check-ins, day passes and the audit log still show who did them.
   */
  async remove(id: string) {
    const staff = await this.require(id);
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        phone: null,
        email: `deleted-${id}@removed.invalid`,
        passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
      },
    });
    return { ok: true, name: staff.name };
  }

  // ───── helpers ─────
  private async require(id: string) {
    const staff = await this.prisma.user.findFirst({ where: { id, ...LIVE_RECEPTIONISTS }, select: { id: true, name: true } });
    if (!staff) throw new NotFoundException('Receptionist not found');
    return staff;
  }

  /** Turns a database "already exists" error into a clear message. */
  private async unique<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = String(e.meta?.target ?? '');
        throw new ConflictException(
          target.includes('phone') ? 'This phone number belongs to another staff account' : 'This email is already used by another account',
        );
      }
      throw e;
    }
  }
}