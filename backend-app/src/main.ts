import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotFoundInterceptor } from './exceptions/not-found.interceptor';
import { TypeormExceptionFilter } from './exceptions/typeorm-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	// app.enableCors({
	// 	allowedHeaders: ['content-type'],
	// 	origin: [
	// 		'',
	// 		'localhost',
	// 		'http://localhost',
	// 		'http://localhost',
	// 		'http://localhost/backend',
	// 		'http://localhost:3000',
	// 		'http://localhost:80',
	// 	  'https://auth.42.fr',
	// 	  'https://auth.42.fr/',
	// 	  'https://api.intra.42.fr',
	// 	  'https://api.intra.42.fr/',
	// 	  'https://api.intra.42.fr/oauth/',
	// 	  'https://api.intra.42.fr/oauth/authorize?',
	// 	  'https://api.intra.42.fr/oauth/authorize?*',
	// 	  'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-5bc97c50c4272f69f40976b44b45a630d5d9bc01a55644fbd6ab4e391c549ff5&redirect_uri=http://localhost:3001/callback&response_type=code',
	// 	  'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-5bc97c50c4272f69f40976b44b45a630d5d9bc01a55644fbd6ab4e391c549ff5&redirect_uri=http://localhost:3001/callback&response_type=code/'
	// 	],
	// 	methods: ["GET", "POST"],
	// 	credentials: true,
	//   });
	app.useGlobalInterceptors(new NotFoundInterceptor);
	// const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new TypeormExceptionFilter());
	await app.listen(3001);
}

bootstrap();
