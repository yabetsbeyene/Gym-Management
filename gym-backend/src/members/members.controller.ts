import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/roles.decorator';
import { MembersService } from './members.service';
import { CreateMemberDto, ListMembersQuery, RenewMembershipDto, UpdateMemberDto, UpdateStatusDto } from './members.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private members: MembersService) {}

  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.members.create(dto);
  }

  @Get()
  findAll(@Query() query: ListMembersQuery) {
    return this.members.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.members.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.members.updateStatus(id, dto);
  }

  @Post(':id/renew')
  renew(@Param('id') id: string, @Body() dto: RenewMembershipDto) {
    return this.members.renew(id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.members.setArchived(id, true);
  }

  @Roles(Role.ADMIN)
  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.members.setArchived(id, false);
  }
}