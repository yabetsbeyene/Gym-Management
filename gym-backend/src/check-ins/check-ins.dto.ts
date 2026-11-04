import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCheckInDto {
  /** member id (QR) / phone / GYM-0001 / day pass code */
  @IsString() @MaxLength(100) personIdentifier: string;
}

export class AttemptsQuery {
  @IsOptional() @IsIn(['true', 'false']) allowed?: 'true' | 'false';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
}