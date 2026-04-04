import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Req,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { StartKycDto } from './dto/start-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { KycStatus } from '../database/enums/kyc-status.enum';

@ApiTags('KYC')
@Controller()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('kyc/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start KYC verification' })
  startKyc(@CurrentUser() user: User, @Body() dto: StartKycDto) {
    return this.kycService.startKyc(user.id, dto.level);
  }

  @Get('kyc/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current KYC status' })
  getStatus(@CurrentUser() user: User) {
    return this.kycService.getStatus(user.id);
  }

  @Post('kyc/webhook')
  @ApiOperation({ summary: 'KYC provider webhook (public)' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleWebhook(@Req() req: any, @Headers('x-signature') signature: string) {
    // rawBody is available because NestFactory is created with { rawBody: true }
    if (!req.rawBody) {
      throw new BadRequestException('Raw body unavailable — ensure rawBody: true is set in NestFactory.create');
    }
    return this.kycService.handleWebhook(req.rawBody as Buffer, signature ?? '');
  }

  @Get('admin/kyc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list KYC queue' })
  @ApiQuery({ name: 'status', enum: KycStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAdminQueue(
    @Query('status') status?: KycStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.kycService.getAdminQueue(status, page, limit);
  }

  @Patch('admin/kyc/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: approve KYC case' })
  approveCase(@Param('id') id: string, @CurrentUser() user: User) {
    return this.kycService.approveCase(id, user.id);
  }

  @Patch('admin/kyc/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: reject KYC case' })
  rejectCase(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('reason') reason: string,
  ) {
    return this.kycService.rejectCase(id, user.id, reason);
  }
}
