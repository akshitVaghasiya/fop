import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants/error-response.constant';
import pino from 'pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  private readonly logger = pino({
    level: 'error',
  }, pino.destination('logs/app.log'));

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = ERROR_MESSAGES.INTERNAL_SERVER_ERROR.error;
    let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR.message;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'error' in exceptionResponse &&
        'message' in exceptionResponse
      ) {
        error = (exceptionResponse as any).error || error;
        message = (exceptionResponse as any).message || message;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      // console.log("in global exception-->", exception);

      message = exception.message || message;
    }

    const timestamp = new Date().toISOString();
    this.logger.error({
      msg: `[${timestamp}] [ERROR] ${request.method} ${request.url} ${statusCode} - ${message}`,
    });

    const errorResponse = {
      error,
      message,
      statusCode,
    };

    response.status(statusCode).json(errorResponse);
  }
}