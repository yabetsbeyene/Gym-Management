import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const clean = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const PHONE = /^\+?\d{7,15}$/;
const PHONE_MSG = 'Phone must be 7–15 digits (optional leading +)';

// Password strength is enforced in the service by common/password.policy.ts
export class CreateStaffDto {
  @IsString() @MaxLength(80) name: string;
  @Transform(lower) @IsEmail() email: string;
  @IsString() @MaxLength(128) password: string;
  @IsOptional() @Transform(clean) @Matches(PHONE, { message: PHONE_MSG }) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(200) address?: string | null;
  @IsOptional() @IsString() @MaxLength(150_000) photoUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(500) notes?: string | null;
}

export class UpdateStaffDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @Transform(lower) @IsEmail() email?: string;
  @IsOptional() @Transform(clean) @Matches(PHONE, { message: PHONE_MSG }) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(200) address?: string | null;
  @IsOptional() @IsString() @MaxLength(150_000) photoUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(500) notes?: string | null;
}

export class ResetPasswordDto {
  @IsString() @MaxLength(128) password: string;
}