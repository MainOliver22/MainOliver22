import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UserRole } from '../../database/enums/user-role.enum';

export const ROLES_KEY = 'roles';

type RequestWithUser = Request & { user?: { role?: UserRole } };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const role = req.user?.role;
    return role ? requiredRoles.includes(role) : false;
  }
}
