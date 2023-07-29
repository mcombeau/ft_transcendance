import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotFoundInterceptor } from './exceptions/not-found.interceptor';
import { TypeormExceptionFilter } from './exceptions/typeorm-exception.filter';
import { BadRequestInterceptor } from './exceptions/bad-request.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.useGlobalFilters(new TypeormExceptionFilter());
	app.useGlobalInterceptors(new NotFoundInterceptor);
	app.useGlobalInterceptors(new BadRequestInterceptor);

	const config = new DocumentBuilder()
		.setTitle('ft_transcendance Backend Documentation')
		.setDescription('Backend documentation for ft_transcendance')
    	.setVersion('1.0')
    	.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('', app, document);
	
	await app.listen(3001);
}

bootstrap();
