import { HttpException, HttpStatus } from '@nestjs/common';

interface ErrorResponse {
  statusCode?: number;
  message?: string;
  code?: string;
}

export class UserDeactivatedException extends HttpException {
  constructor(response: ErrorResponse = {}) {
    const {
      statusCode = HttpStatus.FORBIDDEN,
      message = 'Account deactivated',
      code = 'USER_DEACTIVATED',
    } = response;

    const finalResponse = { message, code };
    super(finalResponse, statusCode);
  }
}
