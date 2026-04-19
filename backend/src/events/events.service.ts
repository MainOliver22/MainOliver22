import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface PlatformEvent {
  type:
    | 'BOT_STATUS_CHANGE'
    | 'PRICE_TICK'
    | 'NEW_NOTIFICATION'
    | 'WITHDRAWAL_STATUS'
    | 'DEPOSIT_CONFIRMED'
    | 'KYC_UPDATE';
  userId?: string; // if set, only delivered to that user's SSE stream
  data: Record<string, unknown>;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly events$ = new Subject<PlatformEvent>();

  /** Emit an event to all subscribed clients (or scoped to a userId). */
  emit(event: PlatformEvent): void {
    this.logger.debug(`Emitting event: ${event.type} ${event.userId ? `→ user ${event.userId}` : '(broadcast)'}`);
    this.events$.next(event);
  }

  /**
   * Returns an Observable of events for a specific user.
   * Includes broadcast events (no userId) and events addressed to this user.
   */
  streamForUser(userId: string) {
    return this.events$.pipe(
      filter((e) => !e.userId || e.userId === userId),
    );
  }
}
