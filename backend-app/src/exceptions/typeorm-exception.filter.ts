import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import {
	CannotCreateEntityIdMapError,
	EntityNotFoundError,
	QueryFailedError,
} from 'typeorm';
import {Response, Request} from 'express';

@Catch(QueryFailedError, EntityNotFoundError, CannotCreateEntityIdMapError)
export class TypeormExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		let message = (exception as any).message.message;
		let code = 'HttpException';

		Logger.error(
			message,
			(exception as any).stack,
			`${request.method} ${request.url}`,
		);

		let status = HttpStatus.INTERNAL_SERVER_ERROR;

		switch (exception.constructor) {
			case HttpException:
				status = (exception as HttpException).getStatus();
				break;
			case QueryFailedError:
				status = HttpStatus.UNPROCESSABLE_ENTITY;
				message = (exception as QueryFailedError).message;
				code = (exception as any).code;
				break;
			case EntityNotFoundError:
				status = HttpStatus.UNPROCESSABLE_ENTITY;
				message = (exception as EntityNotFoundError).message;
				code = (exception as any).code;
				break;
			case CannotCreateEntityIdMapError:
				status = HttpStatus.UNPROCESSABLE_ENTITY;
				message = (exception as CannotCreateEntityIdMapError).message;
				code = (exception as any).code;
				break;
			default:
				status = HttpStatus.INTERNAL_SERVER_ERROR;
		}
		response.status(status).json({
			statusCode: status,
			message: message,
			code: code,
		});
	}
}

