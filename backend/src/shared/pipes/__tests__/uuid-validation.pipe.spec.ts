import { UUIDValidationPipe } from '../uuid-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('UUIDValidationPipe', () => {
  let pipe: UUIDValidationPipe;

  beforeEach(() => {
    pipe = new UUIDValidationPipe();
  });

  it('should pass through a valid UUID', () => {
    const valid = '123e4567-e89b-12d3-a456-426614174000';

    const result = pipe.transform(valid);

    expect(result).toBe(valid);
  });

  it('should pass through a simple valid UUID format', () => {
    const valid = '550e8400-e29b-41d4-a716-446655440000';

    const result = pipe.transform(valid);

    expect(result).toBe(valid);
  });

  it('should throw BadRequestException for invalid UUID', () => {
    expect(() => pipe.transform('not-a-uuid')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for partial UUID', () => {
    expect(() => pipe.transform('123e4567-e89b')).toThrow(BadRequestException);
  });

  it('should include invalid value in error message', () => {
    expect(() => pipe.transform('abc')).toThrow('Invalid UUID: abc');
  });
});
