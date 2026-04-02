import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../database/enums/user-role.enum';
import { User } from '../database/entities/user.entity';
import { BotsService } from './bots.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { CreateInstanceDto } from './dto/create-instance.dto';

@ApiTags('bots')
@Controller()
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get('bots/strategies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available bot strategies' })
  listStrategies() {
    return this.botsService.listStrategies();
  }

  @Post('bots/strategies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create a new bot strategy' })
  createStrategy(@CurrentUser() user: User, @Body() dto: CreateStrategyDto) {
    return this.botsService.createStrategy(user.id, dto);
  }

  @Post('bots/create-instance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a bot instance' })
  createInstance(@CurrentUser() user: User, @Body() dto: CreateInstanceDto) {
    return this.botsService.createInstance(user.id, dto);
  }

  @Get('bots/instances')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List your bot instances' })
  getUserInstances(@CurrentUser() user: User) {
    return this.botsService.getUserInstances(user.id);
  }

  @Get('bots/instances/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single bot instance' })
  getInstance(@CurrentUser() user: User, @Param('id') id: string) {
    return this.botsService.getInstance(user.id, id);
  }

  @Patch('bots/instances/:id/pause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause a bot instance' })
  pauseInstance(@CurrentUser() user: User, @Param('id') id: string) {
    return this.botsService.pauseInstance(user.id, id);
  }

  @Patch('bots/instances/:id/stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop a bot instance and return funds' })
  stopInstance(@CurrentUser() user: User, @Param('id') id: string) {
    return this.botsService.stopInstance(user.id, id);
  }

  @Get('bots/instances/:id/trades')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trades for a bot instance' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getBotTrades(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.botsService.getBotTrades(id, Number(page), Number(limit));
  }

  @Get('admin/bots/instances')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all bot instances' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllInstances(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.botsService.getAllInstances(Number(page), Number(limit));
  }

  @Post('admin/bots/kill-switch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: pause all active bot instances (kill switch)' })
  adminPauseAll() {
    return this.botsService.adminPauseAll();
  }
}
