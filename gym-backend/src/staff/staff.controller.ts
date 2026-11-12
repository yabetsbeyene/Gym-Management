import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto, ResetPasswordDto, UpdateStaffDto } from './staff.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('staff')
export class StaffController {
  constructor(private staff: StaffService) {}

  @Get()
  list() {
    return this.staff.list();
  }

  @Post()
  create(@Body() dto: CreateStaffDto, @Req() req: any) {
    return this.staff.create(dto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staff.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(id, dto);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.staff.setActive(id, true);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.staff.setActive(id, false);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.staff.resetPassword(id, dto.password);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staff.remove(id);
  }
}