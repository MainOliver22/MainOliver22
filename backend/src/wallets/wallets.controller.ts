import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

class VerifyWalletDto {
  @ApiProperty() address!: string;
  @ApiProperty() message!: string;
  @ApiProperty() signature!: string;
}

@ApiTags('Wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('wallet')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect a new wallet' })
  connectWallet(@CurrentUser() user: User, @Body() dto: ConnectWalletDto) {
    return this.walletsService.connectWallet(user.id, dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'List connected wallets' })
  listWallets(@CurrentUser() user: User) {
    return this.walletsService.listWallets(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a connected wallet' })
  removeWallet(@CurrentUser() user: User, @Param('id') walletId: string) {
    return this.walletsService.removeWallet(user.id, walletId);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set a wallet as default' })
  setDefault(@CurrentUser() user: User, @Param('id') walletId: string) {
    return this.walletsService.setDefault(user.id, walletId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify wallet ownership via SIWE signature' })
  verifyWallet(@CurrentUser() user: User, @Body() dto: VerifyWalletDto) {
    return this.walletsService.verifyWallet(user.id, dto.address, dto.message, dto.signature);
  }
}
