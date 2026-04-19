import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'ok' | 'down'; latencyMs?: number; error?: string };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // Check database connectivity
    const dbCheck: HealthStatus['checks']['database'] = { status: 'ok' };
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      dbCheck.latencyMs = Date.now() - start;
    } catch (err) {
      dbCheck.status = 'down';
      dbCheck.error = (err as Error).message;
    }

    const allOk = dbCheck.status === 'ok';

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp,
      uptime,
      checks: { database: dbCheck },
    };
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe (always 200 if process is running)' })
  liveness(): { alive: boolean } {
    return { alive: true };
  }
}
