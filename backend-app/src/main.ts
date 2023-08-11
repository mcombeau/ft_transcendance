import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotFoundInterceptor } from './exceptions/not-found.interceptor';
import { TypeormExceptionFilter } from './exceptions/typeorm-exception.filter';
import { BadRequestInterceptor } from './exceptions/bad-request.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.useGlobalFilters(new TypeormExceptionFilter());
	app.useGlobalInterceptors(new NotFoundInterceptor);
	app.useGlobalInterceptors(new BadRequestInterceptor);
	await app.listen(3001);
}

bootstrap();
