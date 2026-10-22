import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { CheckInsController } from './check-ins.controller';
import { CheckInsService } from './check-ins.service';

@Module({ imports: [EligibilityModule], controllers: [CheckInsController], providers: [CheckInsService] })
export class CheckInsModule {}