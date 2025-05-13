import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ERROR_CODES } from '../constants/error-codes.constant';

interface DatabaseError {
  code?: string;
  detail?: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  code: string;
  errors: Array<{ code?: string; detail?: string }>;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Initialize error response with a default structure
    const errorResponse: ErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      errors: [],
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      this.handleHttpException(exception, errorResponse);
    } else if (exception instanceof QueryFailedError) {
      this.handleDatabaseException(
        exception as QueryFailedError,
        errorResponse,
      );
    } else if (exception instanceof Error) {
      this.handleGenericError(exception, errorResponse);
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private handleHttpException(
    exception: HttpException,
    errorResponse: ErrorResponse,
  ): void {
    errorResponse.statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      errorResponse.message =
        (responseObj.message as string) || exception.message;
      errorResponse.code =
        (responseObj.code as string) || ERROR_CODES.HTTP_ERROR;
      errorResponse.errors =
        (responseObj.errors as Array<{ code?: string; detail?: string }>) || [];
    } else {
      errorResponse.message = exceptionResponse;
      errorResponse.code = ERROR_CODES.HTTP_ERROR;
    }
  }

  private handleDatabaseException(
    exception: QueryFailedError,
    errorResponse: ErrorResponse,
  ): void {
    errorResponse.statusCode = HttpStatus.BAD_REQUEST;
    errorResponse.code = ERROR_CODES.DATABASE_ERROR;
    errorResponse.message = 'Database operation failed';

    const dbError = exception.driverError as DatabaseError;
    errorResponse.errors = [
      {
        code: dbError?.code,
        detail: dbError?.detail,
      },
    ];

    switch (dbError?.code) {
      case '23505': // Duplicate entry violation
        errorResponse.code = ERROR_CODES.CONFLICT;
        errorResponse.message = 'Duplicate entry detected';
        break;

      case '23503': // Foreign key constraint violation
        errorResponse.code = ERROR_CODES.RELATED_RESOURCE;
        errorResponse.message = 'Related resource not found';
        break;

      case '22P02': // Invalid text representation
        errorResponse.code = ERROR_CODES.INVALID_INPUT;
        errorResponse.message = 'Invalid data format';
        break;

      case '23502': // Not-null constraint violation
        errorResponse.code = ERROR_CODES.NOT_NULL_VIOLATION;
        errorResponse.message = 'Null value in non-nullable column';
        break;

      default:
        errorResponse.message = 'Unknown database error';
        errorResponse.code = ERROR_CODES.DATABASE_ERROR;
        break;
    }
  }

  private handleGenericError(
    exception: Error,
    errorResponse: ErrorResponse,
  ): void {
    errorResponse.code = ERROR_CODES.APPLICATION_ERROR;
    errorResponse.message = exception.message;
  }
}
