import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, ValidationError, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { TypeOrmExceptionFilter } from './shared/filters/typeorm-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((err) =>
          Object.values(err.constraints || {}).join(', '),
        );
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new TypeOrmExceptionFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Qualle Task API')
    .setDescription('Sistema de Gestão de Projetos - API GraphQL')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Application running on http://localhost:${port}/graphql`);
}

bootstrap();
