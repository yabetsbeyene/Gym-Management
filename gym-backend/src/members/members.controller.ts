import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { MembersService } from './members.service';
import { CreateMemberDto, ListMembersQuery, RenewMembershipDto, UpdateStatusDto } from './members.dto';

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

  @Post(':id/renew')
  renew(@Param('id') id: string, @Body() dto: RenewMembershipDto) {
    return this.members.renew(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.members.updateStatus(id, dto);
  }
}