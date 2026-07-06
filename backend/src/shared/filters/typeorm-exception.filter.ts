import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

const pgErrorMap: Record<string, HttpStatus> = {
  '23505': HttpStatus.CONFLICT,
  '23503': HttpStatus.BAD_REQUEST,
  '23502': HttpStatus.BAD_REQUEST,
  '23514': HttpStatus.BAD_REQUEST,
};

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const pgCode = (exception as any).driverError?.code as string;
    const status = pgCode ? pgErrorMap[pgCode] : undefined;

    if (status) {
      this.logger.warn(
        `DB error [${pgCode}]: ${exception.message}`,
      );
      response.status(status).json({
        statusCode: status,
        message: this.mapMessage(pgCode, exception),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.error(
      `Unhandled DB error: ${exception.message}`,
      exception.stack,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }

  private mapMessage(code: string, exception: QueryFailedError): string {
    const driverDetail = (exception as any).driverError?.detail as string;
    switch (code) {
      case '23505':
        return 'A record with the given value already exists';
      case '23503':
        return 'Referenced record does not exist';
      case '23502':
        return 'A required field is missing';
      case '23514':
        return 'A validation constraint was violated';
      default:
        return driverDetail || 'Database error';
    }
  }
}
