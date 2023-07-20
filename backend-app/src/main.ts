import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotFoundInterceptor } from './exceptions/not-found.interceptor';
import { TypeormExceptionFilter } from './exceptions/typeorm-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.useGlobalFilters(new TypeormExceptionFilter());
	app.useGlobalInterceptors(new NotFoundInterceptor);
	await app.listen(3001);
}

bootstrap();
