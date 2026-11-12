import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { JwtStrategy } from './common/guards';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { MembersModule } from './members/members.module';
import { DayPassesModule } from './day-passes/day-passes.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SmsModule } from './sms/sms.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    StaffModule,
    MembersModule,
    DayPassesModule,
    CheckInsModule,
    DashboardModule,
    SmsModule,
    PlansModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}