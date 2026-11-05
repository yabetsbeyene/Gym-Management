import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

const stripSpaces = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;
const PHONE = /^\+?\d{7,15}$/;
const PHONE_MSG = 'Phone must be 7–15 digits (optional leading +)';
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
export const MEMBER_STATUS_FILTERS = ['ACTIVE', 'EXPIRED', 'FROZEN', 'SUSPENDED', 'NO_PLAN'] as const;

export class CreateMemberDto {
  @IsString() @MaxLength(60) firstName: string;
  @IsString() @MaxLength(60) lastName: string;
  @Transform(stripSpaces) @Matches(PHONE, { message: PHONE_MSG }) phone: string;

  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsIn(GENDERS) gender?: string | null;
  @IsOptional() @IsDateString() dateOfBirth?: string | null;
  @IsOptional() @IsString() @MaxLength(200) address?: string | null;
  @IsOptional() @IsString() @MaxLength(60) emergencyContactName?: string | null;
  @IsOptional() @Transform(stripSpaces) @Matches(PHONE, { message: PHONE_MSG }) emergencyContactPhone?: string | null;
  @IsOptional() @IsString() @MaxLength(150_000) photoUrl?: string | null; // small data URL
  @IsOptional() @IsString() @MaxLength(1000) notes?: string | null;

  // optional: create the first membership at the same time
  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsDateString() startDate?: string;
}

/** Every field optional. Send null to clear an optional field. */
export class UpdateMemberDto {
  @IsOptional() @IsString() @MaxLength(60) firstName?: string;
  @IsOptional() @IsString() @MaxLength(60) lastName?: string;
  @IsOptional() @Transform(stripSpaces) @Matches(PHONE, { message: PHONE_MSG }) phone?: string;

  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsIn(GENDERS) gender?: string | null;
  @IsOptional() @IsDateString() dateOfBirth?: string | null;
  @IsOptional() @IsString() @MaxLength(200) address?: string | null;
  @IsOptional() @IsString() @MaxLength(60) emergencyContactName?: string | null;
  @IsOptional() @Transform(stripSpaces) @Matches(PHONE, { message: PHONE_MSG }) emergencyContactPhone?: string | null;
  @IsOptional() @IsString() @MaxLength(150_000) photoUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string | null;
}

export class ListMembersQuery {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(MEMBER_STATUS_FILTERS) status?: (typeof MEMBER_STATUS_FILTERS)[number];
  @IsOptional() @IsIn(['true']) archived?: 'true';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}

export class UpdateStatusDto {
  @IsEnum(MembershipStatus) status: MembershipStatus;
  @IsOptional() @IsString() reason?: string;
}

export class RenewMembershipDto {
  @IsString() planId: string;
  @IsOptional() @IsDateString() startDate?: string; // default: today, or the day after the current one ends
}