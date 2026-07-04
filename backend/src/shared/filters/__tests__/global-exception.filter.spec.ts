import { GlobalExceptionFilter } from '../global-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';

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
  let mockHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockHost = {} as ArgumentsHost;
    vi.mocked(GqlArgumentsHost.create).mockReturnValue({} as any);
  });

  describe('HttpException', () => {
    it('should rethrow HttpException', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      expect(() => filter.catch(exception, mockHost as ArgumentsHost)).toThrow(HttpException);
    });

    it('should rethrow HttpException with object response', () => {
      const exception = new HttpException(
        { message: ['Validation error 1', 'Validation error 2'] },
        HttpStatus.BAD_REQUEST,
      );

      expect(() => filter.catch(exception, mockHost as ArgumentsHost)).toThrow(HttpException);
    });
  });

  describe('Error', () => {
    it('should rethrow regular Error', () => {
      const error = new Error('Something went wrong');

      expect(() => filter.catch(error, mockHost as ArgumentsHost)).toThrow(Error);
      expect(() => filter.catch(error, mockHost as ArgumentsHost)).toThrow('Something went wrong');
    });

    it('should rethrow Error without stack', () => {
      class NoStackError extends Error {
        constructor() {
          super('No stack');
          delete this.stack;
        }
      }

      const error = new NoStackError();

      expect(() => filter.catch(error, mockHost as ArgumentsHost)).toThrow(NoStackError);
    });
  });

  describe('Unknown exception', () => {
    it('should rethrow non-Error exceptions', () => {
      expect(() => filter.catch('string error', mockHost as ArgumentsHost)).toThrow('string error');
      expect(() => filter.catch(42, mockHost as ArgumentsHost)).toThrow();
    });
  });
});
