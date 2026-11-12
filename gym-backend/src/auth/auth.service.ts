import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQuery } from './audit.dto';

export type AuditActor = { id: string | null; name: string; role: string };
export type AuditEntry = {
  actor: AuditActor;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /** Never throws: a logging problem must not break the action the user just performed. */
  async record(e: AuditEntry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: e.actor.id,
          actorName: e.actor.name,
          actorRole: e.actor.role,
          action: e.action,
          summary: e.summary,
          entityType: e.entityType ?? null,
          entityId: e.entityId ?? null,
          details: e.details as Prisma.InputJsonObject | undefined,
        },
      });
    } catch (err) {
      this.logger.error(`Could not write audit log (${e.action})`, err as Error);
    }
  }

  async list(q: AuditQuery) {
    const { actorId, search, from, to, page = 1, limit = 30 } = q;
    const where: Prisma.AuditLogWhereInput = {
      ...(actorId && { actorId }),
      ...(search && { summary: { contains: search, mode: 'insensitive' } }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lt: new Date(new Date(to).getTime() + 86_400_000) }), // "to" is inclusive
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  /** People who have activity, for the filter dropdown (includes deleted accounts). */
  async actors() {
    const rows = await this.prisma.auditLog.groupBy({
      by: ['actorId', 'actorName'],
      _count: { _all: true },
      orderBy: { _count: { actorId: 'desc' } },
    });
    return rows.map((r) => ({ actorId: r.actorId, actorName: r.actorName, count: r._count._all }));
  }
}