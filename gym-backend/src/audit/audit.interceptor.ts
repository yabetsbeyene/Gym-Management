import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { AuditReq, describe, sanitize } from './audit.rules';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
type Req = AuditReq & { user?: { id: string; name: string; role: string } };

/** Records every successful change made by a signed-in user. Reading data is not logged. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Req>();
    if (!MUTATING.has(req.method)) return next.handle();

    return next.handle().pipe(
      tap((res) => {
        if (!req.user) return;
        void this.audit.record({
          actor: { id: req.user.id, name: req.user.name, role: req.user.role },
          ...describe(req, res),
          details: sanitize(req.body),
        });
      }),
    );
  }
}