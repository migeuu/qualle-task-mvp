import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    if (exception instanceof HttpException) {
      if (status >= 500) {
        this.logger.error(`[${status}] ${message}`, exception.stack);
      } else {
        this.logger.warn(`[${status}] ${message}`);
      }
    } else if (exception instanceof Error) {
      const showStack =
        process.env.NODE_ENV !== 'production' ? exception.stack : undefined;
      this.logger.error(`[${status}] ${exception.message}`, showStack);
    } else {
      this.logger.error('Unknown exception type', String(exception));
    }

    if (host.getType<GqlContextType>() === 'graphql') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const body = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const msg = (response as Record<string, unknown>).message;
        if (Array.isArray(msg)) {
          return (msg as string[]).join('; ');
        }
        if (typeof msg === 'string') {
          return msg;
        }
      }
      return exception.message;
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
