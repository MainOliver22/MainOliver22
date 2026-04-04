import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { NotificationType } from '../database/enums/notification-type.enum';
import { NotificationChannel } from '../database/enums/notification-channel.enum';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    metadata?: Record<string, unknown>,
  ) {
    const notif = this.notifRepo.create({
      userId,
      type,
      title,
      message,
      channel,
      metadata: metadata ?? null,
    });
    const saved = await this.notifRepo.save(notif);

    if (channel === NotificationChannel.EMAIL && metadata?.['email']) {
      const to = metadata['email'] as string;
      const html = `<h2>${title}</h2><p>${message}</p>`;
      // Fire-and-forget: do not block the request on SMTP delivery
      void this.emailService.sendEmail(to, title, html).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send email to ${to}: ${msg}`);
      });
    }

    return saved;
  }

  async findForUser(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notifRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { notifications, total, page, limit };
  }

  async markRead(userId: string, notificationId: string) {
    await this.notifRepo.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() },
    );
    return { message: 'Marked as read' };
  }
}
