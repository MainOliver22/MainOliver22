import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { NotificationType } from '../database/enums/notification-type.enum';
import { NotificationChannel } from '../database/enums/notification-channel.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
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
    return this.notifRepo.save(notif);
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
