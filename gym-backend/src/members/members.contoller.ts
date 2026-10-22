import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { MembersService } from './members.service';
import { CreateMemberDto, ListMembersQuery, UpdateStatusDto } from './members.dto';

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

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.members.updateStatus(id, dto);
  }
}