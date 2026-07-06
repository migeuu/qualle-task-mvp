import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { IAuthService } from '../../application/services/auth.service';

@Injectable()
export class JwtAuthService implements IAuthService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateAccessToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRATION || '1h') as any,
    });
  }

  generateRefreshToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload, {
      expiresIn: '7d' as any,
    });
  }

  verify(token: string): { sub: string; email: string } {
    return this.jwtService.verify(token);
  }
}
