import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
import { ExchangeService } from './exchange.service';
import { QuoteExchangeDto } from './dto/quote-exchange.dto';
import { ExecuteExchangeDto } from './dto/execute-exchange.dto';

@ApiTags('exchange')
@Controller()
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Post('exchange/quote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an exchange quote' })
  getQuote(@CurrentUser() user: User, @Body() dto: QuoteExchangeDto) {
    return this.exchangeService.getQuote(user.id, dto);
  }

  @Post('exchange/execute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute a quoted exchange order' })
  executeExchange(@CurrentUser() user: User, @Body() dto: ExecuteExchangeDto) {
    return this.exchangeService.executeExchange(user.id, dto);
  }

  @Get('exchange/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exchange order history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.exchangeService.getHistory(user.id, Number(page), Number(limit));
  }

  @Get('admin/exchange/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all exchange orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllOrders(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.exchangeService.getAllOrders(Number(page), Number(limit));
  }
}
