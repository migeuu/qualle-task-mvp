import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { JwtService } from '@nestjs/jwt';
import { join } from 'path';
import { CoreModule } from './modules/core/core.module';
import { GatewayModule } from './gateway/gateway.module';
import { SeedModule } from './seed/seed.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_DATABASE!,
      entities: [__dirname + '/**/*.typeorm-entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      migrationsTableName: 'typeorm_migrations',
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      migrationsRun: process.env.DB_SYNCHRONIZE !== 'true',
      logging: process.env.DB_LOGGING === 'true',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      csrfPrevention: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          embed: true,
          includeCookies: true,
        }),
      ],
      includeStacktraceInErrorResponses: false,
      formatError: (formattedError: GraphQLFormattedError) => {
        const original = formattedError.extensions?.originalError;
        if (original instanceof HttpException) {
          const status = original.getStatus();
          return {
            message: original.message,
            extensions: {
              code: HttpStatus[status] || 'INTERNAL_SERVER_ERROR',
              status,
            },
          };
        }
        return formattedError;
      },
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
                const jwtService = new JwtService({
                  secret: process.env.JWT_SECRET!,
                });
                const payload = jwtService.verify(
                  authorization.replace('Bearer ', ''),
                );
                return { user: payload, authorization };
              } catch (err) {
                const logger = new Logger('GraphQLWS');
                logger.warn(
                  `Subscription connection rejected: ${err instanceof Error ? err.message : 'Invalid token'}`,
                );
                throw new Error('Unauthorized');
              }
            }
            return { user: undefined };
          },
          onDisconnect: (_ctx, _code, _reason) => {
            new Logger('GraphQLWS').log('GraphQL WS disconnected');
          },
        },
      },
    }),
    CoreModule,
    GatewayModule,
    SeedModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
