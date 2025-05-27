import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import pino from 'pino';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  private readonly logger = pino({
    level: 'info',
  }, pino.destination('logs/app.log'));

  use(req: Request, res: Response, next: () => void) {
    const { method, originalUrl } = req;

    const start = Date.now();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 400) {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        this.logger.info(
          `[${timestamp}] [INFO] ${method} ${originalUrl} ${statusCode} - ${duration}ms`
        );
      }
    });

    next();
  }
}
