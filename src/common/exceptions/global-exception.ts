import { HttpException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-response.constant';

export class GlobalHttpException extends HttpException {
    constructor(
        errorConstant?: { error?: string; message?: string },
        statusCode?: number,
    ) {
        const fallback = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
        super(
            {
                error: errorConstant?.error || fallback.error,
                message: errorConstant?.message || fallback.message,
            },
            statusCode || 500,
        );
    }
}