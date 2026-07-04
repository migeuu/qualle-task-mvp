import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const authHeader =
        request.headers?.authorization ||
        request.headers?.Authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }

      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = this.jwtService.verify(token);
        request.user = payload;
        return true;
      } catch {
        return false;
      }
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    const authHeader =
      gqlContext.req?.headers?.authorization ||
      gqlContext.req?.headers?.Authorization ||
      gqlContext.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      if (gqlContext.req) {
        gqlContext.req.user = payload;
      }
      return true;
    } catch {
      return false;
    }
  }
}
