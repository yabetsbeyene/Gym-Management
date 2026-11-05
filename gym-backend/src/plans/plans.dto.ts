import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString() @MaxLength(60) name: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(3650) durationDays: number;
  @Type(() => Number) @IsNumber() @Min(0) price: number;
}

export class UpdatePlanDto {
  @IsOptional() @IsString() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(3650) durationDays?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}