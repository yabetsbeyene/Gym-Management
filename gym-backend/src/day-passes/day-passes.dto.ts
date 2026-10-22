import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class VisitorDto {
  @IsString() fullName: string;
  @IsOptional() @IsString() phone?: string;
}

export class CreateDayPassDto {
  @IsOptional() @IsString() memberId?: string;                 // existing member
  @IsOptional() @ValidateNested() @Type(() => VisitorDto) visitor?: VisitorDto; // OR new visitor
  @IsOptional() @IsDateString() validDate?: string;            // defaults to today
  @IsNumber() price: number;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsBoolean() waiverSigned?: boolean;
}