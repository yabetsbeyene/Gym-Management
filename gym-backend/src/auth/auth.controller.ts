import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEmail, IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { AllowPasswordChange } from '../common/allow-password-change.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto, UpdateProfileDto } from './auth.dto';

class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /** Who am I, and must I change my password first? Works for any signed-in user. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowPasswordChange()
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.id);
  }

  /** Admin only: receptionists cannot edit account details. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.id, dto);
  }

  /** Admin only: receptionists cannot change their own password. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @AllowPasswordChange()
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.id, dto);
  }
}