import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength, IsEmail } from 'class-validator';

const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const clean = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value);

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @Transform(lower) @IsEmail() email?: string; // the username used to sign in
  @IsOptional() @Transform(clean) @Matches(/^\+?\d{7,15}$/, { message: 'Phone must be 7–15 digits (optional leading +)' }) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(200) address?: string | null;
  @IsOptional() @IsString() @MaxLength(150_000) photoUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(128) currentPassword?: string; // required only when the username changes
}

export class ChangePasswordDto {
  @IsString() @MaxLength(128) currentPassword: string;
  @IsString() @MaxLength(128) newPassword: string;
}