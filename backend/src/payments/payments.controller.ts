import {
  Body,
  Controller,
  Get,
  Headers,
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
import { PaymentsService } from './payments.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('deposit/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a deposit' })
  createDeposit(@CurrentUser() user: User, @Body() dto: CreateDepositDto) {
    return this.paymentsService.createDeposit(user.id, dto);
  }

  @Get('deposit/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get deposit history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDeposits(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getDeposits(user.id, Number(page), Number(limit));
  }

  @Post('deposit/webhook')
  @ApiOperation({ summary: 'Receive deposit webhook (public)' })
  handleWebhook(
    @Body() body: unknown,
    @Headers('stripe-signature') stripeSignature = '',
    @Headers('x-signature') xSignature = '',
  ) {
    const signature = stripeSignature || xSignature;
    return this.paymentsService.handleDepositWebhook(body, signature);
  }

  @Post('withdraw/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a withdrawal request' })
  createWithdrawal(@CurrentUser() user: User, @Body() dto: CreateWithdrawalDto) {
    return this.paymentsService.createWithdrawal(user.id, dto);
  }

  @Get('withdraw/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get withdrawal history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWithdrawals(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getWithdrawals(user.id, Number(page), Number(limit));
  }

  @Get('admin/deposits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all deposits' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllDeposits(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.paymentsService.getAllDeposits(Number(page), Number(limit));
  }

  @Get('admin/withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all withdrawals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllWithdrawals(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.paymentsService.getAllWithdrawals(Number(page), Number(limit));
  }

  @Patch('admin/withdrawals/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: approve a withdrawal' })
  approveWithdrawal(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.paymentsService.approveWithdrawal(id, admin.id);
  }

  @Patch('admin/withdrawals/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: reject a withdrawal' })
  rejectWithdrawal(
    @Param('id') id: string,
    @CurrentUser() admin: User,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.rejectWithdrawal(id, admin.id, reason ?? '');
  }
}
