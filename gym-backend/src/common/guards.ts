import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOW_PASSWORD_CHANGE } from './allow-password-change.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Runs on every request: a deactivated or deleted account stops working immediately. */
  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, role: true, isActive: true, deletedAt: true, mustChangePassword: true },
    });
    if (!user || !user.isActive || user.deletedAt) throw new UnauthorizedException('Account is disabled');
    return { id: user.id, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword }; // req.user
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest();
    const targets = [ctx.getHandler(), ctx.getClass()];

    // A flagged account can do nothing except the routes marked @AllowPasswordChange().
    if (user?.mustChangePassword && !this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE, targets)) {
      throw new ForbiddenException({ message: 'You must change your password before continuing', code: 'PASSWORD_CHANGE_REQUIRED' });
    }

    const roles = this.reflector.getAllAndOverride<Role[]>('roles', targets);
    if (!roles?.length) return true;
    return roles.includes(user?.role);
  }
}