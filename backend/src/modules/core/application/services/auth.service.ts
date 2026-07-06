export interface IAuthService {
  generateAccessToken(payload: { sub: string; email: string }): string;
  generateRefreshToken(payload: { sub: string; email: string }): string;
  verify(token: string): { sub: string; email: string };
}
