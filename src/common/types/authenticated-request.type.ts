import { Request } from 'express';
import { AuthUser } from './auth-user.type';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
