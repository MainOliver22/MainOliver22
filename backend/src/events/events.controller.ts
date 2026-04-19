import {
  Controller,
  Get,
  Sse,
  UseGuards,
  Res,
  MessageEvent,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { EventsService } from './events.service';

@ApiTags('Events (SSE)')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * SSE stream for the authenticated user.
   * Connect from the browser with:
   *   const es = new EventSource('/api/events/stream', { withCredentials: true });
   *   es.onmessage = (e) => console.log(JSON.parse(e.data));
   */
  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Subscribe to real-time platform events for the current user (SSE)',
  })
  stream(@CurrentUser() user: User): Observable<MessageEvent> {
    return this.eventsService.streamForUser(user.id).pipe(
      map((event) => ({
        data: JSON.stringify({ type: event.type, data: event.data }),
      })),
    );
  }
}
