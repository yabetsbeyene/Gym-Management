import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AuditQuery {
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}