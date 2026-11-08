import { IsIn, IsOptional } from 'class-validator';

export const OVERVIEW_RANGES = ['today', 'week', 'month'] as const;
export type OverviewRange = (typeof OVERVIEW_RANGES)[number];

export class OverviewQuery {
  @IsOptional() @IsIn(OVERVIEW_RANGES) range?: OverviewRange;
}