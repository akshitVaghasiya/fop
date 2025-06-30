import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorators/public/public.decorator';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    try {
      const result = await super.canActivate(context);
      if (!result) throw {
        error: ERROR_MESSAGES.INVALID_TOKEN,
        statusCode: 401
      };

      // if (request.user) {
      //   request.user = request.user
      // }

      return true;
    } catch (error) {
      throw new GlobalHttpException(
        error?.error || ERROR_MESSAGES.INVALID_TOKEN,
        error?.statusCode || 401);
    }
  }
}