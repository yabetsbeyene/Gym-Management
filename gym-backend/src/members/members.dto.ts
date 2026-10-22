import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipStatus } from '@prisma/client';

export class CreateMemberDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsString() phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() photoUrl?: string; // upload the file elsewhere (S3/Cloudinary), store URL here
  @IsOptional() @IsString() notes?: string;

  // optional: create the first membership at the same time
  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsDateString() startDate?: string;
}

export class ListMembersQuery {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(MembershipStatus) status?: MembershipStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}

export class UpdateStatusDto {
  @IsEnum(MembershipStatus) status: MembershipStatus;
  @IsOptional() @IsString() reason?: string;
}