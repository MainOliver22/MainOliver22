import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../database/entities/support-ticket.entity';
import { TicketStatus } from '../database/enums/ticket-status.enum';
import { TicketPriority } from '../database/enums/ticket-priority.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepo.create({
      userId,
      subject: dto.subject,
      description: dto.description,
      category: dto.category,
      priority: dto.priority ?? TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
    });
    return this.ticketRepo.save(ticket);
  }

  async getMyTickets(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ tickets: SupportTicket[]; total: number; page: number; limit: number }> {
    const [tickets, total] = await this.ticketRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { tickets, total, page, limit };
  }

  async getMyTicket(userId: string, ticketId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, userId } });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    return ticket;
  }

  // ── Admin methods ─────────────────────────────────────────────────────────────

  async getAllTickets(
    page: number,
    limit: number,
    status?: TicketStatus,
  ): Promise<{ tickets: SupportTicket[]; total: number; page: number; limit: number }> {
    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignee', 'assignee')
      .orderBy('ticket.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.where('ticket.status = :status', { status });
    }

    const [tickets, total] = await qb.getManyAndCount();
    return { tickets, total, page, limit };
  }

  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignee'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    return ticket;
  }

  async updateTicket(ticketId: string, dto: UpdateTicketDto): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.status !== undefined) {
      updates['status'] = dto.status;
      if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
        updates['resolvedAt'] = new Date();
      }
    }
    if (dto.priority !== undefined) updates['priority'] = dto.priority;
    if (dto.assignedTo !== undefined) updates['assignedTo'] = dto.assignedTo;
    if (dto.category !== undefined) updates['category'] = dto.category;

    await this.ticketRepo.update(ticketId, updates as never);
    return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['user', 'assignee'] }) as Promise<SupportTicket>;
  }

  async resolveTicket(ticketId: string): Promise<SupportTicket> {
    return this.updateTicket(ticketId, { status: TicketStatus.RESOLVED });
  }

  async closeTicket(ticketId: string): Promise<SupportTicket> {
    return this.updateTicket(ticketId, { status: TicketStatus.CLOSED });
  }
}
