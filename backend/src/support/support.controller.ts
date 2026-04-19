import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { TicketStatus } from '../database/enums/ticket-status.enum';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ── User endpoints ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  create(@CurrentUser() user: User, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List my support tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyTickets(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.supportService.getMyTickets(user.id, page, limit);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get a specific ticket (own tickets only)' })
  getMyTicket(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.supportService.getMyTicket(user.id, id);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: list all tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  getAllTickets(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: TicketStatus,
  ) {
    return this.supportService.getAllTickets(page, limit, status);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: get ticket by ID' })
  getTicketById(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.getTicketById(id);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: update ticket status/priority/assignee' })
  updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(id, dto);
  }

  @Patch('admin/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: mark ticket as resolved' })
  resolveTicket(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.resolveTicket(id);
  }
}
