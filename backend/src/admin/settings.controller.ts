import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { SettingsService } from './settings.service';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Fee Configs ───────────────────────────────────────────────────────────────

  @Get('fees')
  @ApiOperation({ summary: 'List all fee configurations' })
  listFees() {
    return this.settingsService.listFeeConfigs();
  }

  @Get('fees/:id')
  @ApiOperation({ summary: 'Get a fee configuration by ID' })
  getFee(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.getFeeConfig(id);
  }

  @Post('fees')
  @ApiOperation({ summary: 'Create a new fee configuration' })
  createFee(@Body() dto: CreateFeeConfigDto) {
    return this.settingsService.createFeeConfig(dto);
  }

  @Patch('fees/:id')
  @ApiOperation({ summary: 'Update a fee configuration' })
  updateFee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateFeeConfigDto>,
  ) {
    return this.settingsService.updateFeeConfig(id, dto);
  }

  @Delete('fees/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a fee configuration' })
  deleteFee(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.deleteFeeConfig(id);
  }

  // ── Risk Rules ────────────────────────────────────────────────────────────────

  @Get('risk-rules')
  @ApiOperation({ summary: 'List all risk rules' })
  listRiskRules() {
    return this.settingsService.listRiskRules();
  }

  @Get('risk-rules/:id')
  @ApiOperation({ summary: 'Get a risk rule by ID' })
  getRiskRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.getRiskRule(id);
  }

  @Post('risk-rules')
  @ApiOperation({ summary: 'Create a new risk rule' })
  createRiskRule(@CurrentUser() user: User, @Body() dto: CreateRiskRuleDto) {
    return this.settingsService.createRiskRule(user.id, dto);
  }

  @Patch('risk-rules/:id')
  @ApiOperation({ summary: 'Update a risk rule' })
  updateRiskRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateRiskRuleDto>,
  ) {
    return this.settingsService.updateRiskRule(id, dto);
  }

  @Delete('risk-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a risk rule' })
  deleteRiskRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.deleteRiskRule(id);
  }
}
