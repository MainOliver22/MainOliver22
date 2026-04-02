import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('Portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('portfolio')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('balances')
  @ApiOperation({ summary: 'Get all asset balances for the current user' })
  getBalances(@CurrentUser() user: User) {
    return this.ledgerService.getBalances(user.id);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get paginated ledger entries for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLedger(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.ledgerService.getLedgerEntries(user.id, page, limit);
  }
}
