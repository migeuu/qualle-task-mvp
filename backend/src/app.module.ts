import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { EventsModule } from './events/events.module';
import { GatewayModule } from './gateway/gateway.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_DATABASE!,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      context: ({ req }: any) => {
        const authorization =
          req?.headers?.authorization ||
          req?.headers?.Authorization ||
          req?.connectionParams?.Authorization;
        return { req, authorization };
      },
      subscriptions: {
        'graphql-ws': {
          onConnect: (ctx) => {
            const authorization = ctx.connectionParams?.Authorization as string;
            if (authorization) {
              try {
                const jwtService = new JwtService({ secret: process.env.JWT_SECRET! });
                const payload = jwtService.verify(authorization.replace('Bearer ', ''));
                return { user: payload, authorization };
              } catch {
                throw new Error('Unauthorized');
              }
            }
            return {};
          },
          onDisconnect: (_ctx, _code, _reason) => {
            new Logger('GraphQLWS').log('GraphQL WS disconnected');
          },
        },
      },
    }),
    EventsModule,
    GatewayModule,
    SeedModule,
    AuthModule,
    TasksModule,
    CommentsModule,
  ],
})
export class AppModule {}
