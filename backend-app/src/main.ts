import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotFoundInterceptor } from './exceptions/not-found.interceptor';
import { TypeormExceptionFilter } from './exceptions/typeorm-exception.filter';
import { BadRequestInterceptor } from './exceptions/bad-request.interceptor';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Ft_Transcendance')
    .setDescription('The ft_transcendance API documentation')
    .setVersion('1.0')
    .addTag('transcendance')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);

  app.enableCors();
  app.useGlobalFilters(new TypeormExceptionFilter());
  app.useGlobalInterceptors(new NotFoundInterceptor());
  app.useGlobalInterceptors(new BadRequestInterceptor());
  app.use(cookieParser());
  await app.listen(3001);
}

bootstrap();
