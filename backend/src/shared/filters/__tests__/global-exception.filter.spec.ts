import { GlobalExceptionFilter } from '../global-exception.filter';
import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Response } from 'express';

vi.mock('@nestjs/graphql', () => ({
  GqlArgumentsHost: {
    create: vi.fn(),
  },
}));

vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'verbose').mockImplementation(() => {});

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { statusCode?: number; body?: unknown };
  let mockHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {};

    const jsonFn = vi.fn((body: unknown) => {
      mockResponse.body = body;
      return mockResponse;
    });
    const statusFn = vi.fn((code: number) => {
      mockResponse.statusCode = code;
      return { json: jsonFn };
    });

    mockHost = {
      getType: vi.fn().mockReturnValue('http'),
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({
          status: statusFn,
        } as unknown as Response),
      }),
    };

    vi.mocked(GqlArgumentsHost.create).mockReturnValue({
      getContext: vi.fn().mockReturnValue(undefined),
    } as any);
  });

  describe('HttpException', () => {
    it('should set status and message on response', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost as ArgumentsHost);

      expect(mockResponse.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect((mockResponse.body as any).message).toBe('Not found');
    });

    it('should handle array messages from ValidationPipe', () => {
      const exception = new HttpException(
        { message: ['email must be an email', 'password is too short'], statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost as ArgumentsHost);

      expect(mockResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect((mockResponse.body as any).message).toContain('email must be an email');
    });
  });

  describe('Error', () => {
    it('should return 500 for regular Error', () => {
      const error = new Error('Something went wrong');

      filter.catch(error, mockHost as ArgumentsHost);

      expect(mockResponse.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((mockResponse.body as any).message).toBe('Something went wrong');
    });
  });

  describe('Unknown exception', () => {
    it('should return 500 for non-Error exceptions', () => {
      filter.catch('string error', mockHost as ArgumentsHost);

      expect(mockResponse.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((mockResponse.body as any).message).toBe('Internal server error');
    });
  });

  describe('GraphQL context', () => {
    it('should rethrow exception for GraphQL requests', () => {
      mockHost.getType = vi.fn().mockReturnValue('graphql');
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      expect(() =>
        filter.catch(exception, mockHost as ArgumentsHost),
      ).toThrow(HttpException);
    });
  });
});
