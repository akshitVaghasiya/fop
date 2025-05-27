import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { ROLES_KEY } from 'src/common/decorators/roles/roles.decorator';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { AuthUser } from 'src/common/types/auth-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new GlobalHttpException(ERROR_MESSAGES.FORBIDDEN_ACCESS, 403);
    }

    return true;
  }
}
